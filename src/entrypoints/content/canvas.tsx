import { useCallback, useEffect, useRef } from "react";
import type { Point } from "@/src/feature/direction";

const useAnimation = (callback: () => void) => {
  const ref = useRef<number | null>(null);

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

const getCanvasContext = (canvas: HTMLCanvasElement) => {
  if (
    canvas.width !== window.innerWidth ||
    canvas.height !== window.innerHeight
  ) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("unexpected getContext failure");
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

  return { draw };
};

export const Canvas = ({ points }: { points: Point[] }) => {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const lastCountRef = useRef(0);

  const drawIncremental = useCallback(() => {
    const count = points.length;
    if (count === 0) {
      return;
    }

    const canvas = elementRef.current;
    if (!canvas) {
      return;
    }

    const lastCount = lastCountRef.current;
    lastCountRef.current = count;

    const { draw } = getCanvasContext(canvas);
    draw(points.slice(lastCount - 1));
  }, [points]);

  useAnimation(drawIncremental);

  if (points.length === 0) {
    return null;
  }

  return (
    <canvas
      ref={elementRef}
      className="pointer-events-none fixed inset-0 z-[9999] h-screen w-screen transform-gpu will-change-contents"
    />
  );
};
