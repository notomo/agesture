import { describe, expect, it } from "vitest";
import type { Gesture } from "./gesture-matcher";
import { extractActionName, findMatchingGesture } from "./gesture-matcher";

describe("findMatchingGesture", () => {
  const mockGestures: Gesture[] = [
    {
      inputs: ["UP"],
      action: { name: "openLink", args: { active: true } },
    },
    {
      inputs: ["DOWN", "RIGHT"],
      action: { name: "search" },
    },
  ];

  it("should find exact match", () => {
    const result = findMatchingGesture({
      directions: ["UP"],
      gestures: mockGestures,
    });
    expect(result).toEqual(mockGestures[0]);
  });

  it("should return null for no match", () => {
    const result = findMatchingGesture({
      directions: ["LEFT"],
      gestures: mockGestures,
    });
    expect(result).toBeNull();
  });

  it("should return null for partial match", () => {
    const result = findMatchingGesture({
      directions: ["DOWN"],
      gestures: mockGestures,
    });
    expect(result).toBeNull();
  });
});

describe("extractActionName", () => {
  it("should extract single action name", () => {
    const action = { name: "goForward" };
    expect(extractActionName(action as never)).toBe("goForward");
  });

  it("should extract first action name from array", () => {
    const actions = [{ name: "goForward" }, { name: "goBackward" }];
    expect(extractActionName(actions as never)).toBe("goForward");
  });

  it("should handle empty array", () => {
    expect(extractActionName([] as never)).toBe("");
  });
});
