import { safeParse } from "valibot";
import { describe, expect, test } from "vitest";
import type { Direction } from "./direction";
/**
 * Tests for setting module
 */
import {
  DirectionSchema,
  type Gesture,
  GestureActionSchema,
  GestureSchema,
  type Settings,
  SettingsSchema,
  findGestureByDirections,
} from "./setting";

describe("Valibot Schemas", () => {
  describe("DirectionSchema", () => {
    test("validates valid directions", () => {
      const result1 = safeParse(DirectionSchema, "UP");
      expect(result1.success).toBe(true);

      const result2 = safeParse(DirectionSchema, "DOWN");
      expect(result2.success).toBe(true);

      const result3 = safeParse(DirectionSchema, "LEFT");
      expect(result3.success).toBe(true);

      const result4 = safeParse(DirectionSchema, "RIGHT");
      expect(result4.success).toBe(true);
    });

    test("rejects invalid directions", () => {
      const result1 = safeParse(DirectionSchema, "DIAGONAL");
      expect(result1.success).toBe(false);

      const result2 = safeParse(DirectionSchema, "");
      expect(result2.success).toBe(false);

      const result3 = safeParse(DirectionSchema, 123);
      expect(result3.success).toBe(false);
    });
  });

  describe("GestureActionSchema", () => {
    test("validates valid gesture actions", () => {
      const validAction = {
        name: "testAction",
        args: ["arg1", 2, { key: "value" }],
      };
      const result = safeParse(GestureActionSchema, validAction);
      expect(result.success).toBe(true);
    });

    test("rejects invalid gesture actions", () => {
      // Missing name
      const result1 = safeParse(GestureActionSchema, { args: [] });
      expect(result1.success).toBe(false);

      // Name not a string
      const result2 = safeParse(GestureActionSchema, { name: 123, args: [] });
      expect(result2.success).toBe(false);

      // Args not an array
      const result3 = safeParse(GestureActionSchema, {
        name: "test",
        args: "not an array",
      });
      expect(result3.success).toBe(false);
    });
  });

  describe("GestureSchema", () => {
    test("validates valid gestures", () => {
      const validGesture = {
        inputs: ["UP", "DOWN"],
        action: { name: "testAction", args: [] },
      };
      const result = safeParse(GestureSchema, validGesture);
      expect(result.success).toBe(true);
    });

    test("rejects invalid gestures", () => {
      // Missing inputs
      const result1 = safeParse(GestureSchema, {
        action: { name: "test", args: [] },
      });
      expect(result1.success).toBe(false);

      // Invalid direction in inputs
      const result2 = safeParse(GestureSchema, {
        inputs: ["UP", "INVALID"],
        action: { name: "test", args: [] },
      });
      expect(result2.success).toBe(false);

      // Invalid action
      const result3 = safeParse(GestureSchema, {
        inputs: ["UP", "DOWN"],
        action: { name: 123, args: [] },
      });
      expect(result3.success).toBe(false);
    });
  });

  describe("SettingsSchema", () => {
    test("validates valid settings", () => {
      const validSettings = {
        gestures: [
          {
            inputs: ["UP", "DOWN"],
            action: { name: "testAction1", args: [] },
          },
          {
            inputs: ["LEFT", "RIGHT"],
            action: { name: "testAction2", args: [1, 2, 3] },
          },
        ],
      };
      const result1 = safeParse(SettingsSchema, validSettings);
      expect(result1.success).toBe(true);

      // Empty gestures array is also valid
      const result2 = safeParse(SettingsSchema, { gestures: [] });
      expect(result2.success).toBe(true);
    });

    test("rejects invalid settings", () => {
      // Missing gestures property
      const result1 = safeParse(SettingsSchema, {});
      expect(result1.success).toBe(false);

      // Gestures not an array
      const result2 = safeParse(SettingsSchema, { gestures: "not an array" });
      expect(result2.success).toBe(false);

      // Invalid gesture in array
      const result3 = safeParse(SettingsSchema, {
        gestures: [
          {
            inputs: ["INVALID"],
            action: { name: "test", args: [] },
          },
        ],
      });
      expect(result3.success).toBe(false);
    });
  });
});

describe("findGestureByDirections", () => {
  test("returns the matching gesture when found", () => {
    // Setup
    const gesture1: Gesture = {
      inputs: ["UP", "DOWN"],
      action: { name: "test1", args: [] },
    };

    const gesture2: Gesture = {
      inputs: ["LEFT", "RIGHT"],
      action: { name: "test2", args: [] },
    };

    const settings: Settings = {
      gestures: [gesture1, gesture2],
    };

    const directions: Direction[] = ["LEFT", "RIGHT"];

    // Execute
    const result = findGestureByDirections(settings, directions);

    // Verify
    expect(result).toEqual(gesture2);
  });

  test("returns undefined when no matching gesture is found", () => {
    // Setup
    const gesture: Gesture = {
      inputs: ["UP", "DOWN"],
      action: { name: "test", args: [] },
    };

    const settings: Settings = {
      gestures: [gesture],
    };

    const directions: Direction[] = ["LEFT", "RIGHT"];

    // Execute
    const result = findGestureByDirections(settings, directions);

    // Verify
    expect(result).toBeUndefined();
  });

  test("returns undefined when gestures array is empty", () => {
    // Setup
    const settings: Settings = {
      gestures: [],
    };

    const directions: Direction[] = ["LEFT", "RIGHT"];

    // Execute
    const result = findGestureByDirections(settings, directions);

    // Verify
    expect(result).toBeUndefined();
  });
});
