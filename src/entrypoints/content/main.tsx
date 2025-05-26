import { buildGestureMessage } from "@/src/feature/message";
import { useEffect } from "react";
import { fromPoints } from "../../feature/direction";

export const App = () => {
  useEffect(() => {
    let isGesturing = false;
    let rightButtonDown = false;
    let points: { x: number; y: number }[] = [];
    let startPoint: { x: number; y: number } | undefined;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) {
        return;
      }

      rightButtonDown = true;
      startPoint = { x: e.clientX, y: e.clientY };
      points.push(startPoint);

      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!rightButtonDown) {
        return;
      }
      isGesturing = true;
      points.push({ x: e.clientX, y: e.clientY });
    };

    let hasDirection = false;
    const handleMouseUp = async (e: MouseEvent) => {
      if (e.button !== 2) {
        return;
      }

      rightButtonDown = false;
      if (!isGesturing) {
        return;
      }

      const directions = fromPoints({ points, minDistance: 20 });

      isGesturing = false;
      points = [];

      if (directions.length === 0) {
        return;
      }
      hasDirection = true;

      await browser.runtime.sendMessage(
        buildGestureMessage(directions, startPoint),
      );
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (!rightButtonDown && !hasDirection) {
        return;
      }
      hasDirection = false;
      e.preventDefault();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return null; // TODO
};
