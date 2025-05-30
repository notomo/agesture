import { type Point, fromPoints } from "@/src/feature/direction";
import { buildGestureMessage } from "@/src/feature/message";
import { useEffect, useState } from "react";
import { Canvas } from "./canvas";

export const App = () => {
  const [points, setPoints] = useState<Point[]>([]);

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
      if (directions.length === 0) {
        setPoints([]);
        return;
      }

      // to prevent context menu
      setTimeout(() => {
        setPoints([]);
      });

      const startPoint = points.at(0);
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

  const hasPoint = points.length > 0;
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!hasPoint) {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [hasPoint]);

  return <Canvas points={points} />;
};
