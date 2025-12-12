/**
 * Module for matching gesture directions to configured gestures
 */

import type { GestureAction } from "./action";
import { type Direction, directionEquals } from "./direction";

export type Gesture = {
  inputs: Direction[];
  action: GestureAction | GestureAction[];
};

export function findMatchingGesture({
  directions,
  gestures,
}: {
  directions: Direction[];
  gestures: readonly Gesture[];
}): Gesture | null {
  return (
    gestures.find((gesture) => directionEquals(gesture.inputs, directions)) ??
    null
  );
}

export function extractActionName(
  action: GestureAction | GestureAction[],
): string {
  if (Array.isArray(action)) {
    return action[0]?.name ?? "";
  }
  return action.name;
}
