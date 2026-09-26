import type React from "react";
import { useCallback, useState } from "react";
import { type Rect, rectFromPoints, rectsIntersect } from "@/src/lib/rect";

export const BOOKMARK_ID_ATTRIBUTE = "data-bookmark-id";

/**
 * Selects rows intersecting the rect dragged from outside of rows.
 * Holding Ctrl/Meta/Shift adds to the current selection.
 */
export function useRectSelection({
  selectedIds,
  setSelectedIds,
}: {
  selectedIds: ReadonlySet<string>;
  setSelectedIds: (ids: ReadonlySet<string>) => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) {
        return;
      }
      const target = e.target as Element;
      if (target.closest(`[${BOOKMARK_ID_ATTRIBUTE}], a, button, input`)) {
        return;
      }
      // to prevent text selection
      e.preventDefault();

      const base: ReadonlySet<string> =
        e.ctrlKey || e.metaKey || e.shiftKey ? selectedIds : new Set();
      setSelectedIds(base);

      const start = { x: e.clientX, y: e.clientY };
      const handleMouseMove = (event: MouseEvent) => {
        const current = rectFromPoints(start, {
          x: event.clientX,
          y: event.clientY,
        });
        setRect(current);

        const ids = new Set(base);
        const elements = document.querySelectorAll<HTMLElement>(
          `[${BOOKMARK_ID_ATTRIBUTE}]`,
        );
        for (const element of elements) {
          const id = element.getAttribute(BOOKMARK_ID_ATTRIBUTE);
          if (id && rectsIntersect(current, element.getBoundingClientRect())) {
            ids.add(id);
          }
        }
        setSelectedIds(ids);
      };
      const handleMouseUp = () => {
        setRect(null);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [selectedIds, setSelectedIds],
  );

  return { rect, onMouseDown };
}

export const SelectionRect = ({ rect }: { rect: Rect }) => (
  <div
    className="pointer-events-none fixed z-50 border border-blue-500 border-dashed bg-blue-500/10"
    style={{
      left: rect.left,
      top: rect.top,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    }}
  />
);
