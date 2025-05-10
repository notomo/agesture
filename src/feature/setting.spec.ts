import { describe, expect, test } from "vitest";
import type { Direction } from "./direction";
/**
 * Tests for setting module
 */
import {
  type Gesture,
  type Settings,
  findGestureByDirections,
} from "./setting";

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
