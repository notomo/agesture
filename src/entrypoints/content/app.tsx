import type { GestureAction, PiemenuItem } from "@/src/feature/action";
import { type Point, fromPoints } from "@/src/feature/direction";
import { sendGestureMessage } from "@/src/feature/message-gesture";
import { sendPimenuActionMessage } from "@/src/feature/message-piemenu-action";
import { useEffect, useState } from "react";
import { Canvas } from "./canvas";
import { Piemenu } from "./piemenu";

export const App = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [piemenu, setPiemenu] = useState<{
    items: PiemenuItem[];
    center: Point;
  } | null>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) {
        return;
      }
      setPoints([...points, { x: e.clientX, y: e.clientY }]);
      e.preventDefault(); // to prevent unselecting text
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

      const response = await sendGestureMessage({ directions, startPoint });
      if (response.type === "piemenu") {
        setPiemenu({
          items: response.items,
          center: startPoint,
        });
      }
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

  const handleSelectAction = async (action: GestureAction) => {
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
  };

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
