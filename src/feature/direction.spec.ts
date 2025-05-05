import { beforeEach, describe, expect, it } from "vitest";
import {
  type DirectionState,
  type Point,
  addPoint,
  createDirectionRecognizer,
  createInitialState,
  detectDirection,
  getDirectionsString,
  resetState,
} from "./direction";

describe("Direction Recognition", () => {
  let state: DirectionState;

  beforeEach(() => {
    // Reset state before each test
    state = createInitialState({
      minDistance: 10, // Set smaller distance for testing
    });
  });

  it("should have empty directions in initial state", () => {
    expect(state.directions).toEqual([]);
    expect(getDirectionsString(state)).toBe("");
  });

  it("should add points to points array", () => {
    const point: Point = { x: 10, y: 20 };
    state = addPoint(state, point);
    expect(state.points).toEqual([point]);
  });

  it("should detect direction between two points", () => {
    // Test right direction
    expect(detectDirection({ x: 0, y: 0 }, { x: 15, y: 0 }, 10)).toBe("RIGHT");

    // Test left direction
    expect(detectDirection({ x: 15, y: 0 }, { x: 0, y: 0 }, 10)).toBe("LEFT");

    // Test up direction
    expect(detectDirection({ x: 0, y: 15 }, { x: 0, y: 0 }, 10)).toBe("UP");

    // Test down direction
    expect(detectDirection({ x: 0, y: 0 }, { x: 0, y: 15 }, 10)).toBe("DOWN");

    // Test minimum distance threshold
    expect(detectDirection({ x: 0, y: 0 }, { x: 5, y: 0 }, 10)).toBeNull();
  });

  it("should recognize right direction", () => {
    state = addPoint(state, { x: 0, y: 0 });
    state = addPoint(state, { x: 20, y: 0 }); // Right 20px
    expect(state.directions).toEqual(["RIGHT"]);
    expect(getDirectionsString(state)).toBe("RIGHT");
  });

  it("should recognize left direction", () => {
    state = addPoint(state, { x: 20, y: 0 });
    state = addPoint(state, { x: 0, y: 0 }); // Left 20px
    expect(state.directions).toEqual(["LEFT"]);
  });

  it("should recognize up direction", () => {
    state = addPoint(state, { x: 0, y: 20 });
    state = addPoint(state, { x: 0, y: 0 }); // Up 20px
    expect(state.directions).toEqual(["UP"]);
  });

  it("should recognize down direction", () => {
    state = addPoint(state, { x: 0, y: 0 });
    state = addPoint(state, { x: 0, y: 20 }); // Down 20px
    expect(state.directions).toEqual(["DOWN"]);
  });

  it("should recognize multiple consecutive directions", () => {
    state = addPoint(state, { x: 0, y: 0 });
    state = addPoint(state, { x: 20, y: 0 }); // Right
    state = addPoint(state, { x: 20, y: 20 }); // Down
    state = addPoint(state, { x: 0, y: 20 }); // Left
    state = addPoint(state, { x: 0, y: 0 }); // Up

    expect(state.directions).toEqual(["RIGHT", "DOWN", "LEFT", "UP"]);
    expect(getDirectionsString(state)).toBe("RIGHTDOWNLEFTUP");
  });

  it("should not recognize movements shorter than minimum distance", () => {
    state = addPoint(state, { x: 0, y: 0 });
    state = addPoint(state, { x: 5, y: 0 }); // Right 5px (minDistance is 10px)

    expect(state.directions).toEqual([]);
  });

  it("should count continuous movements in the same direction as one direction", () => {
    state = addPoint(state, { x: 0, y: 0 });
    state = addPoint(state, { x: 20, y: 0 }); // Right
    state = addPoint(state, { x: 40, y: 0 }); // Further right

    expect(state.directions).toEqual(["RIGHT"]);
  });

  it("should clear all state when reset", () => {
    state = addPoint(state, { x: 0, y: 0 });
    state = addPoint(state, { x: 20, y: 0 });

    expect(state.directions.length).toBe(1);
    expect(state.points.length).toBe(2);

    state = resetState();

    expect(state.directions).toEqual([]);
    expect(state.points).toEqual([]);
  });

  it("should work with createDirectionRecognizer factory function", () => {
    const newState = createDirectionRecognizer({ minDistance: 15 });

    expect(newState.config.minDistance).toBe(15);
    expect(newState.directions).toEqual([]);
  });
});
