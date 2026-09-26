import { describe, expect, it } from "vitest";
import {
  type BookmarkNode,
  buildBookmarkManagerUrl,
  buildFolderPath,
  decodeFolderPath,
  encodeFolderPath,
  findFolderByPath,
} from "./bookmark-path";

const roots: BookmarkNode[] = [
  {
    id: "1",
    title: "Bookmarks bar",
    folderType: "bookmarks-bar",
    syncing: false,
    children: [],
  },
  {
    id: "2",
    title: "Other bookmarks",
    folderType: "other",
    syncing: false,
    children: [
      {
        id: "10",
        title: "work",
        children: [
          { id: "11", title: "docs", url: "https://example.com/docs" },
          { id: "12", title: "docs", children: [] },
          { id: "13", title: "a/b", children: [] },
        ],
      },
    ],
  },
  {
    id: "3",
    title: "Other bookmarks",
    folderType: "other",
    syncing: true,
    children: [{ id: "20", title: "work", children: [] }],
  },
];

describe("findFolderByPath", () => {
  it("resolves by folderType without depending on root id", () => {
    const got = findFolderByPath({ roots, segments: ["bookmarks-bar"] });
    expect(got?.id).toBe("1");
  });

  it("prefers syncing root", () => {
    const got = findFolderByPath({ roots, segments: ["other", "work"] });
    expect(got?.id).toBe("20");
  });

  it("prefers local root with @local", () => {
    const got = findFolderByPath({ roots, segments: ["other@local", "work"] });
    expect(got?.id).toBe("10");
  });

  it("falls back to another root with the same folderType", () => {
    const got = findFolderByPath({
      roots,
      segments: ["other", "work", "docs"],
    });
    expect(got?.id).toBe("12");
  });

  it("returns undefined if not found", () => {
    const got = findFolderByPath({ roots, segments: ["other", "notfound"] });
    expect(got).toBeUndefined();
  });
});

describe("buildFolderPath", () => {
  it("adds @local only for local root that has syncing sibling", () => {
    expect(buildFolderPath({ roots, nodeId: "12" })).toEqual([
      "other@local",
      "work",
      "docs",
    ]);
    expect(buildFolderPath({ roots, nodeId: "20" })).toEqual(["other", "work"]);
    expect(buildFolderPath({ roots, nodeId: "1" })).toEqual(["bookmarks-bar"]);
  });

  it("round trips with findFolderByPath via encoded path", () => {
    const segments = buildFolderPath({ roots, nodeId: "13" }) ?? [];
    const path = encodeFolderPath(segments);
    expect(path).toBe("other@local/work/a%2Fb");
    const got = findFolderByPath({ roots, segments: decodeFolderPath(path) });
    expect(got?.id).toBe("13");
  });
});

describe("buildBookmarkManagerUrl", () => {
  const managerUrl = "chrome-extension://id/bookmark-manager.html";

  it("opens this extension's manager by path", () => {
    expect(
      buildBookmarkManagerUrl({
        roots,
        path: "other/work",
        manager: "agesture",
        managerUrl,
      }),
    ).toBe(`${managerUrl}#other/work`);
  });

  it("opens chrome's manager by current folder id resolved from path", () => {
    expect(
      buildBookmarkManagerUrl({
        roots,
        path: "other@local/work/a%2Fb",
        manager: "chrome",
        managerUrl,
      }),
    ).toBe("chrome://bookmarks/?id=13");
  });

  it("returns undefined if chrome's manager folder is not found", () => {
    expect(
      buildBookmarkManagerUrl({
        roots,
        path: "other/notfound",
        manager: "chrome",
        managerUrl,
      }),
    ).toBeUndefined();
  });
});
