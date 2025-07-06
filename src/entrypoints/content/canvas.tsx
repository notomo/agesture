import { useCallback, useEffect, useRef } from "react";
import type { Point } from "@/src/feature/direction";

const useAnimation = (callback: () => void) => {
  const ref = useRef<number | undefined>(undefined);

  useEffect(() => {
    const cancel = () => {
      if (!ref.current) {
        return;
      }
      cancelAnimationFrame(ref.current);
    };

    cancel();
    ref.current = requestAnimationFrame(callback);

    return cancel;
  }, [callback]);
};

export const Canvas = ({ points }: { points: Point[] }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const lastPointCountRef = useRef(0);

  const drawIncremental = useCallback(() => {
    const pointCount = points.length;
    if (pointCount === 0) {
      return;
    }

    const canvas = ref.current;
    if (!canvas) {
      return;
    }
    if (
      canvas.width !== window.innerWidth ||
      canvas.height !== window.innerHeight
    ) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.strokeStyle = "red";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";

    const draw = (targets: Point[]) => {
      const first = targets[0];
      if (!first) {
        return;
      }
      context.beginPath();
      context.moveTo(first.x, first.y);
      for (const point of targets) {
        context.lineTo(point.x, point.y);
      }
      context.stroke();
    };

    const lastPointCount = lastPointCountRef.current;
    lastPointCountRef.current = pointCount;

    // Incremental drawing: add only new line segments
    if (pointCount > lastPointCount) {
      draw(points.slice(lastPointCount - 1));
      return;
    }

    // Full redraw when we have new gesture or significant change
    context.clearRect(0, 0, canvas.width, canvas.height);
    draw(points);
  }, [points]);

  useAnimation(drawIncremental);

  if (points.length === 0) {
    return null;
  }

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[9999] h-screen w-screen transform-gpu will-change-contents"
    />
  );
};
