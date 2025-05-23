import { describe, expect, it, test } from "vitest";
import {
  exportSettingsToJson,
  findGestureByDirections,
  importSettingsFromJson,
} from "./setting";

describe("import and export", () => {
  it("can deal default setting", async () => {
    const exported = await exportSettingsToJson();
    await importSettingsFromJson(exported);

    const got = await exportSettingsToJson();

    expect(got).toEqual(exported);
  });
});

describe("findGestureByDirections", () => {
  test("returns the matching gesture when found", () => {
    const got = findGestureByDirections(
      {
        gestures: [
          {
            inputs: ["UP", "DOWN"],
            action: { name: "bookmark", args: [] },
          },
          {
            inputs: ["LEFT", "RIGHT"],
            action: { name: "bookmark", args: [] },
          },
        ],
      },
      ["LEFT", "RIGHT"],
    );

    expect(got).toEqual({
      inputs: ["LEFT", "RIGHT"],
      action: { name: "bookmark", args: [] },
    });
  });

  test("returns undefined when no matching gesture is found", () => {
    const got = findGestureByDirections(
      {
        gestures: [
          {
            inputs: ["UP", "DOWN"],
            action: { name: "bookmark", args: [] },
          },
        ],
      },
      ["LEFT", "RIGHT"],
    );

    expect(got).toBeUndefined();
  });

  test("returns undefined when gestures array is empty", () => {
    const got = findGestureByDirections(
      {
        gestures: [],
      },
      ["LEFT", "RIGHT"],
    );

    expect(got).toBeUndefined();
  });
});
