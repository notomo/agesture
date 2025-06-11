import type { Point } from "@/src/feature/direction";
import { useCallback, useEffect, useState } from "react";

interface PiemenuProps {
  menu: { action: string }[];
  center: Point;
  onClose: () => void;
  onSelectAction: (actionName: string) => void;
}

export const Piemenu = ({
  menu,
  center,
  onClose,
  onSelectAction,
}: PiemenuProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });

  const radius = 80;
  const itemRadius = 30;

  const getMenuItemPosition = (index: number) => {
    const angle = (index * 2 * Math.PI) / menu.length - Math.PI / 2;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  };

  const getHighlightedIndex = useCallback(
    (mousePos: Point) => {
      if (menu.length === 0) return -1;

      const dx = mousePos.x - center.x;
      const dy = mousePos.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 20) return -1;

      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
      const segmentAngle = (2 * Math.PI) / menu.length;
      const index = Math.floor(normalizedAngle / segmentAngle);

      return index % menu.length;
    },
    [menu.length, center.x, center.y],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setMousePosition(pos);
      setHighlightedIndex(getHighlightedIndex(pos));
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      if (e.button === 0 && highlightedIndex >= 0) {
        const menuItem = menu[highlightedIndex];
        if (menuItem) {
          onSelectAction(menuItem.action);
        }
        onClose();
      } else if (e.button === 2) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu, highlightedIndex, onClose, onSelectAction, getHighlightedIndex]);

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ left: 0, top: 0, width: "100vw", height: "100vh" }}
    >
      <div className="pointer-events-auto w-full h-full">
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
          role="img"
          aria-label="Pie menu"
        >
          {menu.map((item, index) => {
            const pos = getMenuItemPosition(index);
            const isHighlighted = index === highlightedIndex;

            return (
              <g key={item.action}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={itemRadius}
                  fill={
                    isHighlighted
                      ? "rgba(59, 130, 246, 0.8)"
                      : "rgba(0, 0, 0, 0.7)"
                  }
                  stroke={isHighlighted ? "#3b82f6" : "#374151"}
                  strokeWidth="2"
                />
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontFamily="system-ui"
                  fontWeight={isHighlighted ? "bold" : "normal"}
                >
                  {item.action}
                </text>
              </g>
            );
          })}
          <circle
            cx={center.x}
            cy={center.y}
            r="8"
            fill="rgba(156, 163, 175, 0.8)"
            stroke="#6b7280"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
};
