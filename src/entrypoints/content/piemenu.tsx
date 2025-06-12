import type { PiemenuMenu } from "@/src/feature/action";
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
  onSelectAction: (actionName: string) => void;
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
      setHighlightedIndex(getHighlightedIndex(pos));
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      if (e.button === 0 && highlightedIndex >= 0) {
        const menuItem = menu[highlightedIndex];
        if (menuItem) {
          onSelectAction(menuItem.action.name);
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
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="pointer-events-auto w-full h-full">
        {menu.map((item, index) => {
          const pos = getMenuItemPosition(index);
          const isHighlighted = index === highlightedIndex;

          return (
            <div
              key={item.label}
              className={cn(
                "absolute rounded-full flex items-center justify-center transition-all duration-200",
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
                  "font-sans select-none transition-all duration-200",
                  isHighlighted
                    ? "text-white text-lg font-semibold drop-shadow-sm"
                    : "text-gray-200 text-base font-medium drop-shadow-sm",
                )}
                style={{
                  textShadow: isHighlighted
                    ? "0 1px 2px rgba(0, 0, 0, 0.5)"
                    : "0 1px 1px rgba(0, 0, 0, 0.8)",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
        <div
          className="absolute rounded-full bg-gray-600/90 border-gray-400 border-2 shadow-md shadow-black/40"
          style={{
            left: center.x - 15,
            top: center.y - 15,
            width: 30,
            height: 30,
          }}
        />
      </div>
    </div>
  );
};
