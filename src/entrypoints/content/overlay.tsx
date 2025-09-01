import { useCallback, useEffect, useRef, useState } from "react";

export const Overlay = ({
  isActive,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: {
  isActive: boolean;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
}) => {
  const [iframeOverlays, setIframeOverlays] = useState<HTMLElement[]>([]);
  const onMouseDownRef = useRef(onMouseDown);
  const onMouseMoveRef = useRef(onMouseMove);
  const onMouseUpRef = useRef(onMouseUp);

  useEffect(() => {
    onMouseDownRef.current = onMouseDown;
    onMouseMoveRef.current = onMouseMove;
    onMouseUpRef.current = onMouseUp;
  });

  const createIframeOverlays = useCallback(() => {
    const iframes = document.querySelectorAll("iframe");
    const overlays: HTMLElement[] = [];

    iframes.forEach((iframe) => {
      const rect = iframe.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      overlay.style.zIndex = "9998";
      overlay.style.pointerEvents = "auto";
      overlay.style.display = "none";

      document.body.appendChild(overlay);
      overlays.push(overlay);
    });

    return overlays;
  }, []);

  const removeIframeOverlays = useCallback((overlays: HTMLElement[]) => {
    overlays.forEach((overlay) => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
  }, []);

  const showIframeOverlays = useCallback((overlays: HTMLElement[]) => {
    overlays.forEach((overlay) => {
      overlay.style.display = "block";
    });
  }, []);

  const hideIframeOverlays = useCallback((overlays: HTMLElement[]) => {
    overlays.forEach((overlay) => {
      overlay.style.display = "none";
    });
  }, []);

  useEffect(() => {
    if (isActive && iframeOverlays.length === 0) {
      const overlays = createIframeOverlays();
      setIframeOverlays(overlays);
      showIframeOverlays(overlays);
    } else if (!isActive && iframeOverlays.length > 0) {
      hideIframeOverlays(iframeOverlays);
      removeIframeOverlays(iframeOverlays);
      setIframeOverlays([]);
    }
  }, [
    isActive,
    iframeOverlays,
    createIframeOverlays,
    showIframeOverlays,
    hideIframeOverlays,
    removeIframeOverlays,
  ]);

  useEffect(() => {
    const addOverlayListeners = (overlay: HTMLElement) => {
      const handleMouseDown = (e: MouseEvent) => onMouseDownRef.current(e);
      const handleMouseMove = (e: MouseEvent) => onMouseMoveRef.current(e);
      const handleMouseUp = (e: MouseEvent) => onMouseUpRef.current(e);

      overlay.addEventListener("mousedown", handleMouseDown);
      overlay.addEventListener("mousemove", handleMouseMove);
      overlay.addEventListener("mouseup", handleMouseUp);

      return () => {
        overlay.removeEventListener("mousedown", handleMouseDown);
        overlay.removeEventListener("mousemove", handleMouseMove);
        overlay.removeEventListener("mouseup", handleMouseUp);
      };
    };

    const cleanupFunctions: (() => void)[] = [];
    iframeOverlays.forEach((overlay) => {
      const cleanup = addOverlayListeners(overlay);
      cleanupFunctions.push(cleanup);
    });

    return () => {
      for (const cleanup of cleanupFunctions) {
        cleanup();
      }
    };
  }, [iframeOverlays]);

  return null;
};
