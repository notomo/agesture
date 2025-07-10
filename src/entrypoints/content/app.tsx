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

  const addPoint = useCallback((point: Point) => {
    setPoints((prev) => [...prev, point]);
  }, []);

  const clearPoints = useCallback(() => {
    setPoints([]);
    isDraggingRef.current = false;
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 2) {
        return;
      }
      isDraggingRef.current = true;
      addPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault(); // to prevent unselecting text
    },
    [addPoint],
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
    [points, clearPoints],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

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
