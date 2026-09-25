import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  buildMoveDestination,
  canMove,
  type DropPosition,
  getDropPosition,
  isEditable,
  restoreBookmark,
} from "@/src/feature/bookmark-edit";
import { type BookmarkNode, isFolder } from "@/src/feature/bookmark-path";

export type DropTarget = {
  id: string;
  position: DropPosition;
};

export function useBookmarkDragAndDrop(roots: BookmarkNode[] | null) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const resolveDestination = useCallback(
    (target: BookmarkNode, position: DropPosition) => {
      if (!roots || !draggingId || target.id === draggingId) {
        return undefined;
      }
      const destination = buildMoveDestination({ target, position });
      if (
        !destination ||
        !canMove({ roots, sourceId: draggingId, destination })
      ) {
        return undefined;
      }
      return destination;
    },
    [roots, draggingId],
  );

  const reset = useCallback(() => {
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  const dragProps = useCallback(
    (node: BookmarkNode) => {
      if (!isEditable(node)) {
        return {};
      }
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.effectAllowed = "move";
          setDraggingId(node.id);
        },
        onDragEnd: reset,
      };
    },
    [reset],
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
          if (!draggingId || !destination) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          reset();
          await browser.bookmarks.move(draggingId, destination);
        },
      };
    },
    [resolveDestination, draggingId, reset],
  );

  return { dropTarget, dragProps, dropProps };
}

const UNDO_TIMEOUT_MS = 10000;

export function useRemoveWithUndo() {
  const [removed, setRemoved] = useState<BookmarkNode | null>(null);

  useEffect(() => {
    if (!removed) {
      return;
    }
    const timer = setTimeout(() => setRemoved(null), UNDO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [removed]);

  const remove = useCallback(async (node: BookmarkNode) => {
    const subtree = (await browser.bookmarks.getSubTree(node.id)).at(0);
    if (!subtree) {
      return;
    }
    if (isFolder(subtree)) {
      await browser.bookmarks.removeTree(subtree.id);
    } else {
      await browser.bookmarks.remove(subtree.id);
    }
    setRemoved(subtree);
  }, []);

  const undo = useCallback(async () => {
    if (!removed) {
      return;
    }
    setRemoved(null);
    await restoreBookmark(removed);
  }, [removed]);

  const dismiss = useCallback(() => setRemoved(null), []);

  return { removed, remove, undo, dismiss };
}
