/**
 * Module for recognizing mouse gesture directions
 */

// Direction type definition with descriptive values
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

// Point coordinates interface
export interface Point {
  x: number;
  y: number;
}

// Gesture configuration interface
export interface DirectionConfig {
  // Minimum distance (in pixels) for direction detection
  minDistance: number;
}

// Direction recognizer state
export interface DirectionState {
  config: DirectionConfig;
  points: Point[];
  directions: Direction[];
  lastDirection: Direction | null;
}

// Default configuration
const DEFAULT_CONFIG: DirectionConfig = {
  minDistance: 20,
};

/**
 * Create initial state for direction recognizer
 */
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

/**
 * Detect direction between two points
 */
export function detectDirection(
  from: Point,
  to: Point,
  minDistance: number,
): Direction | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Don't detect direction if distance is less than minimum
  if (distance < minDistance) {
    return null;
  }

  // Determine direction by comparing horizontal and vertical angles
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "RIGHT" : "LEFT";
  }
  return dy > 0 ? "DOWN" : "UP";
}

/**
 * Add a new point and update directions
 */
export function addPoint(state: DirectionState, point: Point): DirectionState {
  const newPoints = [...state.points, point];

  if (state.points.length === 0) {
    return {
      ...state,
      points: newPoints,
    };
  }

  const lastPoint = state.points[state.points.length - 1];

  // Ensure lastPoint is defined before passing to detectDirection
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

/**
 * Reset the state
 */
export function resetState(): DirectionState {
  return createInitialState();
}

/**
 * Get directions as a string
 */
export function getDirectionsString(state: DirectionState): string {
  return state.directions.join("");
}

/**
 * Create a new direction recognizer state
 */
export function createDirectionRecognizer(
  config?: Partial<DirectionConfig>,
): DirectionState {
  return createInitialState(config);
}
