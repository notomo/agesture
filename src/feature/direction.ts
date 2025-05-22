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

export interface Point {
  x: number;
  y: number;
}

export interface DirectionConfig {
  // Minimum distance (in pixels) for direction detection
  minDistance: number;
}

export interface DirectionState {
  config: DirectionConfig;
  points: Point[];
  directions: Direction[];
  lastDirection: Direction | null;
}

const DEFAULT_CONFIG: DirectionConfig = {
  minDistance: 20,
};

export function createInitialState(
  config: Partial<DirectionConfig> = {},
): DirectionState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    points: [],
    directions: [],
    lastDirection: null,
  };
}

export function detectDirection(
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

export function addPoint(state: DirectionState, point: Point): DirectionState {
  const newPoints = [...state.points, point];

  if (state.points.length === 0) {
    return {
      ...state,
      points: newPoints,
    };
  }

  const lastPoint = state.points[state.points.length - 1];

  if (!lastPoint) {
    return {
      ...state,
      points: newPoints,
    };
  }

  const direction = detectDirection(lastPoint, point, state.config.minDistance);

  if (!direction || direction === state.lastDirection) {
    return {
      ...state,
      points: newPoints,
    };
  }

  return {
    ...state,
    points: newPoints,
    directions: [...state.directions, direction],
    lastDirection: direction,
  };
}

export function directionEquals(a: Direction[], b: Direction[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((dir, index) => dir === b[index]);
}

export function createDirectionRecognizer(
  config?: Partial<DirectionConfig>,
): DirectionState {
  return createInitialState(config);
}
