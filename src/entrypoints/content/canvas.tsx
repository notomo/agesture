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

  const clear = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  return { draw, clear };
};

export const Canvas = ({ points }: { points: Point[] }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const lastCountRef = useRef(0);

  const drawIncremental = useCallback(() => {
    const count = points.length;
    if (count === 0) {
      return;
    }

    const canvas = ref.current;
    if (!canvas) {
      return;
    }

    const { draw, clear } = getCanvasContext(canvas);

    const lastCount = lastCountRef.current;
    lastCountRef.current = count;

    if (count > lastCount) {
      draw(points.slice(lastCount - 1));
      return;
    }

    clear();
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
