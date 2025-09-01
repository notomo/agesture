import { useCallback, useEffect, useState } from "react";

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
      overlay.addEventListener("mousedown", onMouseDown);
      overlay.addEventListener("mousemove", onMouseMove);
      overlay.addEventListener("mouseup", onMouseUp);
    };

    iframeOverlays.forEach(addOverlayListeners);

    return () => {
      iframeOverlays.forEach((overlay) => {
        overlay.removeEventListener("mousedown", onMouseDown);
        overlay.removeEventListener("mousemove", onMouseMove);
        overlay.removeEventListener("mouseup", onMouseUp);
      });
    };
  }, [iframeOverlays, onMouseDown, onMouseMove, onMouseUp]);

  return null;
};
