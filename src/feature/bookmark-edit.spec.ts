import { describe, expect, it } from "vitest";
import {
  buildMoveDestination,
  canMove,
  getDropPosition,
  normalizeUrl,
  sortForRestore,
} from "./bookmark-edit";
import type { BookmarkNode } from "./bookmark-path";

const bookmark: BookmarkNode = {
  id: "11",
  parentId: "10",
  index: 2,
  title: "a",
  url: "https://example.com",
};

const folder: BookmarkNode = {
  id: "12",
  parentId: "10",
  index: 3,
  title: "f",
  children: [],
};

const roots: BookmarkNode[] = [
  {
    id: "1",
    title: "Bookmarks bar",
    folderType: "bookmarks-bar",
    children: [
      {
        id: "10",
        parentId: "1",
        index: 0,
        title: "parent",
        children: [
          {
            id: "20",
            parentId: "10",
            index: 0,
            title: "child",
            children: [],
          },
        ],
      },
      {
        id: "30",
        parentId: "1",
        index: 1,
        title: "managed",
        unmodifiable: "managed",
        children: [],
      },
    ],
  },
];

describe("getDropPosition", () => {
  it("splits bookmark into before and after", () => {
    expect(getDropPosition({ ratio: 0.49, target: bookmark })).toBe("before");
    expect(getDropPosition({ ratio: 0.5, target: bookmark })).toBe("after");
  });

  it("can drop into folder at the middle", () => {
    expect(getDropPosition({ ratio: 0.1, target: folder })).toBe("before");
    expect(getDropPosition({ ratio: 0.5, target: folder })).toBe("into");
    expect(getDropPosition({ ratio: 0.9, target: folder })).toBe("after");
  });
});

describe("buildMoveDestination", () => {
  it("uses target index for before and next index for after", () => {
    expect(
      buildMoveDestination({ target: bookmark, position: "before" }),
    ).toEqual({ parentId: "10", index: 2 });
    expect(
      buildMoveDestination({ target: bookmark, position: "after" }),
    ).toEqual({ parentId: "10", index: 3 });
  });

  it("appends to folder for into", () => {
    expect(buildMoveDestination({ target: folder, position: "into" })).toEqual({
      parentId: "12",
    });
  });
});

describe("canMove", () => {
  it("allows moving to another folder", () => {
    expect(
      canMove({ roots, sourceId: "20", destination: { parentId: "1" } }),
    ).toBe(true);
  });

  it("rejects moving folder into itself or its descendant", () => {
    expect(
      canMove({ roots, sourceId: "10", destination: { parentId: "10" } }),
    ).toBe(false);
    expect(
      canMove({ roots, sourceId: "10", destination: { parentId: "20" } }),
    ).toBe(false);
  });

  it("rejects moving root or unmodifiable node", () => {
    expect(
      canMove({ roots, sourceId: "1", destination: { parentId: "10" } }),
    ).toBe(false);
    expect(
      canMove({ roots, sourceId: "20", destination: { parentId: "30" } }),
    ).toBe(false);
  });
});

describe("sortForRestore", () => {
  it("sorts by index ascending", () => {
    const got = sortForRestore([
      { id: "a", title: "a", index: 3 },
      { id: "b", title: "b", index: 1 },
      { id: "c", title: "c", index: 2 },
    ]);
    expect(got.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });
});

describe("normalizeUrl", () => {
  it("keeps URL with scheme", () => {
    expect(normalizeUrl(" https://example.com/a ")).toBe(
      "https://example.com/a",
    );
    expect(normalizeUrl("chrome://settings")).toBe("chrome://settings");
  });

  it("adds https to URL without scheme", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("returns undefined for empty or invalid input", () => {
    expect(normalizeUrl("  ")).toBeUndefined();
    expect(normalizeUrl("exa mple.com")).toBeUndefined();
  });
});
