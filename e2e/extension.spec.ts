import { expect, test } from "./fixtures";

test("has fixed extension id by manifest key", async ({ extensionId }) => {
  expect(extensionId).toBe("gngfpbanmokepkcpgoebgnfgpfjhijhh");
});
