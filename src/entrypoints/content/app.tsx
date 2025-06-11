import { type Point, fromPoints } from "@/src/feature/direction";
import { buildGestureMessage } from "@/src/feature/message";
import { getSetting } from "@/src/feature/setting";
import { useEffect, useState } from "react";
import { Canvas } from "./canvas";
import { Piemenu } from "./piemenu";

export const App = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [piemenuData, setPiemenuData] = useState<{
    menu: { action: string }[];
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

      const response = await browser.runtime.sendMessage(
        buildGestureMessage({ directions, startPoint }),
      );

      if (response?.piemenu) {
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

  const handleSelectAction = async (actionName: string) => {
    const setting = await getSetting();

    const gesture = setting.gestures.find((g) => {
      const actions = Array.isArray(g.action) ? g.action : [g.action];
      return actions.some((a) => a.name === actionName);
    });

    if (gesture && piemenuData) {
      const actions = Array.isArray(gesture.action)
        ? gesture.action
        : [gesture.action];
      const action = actions.find((a) => a.name === actionName);

      if (action) {
        const message = buildGestureMessage({
          directions: [],
          startPoint: piemenuData.center,
        });

        const actionMessage = {
          type: "piemenuAction",
          action: action,
          context: message.context,
        };

        await browser.runtime.sendMessage(actionMessage);
      }
    }
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
