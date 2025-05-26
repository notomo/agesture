import { describe, expect, it, test } from "vitest";
import { exportSettingToJson, findGesture, importSetting } from "./setting";

describe("import and export", () => {
  it("can deal default setting", async () => {
    const exported = await exportSettingToJson();
    await importSetting(exported);

    const got = await exportSettingToJson();

    expect(got).toEqual(exported);
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
