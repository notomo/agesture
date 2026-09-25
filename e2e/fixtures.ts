import path from "node:path";
import {
  type BrowserContext,
  test as base,
  chromium,
  type Worker,
} from "@playwright/test";

const extensionPath = path.resolve(
  import.meta.dirname,
  "../.output/chrome-mv3",
);

export const test = base.extend<{
  context: BrowserContext;
  background: Worker;
  extensionId: string;
}>({
  // biome-ignore lint/correctness/noEmptyPattern: playwright fixture requires object destructuring
  context: async ({}, use, testInfo) => {
    const context = await chromium.launchPersistentContext(
      testInfo.outputPath("user-data"),
      {
        // new headless mode supports extensions
        channel: "chromium",
        headless: true,
        viewport: { width: 1200, height: 700 },
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
        ],
      },
    );
    await use(context);
    await context.close();
  },
  background: async ({ context }, use) => {
    const worker =
      context.serviceWorkers().at(0) ??
      (await context.waitForEvent("serviceworker"));
    await use(worker);
  },
  extensionId: async ({ background }, use) => {
    await use(new URL(background.url()).host);
  },
});

export const expect = test.expect;
