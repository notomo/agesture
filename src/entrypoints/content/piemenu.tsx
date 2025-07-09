import { useEffect, useState } from "react";
import type { GestureAction, PiemenuItem } from "@/src/feature/action";
import type { Point } from "@/src/feature/direction";
import { cn } from "@/src/lib/tailwind";

const calculateAngleStep = (itemCount: number): number => {
  return (2 * Math.PI) / itemCount;
};

const calculateSectorAngles = (
  index: number,
  itemCount: number,
): { startAngle: number; endAngle: number } => {
  const angleStep = calculateAngleStep(itemCount);
  const startAngle = index * angleStep - Math.PI / 2 - angleStep / 2;
  const endAngle = startAngle + angleStep;
  return { startAngle, endAngle };
};

const calculateItemAngle = (index: number, itemCount: number): number => {
  return (index * 2 * Math.PI) / itemCount - Math.PI / 2;
};

const calculateDistance = (point1: Point, point2: Point): number => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const calculateMouseAngle = (mousePos: Point, center: Point): number => {
  const dx = mousePos.x - center.x;
  const dy = mousePos.y - center.y;
  return Math.atan2(dy, dx);
};

const calculateAngleDifference = (angle1: number, angle2: number): number => {
  let angleDiff = Math.abs(angle1 - angle2);
  if (angleDiff > Math.PI) {
    angleDiff = 2 * Math.PI - angleDiff;
  }
  return angleDiff;
};

const calculatePointOnCircle = (
  center: Point,
  radius: number,
  angle: number,
): Point => {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
};

const getHighlightedIndex = (
  mousePos: Point,
  center: Point,
  itemCount: number,
): number => {
  if (itemCount === 0) {
    return -1;
  }

  const distance = calculateDistance(mousePos, center);
  if (distance < 35) {
    return -1;
  }

  const mouseAngle = calculateMouseAngle(mousePos, center);
  const itemsWithAngles = Array.from({ length: itemCount }, (_, i) => ({
    index: i,
    angleDiff: calculateAngleDifference(
      mouseAngle,
      calculateItemAngle(i, itemCount),
    ),
  }));
  const closestItem = itemsWithAngles.reduce((min, item) =>
    item.angleDiff < min.angleDiff ? item : min,
  );
  return closestItem.index;
};

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
    const angleStep = calculateAngleStep(itemCount);
    const { startAngle, endAngle } = calculateSectorAngles(index, itemCount);
    const outerRadius = radius + 40;
    const innerRadius = 35;

    const startOuter = calculatePointOnCircle(center, outerRadius, startAngle);
    const endOuter = calculatePointOnCircle(center, outerRadius, endAngle);
    const startInner = calculatePointOnCircle(center, innerRadius, startAngle);
    const endInner = calculatePointOnCircle(center, innerRadius, endAngle);

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
          ? "fill-blue-500 stroke-1 stroke-blue-400"
          : "fill-gray-600 stroke-1 stroke-gray-500",
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
  const angle = calculateItemAngle(index, itemCount);
  const textRadius = radius * 0.7;
  const position = calculatePointOnCircle(center, textRadius, angle);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setHighlightedIndex(getHighlightedIndex(pos, center, items.length));
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
  }, [items, highlightedIndex, onClose, onSelect, center]);

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
