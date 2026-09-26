import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  buildMoveDestination,
  canMove,
  type DropPosition,
  getDropPosition,
  isEditable,
  moveBookmarks,
  restoreBookmarks,
} from "@/src/feature/bookmark-edit";
import {
  type BookmarkNode,
  findNodeById,
  isFolder,
} from "@/src/feature/bookmark-path";

export type DropTarget = {
  id: string;
  position: DropPosition;
};

/**
 * @param getDragIds returns ids moved together when the node is dragged (e.g. selected nodes)
 */
export function useBookmarkDragAndDrop({
  roots,
  getDragIds,
}: {
  roots: BookmarkNode[] | null;
  getDragIds: (node: BookmarkNode) => string[];
}) {
  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const resolveDestination = useCallback(
    (target: BookmarkNode, position: DropPosition) => {
      if (
        !roots ||
        draggingIds.length === 0 ||
        draggingIds.includes(target.id)
      ) {
        return undefined;
      }
      const destination = buildMoveDestination({ target, position });
      if (
        !destination ||
        !draggingIds.every((sourceId) =>
          canMove({ roots, sourceId, destination }),
        )
      ) {
        return undefined;
      }
      return destination;
    },
    [roots, draggingIds],
  );

  const reset = useCallback(() => {
    setDraggingIds([]);
    setDropTarget(null);
  }, []);

  const dragProps = useCallback(
    (node: BookmarkNode, { single }: { single: boolean }) => {
      if (!isEditable(node)) {
        return {};
      }
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.effectAllowed = "move";
          setDraggingIds(single ? [node.id] : getDragIds(node));
        },
        onDragEnd: reset,
      };
    },
    [reset, getDragIds],
  );

  const dropProps = useCallback(
    (node: BookmarkNode, { intoOnly }: { intoOnly: boolean }) => {
      const getPosition = (e: React.DragEvent): DropPosition => {
        if (intoOnly) {
          return "into";
        }
        const rect = e.currentTarget.getBoundingClientRect();
        return getDropPosition({
          ratio: (e.clientY - rect.top) / rect.height,
          target: node,
        });
      };
      return {
        onDragOver: (e: React.DragEvent) => {
          const position = getPosition(e);
          if (!resolveDestination(node, position)) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "move";
          setDropTarget((prev) =>
            prev?.id === node.id && prev.position === position
              ? prev
              : { id: node.id, position },
          );
        },
        onDragLeave: (e: React.DragEvent) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) {
            return;
          }
          setDropTarget((prev) => (prev?.id === node.id ? null : prev));
        },
        onDrop: async (e: React.DragEvent) => {
          const destination = resolveDestination(node, getPosition(e));
          if (!destination) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          const ids = draggingIds;
          reset();
          await moveBookmarks({ ids, destination });
        },
      };
    },
    [resolveDestination, draggingIds, reset],
  );

  return { dropTarget, dragProps, dropProps };
}

const UNDO_TIMEOUT_MS = 10000;

export function useRemoveWithUndo() {
  const [removed, setRemoved] = useState<BookmarkNode[]>([]);

  useEffect(() => {
    if (removed.length === 0) {
      return;
    }
    const timer = setTimeout(() => setRemoved([]), UNDO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [removed]);

  const remove = useCallback(async (nodes: BookmarkNode[]) => {
    // get all before removing so that indexes for undo are not shifted by removal
    const subtrees: BookmarkNode[] = [];
    for (const node of nodes.filter(isEditable)) {
      const subtree = (await browser.bookmarks.getSubTree(node.id)).at(0);
      if (subtree) {
        subtrees.push(subtree);
      }
    }
    // descendants are removed and restored with their ancestor (e.g. both selected in search results)
    const topLevels = subtrees.filter(
      (subtree) =>
        !subtrees.some(
          (other) =>
            other !== subtree &&
            findNodeById({ roots: other.children ?? [], nodeId: subtree.id }),
        ),
    );

    for (const subtree of topLevels) {
      if (isFolder(subtree)) {
        await browser.bookmarks.removeTree(subtree.id);
      } else {
        await browser.bookmarks.remove(subtree.id);
      }
    }
    if (topLevels.length > 0) {
      setRemoved(topLevels);
    }
  }, []);

  const undo = useCallback(async () => {
    if (removed.length === 0) {
      return;
    }
    setRemoved([]);
    await restoreBookmarks(removed);
  }, [removed]);

  const dismiss = useCallback(() => setRemoved([]), []);

  return { removed, remove, undo, dismiss };
}
