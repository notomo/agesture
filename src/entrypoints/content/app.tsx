import { useCallback, useEffect, useRef, useState } from "react";
import type { GestureAction, PiemenuItem } from "@/src/feature/action";
import { fromPoints, type Point } from "@/src/feature/direction";
import { sendGestureMessage } from "@/src/feature/message-gesture";
import { sendPimenuActionMessage } from "@/src/feature/message-piemenu-action";
import { Canvas } from "./canvas";
import { Piemenu } from "./piemenu";

export const App = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [piemenu, setPiemenu] = useState<{
    items: PiemenuItem[];
    center: Point;
  } | null>(null);
  const isDraggingRef = useRef(false);
  const [iframeOverlays, setIframeOverlays] = useState<HTMLElement[]>([]);

  const addPoint = useCallback((point: Point) => {
    setPoints((prev) => [...prev, point]);
  }, []);

  const clearPoints = useCallback(() => {
    setPoints([]);
    isDraggingRef.current = false;
  }, []);

  const createIframeOverlays = useCallback(() => {
    const iframes = document.querySelectorAll("iframe");
    const overlays: HTMLElement[] = [];

    iframes.forEach((iframe) => {
      const rect = iframe.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.backgroundColor = "transparent";
      overlay.style.zIndex = "2147483646";
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

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 2) {
        return;
      }
      isDraggingRef.current = true;
      addPoint({ x: e.clientX, y: e.clientY });

      const overlays = createIframeOverlays();
      setIframeOverlays(overlays);
      showIframeOverlays(overlays);

      e.preventDefault(); // to prevent unselecting text
    },
    [addPoint, createIframeOverlays, showIframeOverlays],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (e.buttons !== 2 || !isDraggingRef.current) {
        return;
      }
      addPoint({ x: e.clientX, y: e.clientY });
    },
    [addPoint],
  );

  const handleMouseUp = useCallback(
    async (e: MouseEvent) => {
      if (e.button !== 2 || !isDraggingRef.current) {
        return;
      }

      hideIframeOverlays(iframeOverlays);
      removeIframeOverlays(iframeOverlays);
      setIframeOverlays([]);

      const currentPoints = points;
      const directions = fromPoints({ points: currentPoints, minDistance: 20 });

      if (directions.length === 0) {
        clearPoints();
        return;
      }

      // to prevent context menu
      setTimeout(() => {
        clearPoints();
      });

      const startPoint = currentPoints.at(0);
      if (!startPoint) {
        throw new Error("startPoint should exist when gesture is triggered");
      }

      const response = await sendGestureMessage({ directions, startPoint });
      if (response.type === "piemenu") {
        setPiemenu({
          items: response.items,
          center: startPoint,
        });
      }
    },
    [
      points,
      clearPoints,
      iframeOverlays,
      hideIframeOverlays,
      removeIframeOverlays,
    ],
  );

  useEffect(() => {
    const addOverlayListeners = (overlay: HTMLElement) => {
      overlay.addEventListener("mousedown", handleMouseDown);
      overlay.addEventListener("mousemove", handleMouseMove);
      overlay.addEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    iframeOverlays.forEach(addOverlayListeners);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      iframeOverlays.forEach((overlay) => {
        overlay.removeEventListener("mousedown", handleMouseDown);
        overlay.removeEventListener("mousemove", handleMouseMove);
        overlay.removeEventListener("mouseup", handleMouseUp);
      });
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, iframeOverlays]);

  const hasPoint = points.length > 0;
  const pimenuExists = piemenu !== null;
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!hasPoint && !pimenuExists) {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [hasPoint, pimenuExists]);

  const handleSelectAction = useCallback(
    async (action: GestureAction | GestureAction[]) => {
      if (piemenu === null) {
        return;
      }

      const response = await sendPimenuActionMessage({
        action,
        startPoint: piemenu.center,
      });
      if (response.type === "piemenu") {
        setPiemenu({
          items: response.items,
          center: piemenu.center,
        });
      }
    },
    [piemenu],
  );

  return (
    <>
      <Canvas points={points} />
      {piemenu && (
        <Piemenu
          items={piemenu.items}
          center={piemenu.center}
          onClose={() => {
            // to prevent context menu
            setTimeout(() => {
              setPiemenu(null);
            });
          }}
          onSelect={handleSelectAction}
        />
      )}
    </>
  );
};
