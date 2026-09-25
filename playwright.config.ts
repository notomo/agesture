import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // extension is loaded into a persistent context per test
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  use: {
    trace: "retain-on-failure",
  },
});
