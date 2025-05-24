/**
 * Module for recognizing mouse gesture directions
 */
import { type InferOutput, literal, union } from "valibot";

export const DirectionSchema = union([
  literal("UP"),
  literal("DOWN"),
  literal("LEFT"),
  literal("RIGHT"),
]);

export type Direction = InferOutput<typeof DirectionSchema>;

type Point = {
  x: number;
  y: number;
};

function detectDirection(
  from: Point,
  to: Point,
  minDistance: number,
): Direction | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < minDistance) {
    return null;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "RIGHT" : "LEFT";
  }
  return dy > 0 ? "DOWN" : "UP";
}

export function fromPoints({
  points,
  minDistance,
}: { points: Point[]; minDistance: number }) {
  const directions: Direction[] = [];

  let previous = points.at(0);
  if (!previous) {
    return [];
  }

  for (const current of points) {
    const direction = detectDirection(previous, current, minDistance);
    if (!direction) {
      continue;
    }
    previous = current;

    if (directions.at(-1) === direction) {
      continue;
    }

    directions.push(direction);
  }
  return directions;
}

export function directionEquals(a: Direction[], b: Direction[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((dir, index) => dir === b[index]);
}
