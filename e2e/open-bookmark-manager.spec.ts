import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function callAction(page: Page, action: unknown) {
  await page.evaluate(
    (action) =>
      chrome.runtime.sendMessage({
        type: "piemenuAction",
        action,
        context: { selectedText: "" },
      }),
    action,
  );
}

test.describe("openBookmarkManager action", () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/bookmark-manager.html`);
  });

  test("opens this extension's manager by default", async ({
    page,
    context,
    extensionId,
  }) => {
    const opened = context.waitForEvent("page");
    await callAction(page, {
      name: "openBookmarkManager",
      args: { path: "other" },
    });

    expect((await opened).url()).toBe(
      `chrome-extension://${extensionId}/bookmark-manager.html#other`,
    );
  });

  test("opens chrome's manager with current folder id", async ({
    page,
    context,
    background,
  }) => {
    const otherId = await background.evaluate(async () => {
      const [root] = await chrome.bookmarks.getTree();
      return root?.children?.find((x) => x.folderType === "other")?.id;
    });

    const opened = context.waitForEvent("page");
    await callAction(page, {
      name: "openBookmarkManager",
      args: { path: "other", manager: "chrome" },
    });

    const openedPage = await opened;
    await expect
      .poll(() => openedPage.url())
      .toBe(`chrome://bookmarks/?id=${otherId}`);
  });
});
