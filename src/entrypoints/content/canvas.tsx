import { useCallback, useEffect, useRef } from "react";
import type { Point } from "@/src/feature/direction";

export const Canvas = ({ points }: { points: Point[] }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const lastPointCountRef = useRef(0);

  const initializeCanvas = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return null;

    const context = canvas.getContext("2d");
    if (!context) return null;

    // Always ensure canvas is properly sized and styled
    if (
      canvas.width !== window.innerWidth ||
      canvas.height !== window.innerHeight
    ) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    context.strokeStyle = "red";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";

    return { canvas, context };
  }, []);

  const drawIncremental = useCallback(() => {
    const result = initializeCanvas();
    if (!result) return;

    const { canvas, context } = result;
    const currentPointCount = points.length;
    const lastPointCount = lastPointCountRef.current;

    if (currentPointCount === 0) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      lastPointCountRef.current = 0;
      return;
    }

    if (currentPointCount === 1) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const point = points[0];
      if (point) {
        context.beginPath();
        context.arc(point.x, point.y, 1.5, 0, 2 * Math.PI);
        context.fill();
      }
      lastPointCountRef.current = 1;
      return;
    }

    // Incremental drawing: add only new line segments
    if (currentPointCount > lastPointCount && lastPointCount >= 1) {
      for (let i = Math.max(1, lastPointCount); i < currentPointCount; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];

        if (prevPoint && currentPoint) {
          context.beginPath();
          context.moveTo(prevPoint.x, prevPoint.y);
          context.lineTo(currentPoint.x, currentPoint.y);
          context.stroke();
        }
      }
    }
    // Full redraw when we have new gesture or significant change
    else if (
      currentPointCount > 1 &&
      (lastPointCount === 0 || currentPointCount < lastPointCount)
    ) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      const firstPoint = points[0];
      if (firstPoint) {
        context.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < points.length; i++) {
          const point = points[i];
          if (point) {
            context.lineTo(point.x, point.y);
          }
        }
        context.stroke();
      }
    }

    lastPointCountRef.current = currentPointCount;
    rafRef.current = undefined;
  }, [points, initializeCanvas]);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(drawIncremental);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [drawIncremental]);

  if (points.length === 0) {
    return null;
  }

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "contents",
        transform: "translateZ(0)",
      }}
    />
  );
};
