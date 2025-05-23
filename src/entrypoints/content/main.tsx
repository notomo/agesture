import { useEffect } from "react";
import { buildContentActionContext } from "../../feature/action-context";
import { type Direction, detectDirection } from "../../feature/direction";

export const App = () => {
  useEffect(() => {
    let isGesturing = false;
    let rightButtonDown = false;
    let positions: { x: number; y: number }[] = [];

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) {
        return;
      }

      rightButtonDown = true;
      positions.push({ x: e.clientX, y: e.clientY });

      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!rightButtonDown) {
        return;
      }
      isGesturing = true;
      positions.push({ x: e.clientX, y: e.clientY });
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

      const directions: Direction[] = [];
      const minDistance = 20;
      for (let i = 1; i < positions.length; i++) {
        const prevPosition = positions[i - 1];
        const currentPosition = positions[i];
        if (prevPosition && currentPosition) {
          const direction = detectDirection(
            prevPosition,
            currentPosition,
            minDistance,
          );
          if (
            direction &&
            (directions.length === 0 ||
              direction !== directions[directions.length - 1])
          ) {
            directions.push(direction);
          }
        }
      }

      isGesturing = false;
      positions = [];

      if (directions.length === 0) {
        return;
      }
      hasDirection = true;

      const context = buildContentActionContext();
      await browser.runtime.sendMessage({
        type: "gesture",
        directions,
        context,
      });
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
