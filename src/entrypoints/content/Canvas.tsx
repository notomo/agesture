import { useEffect, useRef } from "react";

export const Canvas = ({
  points,
}: {
  points: { x: number; y: number }[];
}) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length === 0) {
      return;
    }

    context.strokeStyle = "red";
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();

    const firstPoint = points.at(0);
    if (firstPoint) {
      context.moveTo(firstPoint.x, firstPoint.y);
    }

    for (const point of points) {
      context.lineTo(point.x, point.y);
    }

    context.stroke();
  }, [points]);

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
      }}
    />
  );
};
