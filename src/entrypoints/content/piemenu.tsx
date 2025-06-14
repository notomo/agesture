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

  const radius = 180;

  const getTextPosition = (index: number) => {
    const angle = (index * 2 * Math.PI) / menu.length - Math.PI / 2;
    const textRadius = radius * 0.7; // 70% of the outer radius to move text closer to center
    return {
      x: center.x + Math.cos(angle) * textRadius,
      y: center.y + Math.sin(angle) * textRadius,
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
    <div className="fixed inset-0 z-9999 pointer-events-none">
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
                className={cn(
                  "transition-all duration-150",
                  isHighlighted
                    ? "fill-blue-500/80 stroke-blue-500/90 stroke-2"
                    : "fill-gray-600/80 stroke-gray-600/90 stroke-1",
                )}
              />
            );
          })}
        </svg>
        {menu.map((item, index) => {
          const textPos = getTextPosition(index);
          return (
            <div
              key={item.label}
              className="absolute w-30 h-8 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-all duration-150"
              style={{
                left: textPos.x,
                top: textPos.y,
              }}
            >
              <span
                className={cn(
                  "font-sans font-semibold text-white text-xl select-none transition-all duration-150 px-3 py-1 rounded-md",
                )}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
