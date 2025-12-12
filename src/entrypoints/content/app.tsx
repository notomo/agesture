import { useCallback, useEffect, useRef, useState } from "react";
import type { GestureAction, PiemenuItem } from "@/src/feature/action";
import { fromPoints, type Point } from "@/src/feature/direction";
import {
  extractActionName,
  findMatchingGesture,
  type Gesture,
} from "@/src/feature/gesture-matcher";
import { sendGestureMessage } from "@/src/feature/message-gesture";
import { sendPimenuActionMessage } from "@/src/feature/message-piemenu-action";
import { getSetting } from "@/src/feature/setting";
import { ActionNameDisplay } from "./action-name-display";
import { Canvas } from "./canvas";
import { Overlay } from "./overlay";
import { Piemenu } from "./piemenu";

export const App = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [piemenu, setPiemenu] = useState<{
    items: PiemenuItem[];
    center: Point;
  } | null>(null);
  const isDraggingRef = useRef(false);
  const [matchedActionName, setMatchedActionName] = useState<string | null>(
    null,
  );
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const gesturesRef = useRef<readonly Gesture[]>([]);

  const addPoint = useCallback((point: Point) => {
    setPoints((prev) => [...prev, point]);
  }, []);

  const clearPoints = useCallback(() => {
    setPoints([]);
    setMatchedActionName(null);
    setStartPoint(null);
    gesturesRef.current = [];
    isDraggingRef.current = false;
  }, []);

  const handleMouseDown = useCallback(
    async (e: MouseEvent) => {
      if (e.button !== 2) {
        return;
      }
      isDraggingRef.current = true;
      const point = { x: e.clientX, y: e.clientY };
      setStartPoint(point);
      addPoint(point);

      const setting = await getSetting();
      gesturesRef.current = setting.gestures;

      e.preventDefault(); // to prevent unselecting text
    },
    [addPoint],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (e.buttons !== 2 || !isDraggingRef.current) {
        return;
      }

      const newPoint = { x: e.clientX, y: e.clientY };
      addPoint(newPoint);

      setPoints((currentPoints) => {
        const allPoints = [...currentPoints, newPoint];
        const directions = fromPoints({
          points: allPoints,
          minDistance: 40,
        });

        if (directions.length === 0) {
          setMatchedActionName(null);
          return allPoints;
        }

        const matchedGesture = findMatchingGesture({
          directions,
          gestures: gesturesRef.current,
        });

        if (matchedGesture) {
          setMatchedActionName(extractActionName(matchedGesture.action));
        } else {
          setMatchedActionName(null);
        }

        return allPoints;
      });
    },
    [addPoint],
  );

  const handleMouseUp = useCallback(
    async (e: MouseEvent) => {
      if (e.button !== 2 || !isDraggingRef.current) {
        return;
      }

      const currentPoints = points;
      const directions = fromPoints({
        points: currentPoints,
        minDistance: 40,
      });

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
      {startPoint && (
        <ActionNameDisplay
          actionName={matchedActionName}
          position={startPoint}
        />
      )}
      <Overlay
        isActive={isDraggingRef.current}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
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
