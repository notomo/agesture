import { useCallback, useEffect, useState } from "react";
import type { GestureAction, PiemenuItem } from "@/src/feature/action";
import type { Point } from "@/src/feature/direction";
import { cn } from "@/src/lib/tailwind";

const PiemenuSector = ({
  index,
  center,
  radius,
  itemCount,
  isHighlighted,
}: {
  index: number;
  center: Point;
  radius: number;
  itemCount: number;
  isHighlighted: boolean;
}) => {
  const createSectorPath = () => {
    const angleStep = (2 * Math.PI) / itemCount;
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
    <path
      d={createSectorPath()}
      className={cn(
        "transition-all duration-150",
        isHighlighted
          ? "fill-blue-500 stroke-2 stroke-blue-500"
          : "fill-gray-600 stroke-1 stroke-gray-600",
      )}
    />
  );
};

const PiemenuLabel = ({
  item,
  index,
  center,
  radius,
  itemCount,
}: {
  item: PiemenuItem;
  index: number;
  center: Point;
  radius: number;
  itemCount: number;
}) => {
  const getTextPosition = () => {
    const angle = (index * 2 * Math.PI) / itemCount - Math.PI / 2;
    const textRadius = radius * 0.7;
    return {
      x: center.x + Math.cos(angle) * textRadius,
      y: center.y + Math.sin(angle) * textRadius,
    };
  };

  const position = getTextPosition();

  return (
    <div
      className="-translate-x-1/2 -translate-y-1/2 absolute flex h-8 w-30 items-center justify-center transition-all duration-150"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <span
        className={cn(
          "select-none rounded-md px-3 py-1 font-sans font-semibold text-white text-xl transition-all duration-150",
        )}
      >
        {item.label}
      </span>
    </div>
  );
};

export const Piemenu = ({
  items,
  center,
  onClose,
  onSelect,
}: {
  items: PiemenuItem[];
  center: Point;
  onClose: () => void;
  onSelect: (action: GestureAction) => void;
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const radius = 180;

  const getHighlightedIndex = useCallback(
    (mousePos: Point) => {
      if (items.length === 0) return -1;

      const dx = mousePos.x - center.x;
      const dy = mousePos.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 35) return -1;

      const mouseAngle = Math.atan2(dy, dx);
      let closestIndex = -1;
      let smallestAngleDiff = Number.POSITIVE_INFINITY;

      for (let i = 0; i < items.length; i++) {
        const itemAngle = (i * 2 * Math.PI) / items.length - Math.PI / 2;
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
    [items.length, center.x, center.y],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setHighlightedIndex(getHighlightedIndex(pos));
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();

      if (e.button === 2) {
        onClose();
        return;
      }

      const item = items[highlightedIndex];
      if (e.button === 0 && item) {
        onClose();
        onSelect(item.action);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [items, highlightedIndex, onClose, onSelect, getHighlightedIndex]);

  return (
    <div className="pointer-events-none fixed inset-0 z-9999">
      <div className="pointer-events-auto h-full w-full">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          role="img"
          aria-label="Piemenu selection areas"
        >
          {items.map((item, index) => (
            <PiemenuSector
              key={`sector-${item.label}`}
              index={index}
              center={center}
              radius={radius}
              itemCount={items.length}
              isHighlighted={index === highlightedIndex}
            />
          ))}
        </svg>
        {items.map((item, index) => (
          <PiemenuLabel
            key={item.label}
            item={item}
            index={index}
            center={center}
            radius={radius}
            itemCount={items.length}
          />
        ))}
      </div>
    </div>
  );
};
