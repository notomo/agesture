/**
 * Message parsing utilities and schemas
 *
 * Defines message schemas and parsing functions for gesture messages
 */

import { type InferOutput, array, literal, object, parse } from "valibot";
import {
  ContentActionContextSchema,
  buildContentActionContext,
} from "./action-context";
import { type Direction, DirectionSchema } from "./direction";

const GestureMessageSchema = object({
  type: literal("gesture"),
  directions: array(DirectionSchema),
  context: ContentActionContextSchema,
});

type GestureMessage = InferOutput<typeof GestureMessageSchema>;

export function parseMessage(message: unknown) {
  return parse(GestureMessageSchema, message);
}

export function buildGestureMessage(
  directions: Direction[],
  startPoint: { x: number; y: number },
): GestureMessage {
  return {
    type: "gesture",
    directions,
    context: buildContentActionContext(startPoint),
  };
}
