import { describe, expect, it } from "vitest";
import { rectFromPoints, rectsIntersect } from "./rect";

describe("rectFromPoints", () => {
  it("normalizes points dragged in any direction", () => {
    expect(rectFromPoints({ x: 10, y: 20 }, { x: 0, y: 5 })).toEqual({
      left: 0,
      top: 5,
      right: 10,
      bottom: 20,
    });
  });
});

describe("rectsIntersect", () => {
  const base = { left: 0, top: 0, right: 10, bottom: 10 };

  it("returns true for overlapping rects", () => {
    expect(
      rectsIntersect(base, { left: 5, top: 5, right: 15, bottom: 15 }),
    ).toBe(true);
  });

  it("returns false for rects that only touch or are apart", () => {
    expect(
      rectsIntersect(base, { left: 10, top: 0, right: 20, bottom: 10 }),
    ).toBe(false);
    expect(
      rectsIntersect(base, { left: 0, top: 11, right: 10, bottom: 20 }),
    ).toBe(false);
  });
});
