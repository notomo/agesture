import { describe, expect, it, test } from "vitest";
import { findGesture, getSetting, importSetting } from "./setting";

describe("import and export", () => {
  it("can deal default setting", async () => {
    const setting = await getSetting();
    await importSetting(JSON.stringify(setting));

    const got = await getSetting();

    expect(got).toEqual(setting);
  });
});

describe("find gesture", () => {
  test("returns the matching gesture when found", () => {
    const got = findGesture(
      {
        gestures: [
          {
            inputs: ["UP", "DOWN"],
            action: { name: "bookmark" },
          },
          {
            inputs: ["LEFT", "RIGHT"],
            action: { name: "bookmark" },
          },
        ],
      },
      ["LEFT", "RIGHT"],
    );

    expect(got).toEqual({
      inputs: ["LEFT", "RIGHT"],
      action: { name: "bookmark" },
    });
  });

  test("returns undefined when no matching gesture is found", () => {
    const got = findGesture(
      {
        gestures: [
          {
            inputs: ["UP", "DOWN"],
            action: { name: "bookmark" },
          },
        ],
      },
      ["LEFT", "RIGHT"],
    );

    expect(got).toBeUndefined();
  });
});
