/**
 * Bookmark editing (reorder, move, remove)
 */

import { type BookmarkNode, findNodeById, isFolder } from "./bookmark-path";

export type DropPosition = "before" | "after" | "into";

/**
 * @param ratio vertical cursor position in the target element (0: top, 1: bottom)
 */
export function getDropPosition({
  ratio,
  target,
}: {
  ratio: number;
  target: BookmarkNode;
}): DropPosition {
  if (!isFolder(target)) {
    return ratio < 0.5 ? "before" : "after";
  }
  if (ratio < 0.25) {
    return "before";
  }
  if (ratio > 0.75) {
    return "after";
  }
  return "into";
}

export type MoveDestination = {
  parentId: string;
  index?: number;
};

/**
 * index follows chrome.bookmarks.move: the position in the parent before the source is removed
 */
export function buildMoveDestination({
  target,
  position,
}: {
  target: BookmarkNode;
  position: DropPosition;
}): MoveDestination | undefined {
  if (position === "into") {
    return { parentId: target.id };
  }
  if (target.parentId === undefined || target.index === undefined) {
    return undefined;
  }
  return {
    parentId: target.parentId,
    index: position === "before" ? target.index : target.index + 1,
  };
}

function isSelfOrDescendant({
  roots,
  ancestorId,
  nodeId,
}: {
  roots: BookmarkNode[];
  ancestorId: string;
  nodeId: string;
}): boolean {
  let current: string | undefined = nodeId;
  while (current !== undefined) {
    if (current === ancestorId) {
      return true;
    }
    current = findNodeById({ roots, nodeId: current })?.parentId;
  }
  return false;
}

export function isEditable(node: BookmarkNode): boolean {
  // root folders (e.g. Bookmarks bar) have folderType and cannot be modified
  return node.unmodifiable === undefined && node.folderType === undefined;
}

export function canMove({
  roots,
  sourceId,
  destination,
}: {
  roots: BookmarkNode[];
  sourceId: string;
  destination: MoveDestination;
}): boolean {
  const source = findNodeById({ roots, nodeId: sourceId });
  const parent = findNodeById({ roots, nodeId: destination.parentId });
  if (!source || !parent || !isEditable(source)) {
    return false;
  }
  if (parent.unmodifiable !== undefined) {
    return false;
  }
  return !isSelfOrDescendant({
    roots,
    ancestorId: sourceId,
    nodeId: destination.parentId,
  });
}

/**
 * Recreates a removed node (and its descendants) to undo removal.
 * The recreated nodes have new ids.
 */
export async function restoreBookmark(node: BookmarkNode): Promise<void> {
  const created = await browser.bookmarks.create({
    parentId: node.parentId,
    index: node.index,
    title: node.title,
    url: node.url,
  });
  for (const child of node.children ?? []) {
    await restoreBookmark({ ...child, parentId: created.id });
  }
}

/**
 * Restores removed nodes in ascending index order so that each index is valid when recreated.
 */
export async function restoreBookmarks(nodes: BookmarkNode[]): Promise<void> {
  for (const node of sortForRestore(nodes)) {
    await restoreBookmark(node);
  }
}

export function sortForRestore(nodes: BookmarkNode[]): BookmarkNode[] {
  return nodes.toSorted((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

/**
 * Moves nodes keeping the given order.
 * The 2nd and later nodes are placed after the previously moved node.
 */
export async function moveBookmarks({
  ids,
  destination,
}: {
  ids: string[];
  destination: MoveDestination;
}): Promise<void> {
  let previousId: string | undefined;
  for (const id of ids) {
    let index = destination.index;
    if (previousId !== undefined && index !== undefined) {
      const [previous] = await browser.bookmarks.get(previousId);
      index = (previous?.index ?? 0) + 1;
    }
    await browser.bookmarks.move(id, { parentId: destination.parentId, index });
    previousId = id;
  }
}

/**
 * Accepts URL without scheme like "example.com" as https.
 */
export function normalizeUrl(input: string): string | undefined {
  const trimmed = input.trim();
  if (trimmed === "") {
    return undefined;
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return undefined;
  }
}
