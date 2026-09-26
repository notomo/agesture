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

async function getChildren(background: Worker, parentId: string) {
  return await background.evaluate(
    async (id) =>
      (await chrome.bookmarks.getChildren(id)).map(({ title, url }) =>
        url === undefined ? { title } : { title, url },
      ),
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

  test("deletes from menu and undoes", async ({ page, background }) => {
    await row(page, "c").getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    await expect(page.getByText('Deleted "c"')).toBeVisible();
    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["work", "a", "b", "d"]);

    await page.getByRole("button", { name: "Undo" }).click();

    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["work", "a", "b", "c", "d"]);
  });

  test("edits from menu", async ({ page, background }) => {
    await row(page, "a").getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    const dialog = page.getByRole("dialog", { name: "Edit bookmark" });
    await dialog.getByLabel("Name").fill("renamed");
    await dialog.getByLabel("URL").fill("example.com/renamed");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).toBeHidden();
    await expect
      .poll(() => getChildren(background, barId))
      .toContainEqual({ title: "renamed", url: "https://example.com/renamed" });
  });

  test("adds bookmark and folder", async ({ page, background }) => {
    await page.getByRole("button", { name: "Add bookmark" }).click();
    const bookmarkDialog = page.getByRole("dialog", { name: "Add bookmark" });
    await bookmarkDialog.getByLabel("Name").fill("new");
    await bookmarkDialog.getByLabel("URL").fill("example.com/new");
    await bookmarkDialog.getByRole("button", { name: "Save" }).click();
    await expect(bookmarkDialog).toBeHidden();

    await page.getByRole("button", { name: "Add folder" }).click();
    const folderDialog = page.getByRole("dialog", { name: "Add folder" });
    await expect(folderDialog.getByLabel("URL")).toHaveCount(0);
    await folderDialog.getByLabel("Name").fill("new folder");
    await folderDialog.getByRole("button", { name: "Save" }).click();
    await expect(folderDialog).toBeHidden();

    await expect
      .poll(async () => (await getChildren(background, barId)).slice(-2))
      .toEqual([
        { title: "new", url: "https://example.com/new" },
        { title: "new folder" },
      ]);
    await expect(row(page, "new folder")).toBeVisible();
  });

  test("selects by rect and deletes by keyboard", async ({
    page,
    background,
  }) => {
    const list = await page.locator("main ul").boundingBox();
    const b = await row(page, "b").boundingBox();
    if (!list || !b) {
      throw new Error("list is not visible");
    }
    // drag from empty area below the list up to "b"
    await page.mouse.move(list.x + list.width / 2, list.y + list.height + 40);
    await page.mouse.down();
    await page.mouse.move(list.x + list.width / 3, b.y + b.height / 2, {
      steps: 5,
    });
    await page.mouse.up();

    await expect(page.locator('main li[data-selected="true"]')).toHaveCount(3);

    await page.keyboard.press("Delete");

    await expect(page.getByText("Deleted 3 items")).toBeVisible();
    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["work", "a"]);

    await page.keyboard.press("Control+z");

    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["work", "a", "b", "c", "d"]);
  });

  test("moves selected bookmarks together", async ({ page, background }) => {
    const list = await page.locator("main ul").boundingBox();
    const c = await row(page, "c").boundingBox();
    if (!list || !c) {
      throw new Error("list is not visible");
    }
    await page.mouse.move(list.x + list.width / 2, list.y + list.height + 40);
    await page.mouse.down();
    await page.mouse.move(list.x + list.width / 3, c.y + c.height / 2, {
      steps: 5,
    });
    await page.mouse.up();
    await expect(page.locator('main li[data-selected="true"]')).toHaveCount(2);

    await dragTo({
      source: row(page, "d"),
      target: row(page, "work"),
      ratio: 0.5,
    });

    await expect
      .poll(() => getChildTitles(background, barId))
      .toEqual(["work", "a", "b"]);
    await row(page, "work").getByRole("link").click();
    await expect(row(page, "c")).toBeVisible();
    await expect(row(page, "d")).toBeVisible();
  });

  test("selects all and clears selection by keyboard", async ({ page }) => {
    const selected = page.locator('main li[data-selected="true"]');

    await page.keyboard.press("Control+a");
    await expect(selected).toHaveCount(5);

    await page.keyboard.press("Escape");
    await expect(selected).toHaveCount(0);
  });

  test("focuses search by slash", async ({ page }) => {
    await page.keyboard.press("/");
    await page.keyboard.type("docs");

    await expect(row(page, "docs")).toBeVisible();
    await expect(row(page, "a")).toBeHidden();
  });

  test("shows shallow folders in tree by default", async ({ page }) => {
    await expect(
      page.locator("nav").getByRole("link", { name: "work" }),
    ).toBeVisible();
  });

  test("opens folder by clicking anywhere in tree row except toggle", async ({
    page,
  }) => {
    const treeRow = page
      .locator("nav li > div")
      .filter({ has: page.getByRole("link", { name: "work", exact: true }) });
    const box = await treeRow.boundingBox();
    if (!box) {
      throw new Error("tree row is not visible");
    }

    // top edge and right end, outside of the folder name
    await treeRow.click({ position: { x: box.width - 16, y: 2 } });

    await expect(row(page, "docs")).toBeVisible();
  });

  test("toggles tree folder by double click", async ({ page }) => {
    const nav = page.locator("nav");
    const barRow = nav
      .locator("li > div")
      .filter({ has: page.getByRole("link", { name: "Bookmarks bar" }) });
    const work = nav.getByRole("link", { name: "work", exact: true });
    await expect(work).toBeVisible();

    await barRow.dblclick();
    await expect(work).toBeHidden();

    await barRow.dblclick();
    await expect(work).toBeVisible();

    // double click on toggle button toggles only by its clicks
    await barRow.getByRole("button", { name: "Collapse" }).dblclick();
    await expect(work).toBeVisible();
  });

  test("aligns search box center with list center", async ({ page }) => {
    const search = await page
      .getByPlaceholder(/Search bookmarks/)
      .boundingBox();
    const list = await page.locator("main ul").boundingBox();
    if (!search || !list) {
      throw new Error("not visible");
    }
    expect(
      Math.abs(search.x + search.width / 2 - (list.x + list.width / 2)),
    ).toBeLessThanOrEqual(1);
  });
});
