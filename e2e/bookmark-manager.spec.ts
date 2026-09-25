import type { Locator, Page, Worker } from "@playwright/test";
import { expect, test } from "./fixtures";

async function setupBookmarks(background: Worker) {
  return await background.evaluate(async () => {
    const [root] = await chrome.bookmarks.getTree();
    const bar = root?.children?.find((x) => x.folderType === "bookmarks-bar");
    if (!bar) {
      throw new Error("bookmarks bar is not found");
    }
    const work = await chrome.bookmarks.create({
      parentId: bar.id,
      title: "work",
    });
    await chrome.bookmarks.create({
      parentId: work.id,
      title: "docs",
      url: "https://example.com/docs",
    });
    for (const title of ["a", "b", "c", "d"]) {
      await chrome.bookmarks.create({
        parentId: bar.id,
        title,
        url: `https://example.com/${title}`,
      });
    }
    return bar.id;
  });
}

async function getChildTitles(background: Worker, parentId: string) {
  return await background.evaluate(
    async (id) => (await chrome.bookmarks.getChildren(id)).map((x) => x.title),
    parentId,
  );
}

function row(page: Page, title: string) {
  return page
    .locator("main li")
    .filter({ has: page.getByText(title, { exact: true }) });
}

async function dragTo({
  source,
  target,
  ratio,
}: {
  source: Locator;
  target: Locator;
  ratio: number;
}) {
  const box = await target.boundingBox();
  if (!box) {
    throw new Error("target is not visible");
  }
  await source.dragTo(target, {
    targetPosition: { x: box.width / 2, y: box.height * ratio },
  });
}

test.describe("bookmark manager", () => {
  let barId: string;

  test.beforeEach(async ({ background, extensionId, page }) => {
    barId = await setupBookmarks(background);
    await page.goto(`chrome-extension://${extensionId}/bookmark-manager.html`);
    await expect(row(page, "d")).toBeVisible();
  });

  test("shows bookmarks bar by default", async ({ background }) => {
    expect(await getChildTitles(background, barId)).toEqual([
      "work",
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  test("opens folder by stable path", async ({ page }) => {
    await row(page, "work").getByRole("link").click();

    await expect(row(page, "docs")).toBeVisible();
    expect(new URL(page.url()).hash).toBe("#bookmarks-bar/work");
  });

  test("reorders forward", async ({ page, background }) => {
    await dragTo({
      source: row(page, "a"),
      target: row(page, "c"),
      ratio: 0.9,
    });

    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["work", "b", "c", "a", "d"]);
  });

  test("reorders backward", async ({ page, background }) => {
    await dragTo({
      source: row(page, "d"),
      target: row(page, "work"),
      ratio: 0.1,
    });

    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["d", "work", "a", "b", "c"]);
  });

  test("moves into folder", async ({ page, background }) => {
    await dragTo({
      source: row(page, "b"),
      target: row(page, "work"),
      ratio: 0.5,
    });

    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["work", "a", "c", "d"]);
  });

  test("deletes and undoes", async ({ page, background }) => {
    await row(page, "c").getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText('Deleted "c"')).toBeVisible();
    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["work", "a", "b", "d"]);

    await page.getByRole("button", { name: "Undo" }).click();

    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["work", "a", "b", "c", "d"]);
  });
});
