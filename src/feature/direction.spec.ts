import { describe, expect, it } from "vitest";
import { directionEquals, fromPoints } from "./direction";

describe("Direction Recognition", () => {
  it("should recognize right direction", () => {
    const directions = fromPoints({
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
      ],
      minDistance: 20,
    });
    expect(directions).toEqual(["RIGHT"]);
  });

  it("should recognize left direction", () => {
    const directions = fromPoints({
      points: [
        { x: 20, y: 0 },
        { x: 0, y: 0 },
      ],
      minDistance: 20,
    });
    expect(directions).toEqual(["LEFT"]);
  });

  it("should recognize up direction", () => {
    const directions = fromPoints({
      points: [
        { x: 0, y: 20 },
        { x: 0, y: 0 },
      ],
      minDistance: 20,
    });
    expect(directions).toEqual(["UP"]);
  });

  it("should recognize down direction", () => {
    const directions = fromPoints({
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 20 },
      ],
      minDistance: 20,
    });
    expect(directions).toEqual(["DOWN"]);
  });

  it("should recognize multiple consecutive directions", () => {
    const directions = fromPoints({
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
        { x: 0, y: 20 },
        { x: 0, y: 0 },
      ],
      minDistance: 20,
    });
    expect(directions).toEqual(["RIGHT", "DOWN", "LEFT", "UP"]);
  });

  it("should not recognize movements shorter than minimum distance", () => {
    const directions = fromPoints({
      points: [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
      ],
      minDistance: 20,
    });
    expect(directions).toEqual([]);
  });

  it("should count continuous movements in the same direction as one direction", () => {
    const directions = fromPoints({
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 40, y: 0 },
      ],
      minDistance: 20,
    });
    expect(directions).toEqual(["RIGHT"]);
  });
});

describe("directionEquals", () => {
  it("should return true for identical direction arrays", () => {
    expect(directionEquals(["UP", "DOWN"], ["UP", "DOWN"])).toBe(true);
    expect(
      directionEquals(["RIGHT", "LEFT", "UP"], ["RIGHT", "LEFT", "UP"]),
    ).toBe(true);
    expect(directionEquals([], [])).toBe(true);
  });

  it("should return false for different direction arrays", () => {
    expect(directionEquals(["UP", "DOWN"], ["DOWN", "UP"])).toBe(false);
    expect(directionEquals(["RIGHT", "LEFT"], ["RIGHT", "LEFT", "UP"])).toBe(
      false,
    );
    expect(directionEquals(["UP", "DOWN"], [])).toBe(false);
  });
});
