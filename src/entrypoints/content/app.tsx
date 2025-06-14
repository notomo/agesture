import type {
  GestureActionWithoutPiemenu,
  PiemenuMenu,
} from "@/src/feature/action";
import { type Point, fromPoints } from "@/src/feature/direction";
import {
  sendGestureMessage,
  sendPimenuActionMessage,
} from "@/src/feature/message";
import { useEffect, useState } from "react";
import { Canvas } from "./canvas";
import { Piemenu } from "./piemenu";

export const App = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [piemenuData, setPiemenuData] = useState<{
    menu: PiemenuMenu[];
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
        setPiemenuData({
          menu: response.piemenu,
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

  const handleSelectAction = async (action: GestureActionWithoutPiemenu) => {
    if (piemenuData === null) {
      return;
    }
    await sendPimenuActionMessage({
      action,
      startPoint: piemenuData.center,
    });
  };

  return (
    <>
      <Canvas points={points} />
      {piemenuData && (
        <Piemenu
          menu={piemenuData.menu}
          center={piemenuData.center}
          onClose={() => setPiemenuData(null)}
          onSelectAction={handleSelectAction}
        />
      )}
    </>
  );
};
