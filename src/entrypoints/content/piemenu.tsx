import type {
  GestureActionWithoutPiemenu,
  PiemenuMenu,
} from "@/src/feature/action";
import type { Point } from "@/src/feature/direction";
import { cn } from "@/src/lib/tailwind";
import { useCallback, useEffect, useState } from "react";

export const Piemenu = ({
  menu,
  center,
  onClose,
  onSelectAction,
}: {
  menu: PiemenuMenu[];
  center: Point;
  onClose: () => void;
  onSelectAction: (action: GestureActionWithoutPiemenu) => void;
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const radius = 140;
  const itemRadius = 50;

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

      if (distance < 35) return -1;

      const mouseAngle = Math.atan2(dy, dx);
      let closestIndex = -1;
      let smallestAngleDiff = Number.POSITIVE_INFINITY;

      for (let i = 0; i < menu.length; i++) {
        const itemAngle = (i * 2 * Math.PI) / menu.length - Math.PI / 2;
        let angleDiff = Math.abs(mouseAngle - itemAngle);

        if (angleDiff > Math.PI) {
          angleDiff = 2 * Math.PI - angleDiff;
        }

        if (angleDiff < smallestAngleDiff) {
          smallestAngleDiff = angleDiff;
          closestIndex = i;
        }
      }

      return closestIndex;
    },
    [menu.length, center.x, center.y],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
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

  const createSectorPath = (index: number) => {
    const angleStep = (2 * Math.PI) / menu.length;
    const startAngle = index * angleStep - Math.PI / 2 - angleStep / 2;
    const endAngle = startAngle + angleStep;
    const outerRadius = radius + 40;
    const innerRadius = 35;

    const startOuter = {
      x: center.x + Math.cos(startAngle) * outerRadius,
      y: center.y + Math.sin(startAngle) * outerRadius,
    };
    const endOuter = {
      x: center.x + Math.cos(endAngle) * outerRadius,
      y: center.y + Math.sin(endAngle) * outerRadius,
    };
    const startInner = {
      x: center.x + Math.cos(startAngle) * innerRadius,
      y: center.y + Math.sin(startAngle) * innerRadius,
    };
    const endInner = {
      x: center.x + Math.cos(endAngle) * innerRadius,
      y: center.y + Math.sin(endAngle) * innerRadius,
    };

    const largeArcFlag = angleStep > Math.PI ? 1 : 0;

    return `
      M ${startInner.x} ${startInner.y}
      L ${startOuter.x} ${startOuter.y}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}
      L ${endInner.x} ${endInner.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}
      Z
    `;
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="pointer-events-auto w-full h-full">
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
          role="img"
          aria-label="Piemenu selection areas"
        >
          {menu.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <path
                key={`sector-${item.label}`}
                d={createSectorPath(index)}
                fill={
                  isHighlighted
                    ? "rgba(59, 130, 246, 0.2)"
                    : "rgba(75, 85, 99, 0.1)"
                }
                stroke={
                  isHighlighted
                    ? "rgba(59, 130, 246, 0.4)"
                    : "rgba(75, 85, 99, 0.2)"
                }
                strokeWidth={isHighlighted ? 2 : 1}
                className="transition-all duration-150"
              />
            );
          })}
        </svg>
        {menu.map((item, index) => {
          const pos = getMenuItemPosition(index);
          const isHighlighted = index === highlightedIndex;

          return (
            <div
              key={item.label}
              className={cn(
                "absolute rounded-full flex items-center justify-center transition-all duration-150",
                isHighlighted
                  ? "bg-blue-500/90 border-blue-400 border-3 shadow-lg shadow-blue-500/30 scale-110"
                  : "bg-gray-900/90 border-gray-500 border-2 shadow-md shadow-black/30",
              )}
              style={{
                left: pos.x - itemRadius,
                top: pos.y - itemRadius,
                width: itemRadius * 2,
                height: itemRadius * 2,
              }}
            >
              <span
                className={cn(
                  "font-sans text-base drop-shadow-sm font-medium select-none transition-all duration-150",
                  isHighlighted ? "text-white" : "text-gray-200",
                )}
              >
                {item.label}
              </span>
            </div>
          );
        })}
        <div
          className="absolute w-7 h-7 rounded-full bg-gray-600/90 border-gray-400 border-2 shadow-md shadow-black/40"
          style={{
            left: center.x - 15,
            top: center.y - 15,
          }}
        />
      </div>
    </div>
  );
};
