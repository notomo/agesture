import { array, type InferOutput, object, union } from "valibot";
import { type GestureAction, GestureActionSchema } from "./action";
import { type Direction, DirectionSchema, directionEquals } from "./direction";

const GestureActionOrArraySchema = union([
  GestureActionSchema,
  array(GestureActionSchema),
]);

export const GestureSchema = object({
  inputs: array(DirectionSchema),
  action: GestureActionOrArraySchema,
});

export type Gesture = InferOutput<typeof GestureSchema>;

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
