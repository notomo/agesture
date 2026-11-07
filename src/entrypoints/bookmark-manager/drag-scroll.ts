import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { getDragScrollDelta } from "@/src/feature/bookmark-edit";

/**
 * Scrolls the container while dragging above or below its visible rows.
 * Native drag scrolling works only near the edges of the container,
 * so it does not cover the headers.
 *
 * The returned props use capture phase because rows stop propagation of accepted drag events.
 */
export function useDragScroll({
  containerRef,
  headerRef,
  dragging,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  headerRef: React.RefObject<HTMLElement | null>;
  dragging: boolean;
}) {
  const yRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    yRef.current = null;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const scroll = useCallback(() => {
    frameRef.current = null;
    const container = containerRef.current;
    const header = headerRef.current;
    const y = yRef.current;
    if (!container || !header || y === null) {
      return;
    }
    const before = container.scrollTop;
    container.scrollTop += getDragScrollDelta({
      y,
      top: header.getBoundingClientRect().bottom,
      bottom: container.getBoundingClientRect().bottom,
    });
    // restarted by the next dragover
    if (container.scrollTop !== before) {
      frameRef.current = requestAnimationFrame(scroll);
    }
  }, [containerRef, headerRef]);

  useEffect(() => {
    if (!dragging) {
      stop();
    }
  }, [dragging, stop]);
  useEffect(() => stop, [stop]);

  return {
    onDragOverCapture: (e: React.DragEvent) => {
      if (!dragging) {
        return;
      }
      yRef.current = e.clientY;
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(scroll);
      }
    },
    onDragLeaveCapture: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        stop();
      }
    },
  };
}
