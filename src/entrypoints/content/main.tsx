import { buildGestureMessage } from "@/src/feature/message";
import { useEffect, useState } from "react";
import { fromPoints } from "../../feature/direction";
import { Canvas } from "./Canvas";

export const App = () => {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [hasDirection, setHasDirection] = useState(false);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) {
        return;
      }
      setPoints([...points, { x: e.clientX, y: e.clientY }]);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons !== 2) {
        return;
      }
      setPoints([...points, { x: e.clientX, y: e.clientY }]);
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (e.button !== 2) {
        return;
      }

      const directions = fromPoints({ points, minDistance: 20 });
      const startPoint = points.at(0);

      setPoints([]);

      if (directions.length === 0) {
        return;
      }
      setHasDirection(true);

      if (!startPoint) {
        throw new Error("startPoint should exist when gesture is triggered");
      }

      await browser.runtime.sendMessage(
        buildGestureMessage(directions, startPoint),
      );
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [points]);

  const shouldPrevent = points.length > 0 || hasDirection;
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!shouldPrevent) {
        return;
      }
      setHasDirection(false);
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [shouldPrevent]);

  const isVisible = points.length > 1;
  return <Canvas points={points} isVisible={isVisible} />;
};
