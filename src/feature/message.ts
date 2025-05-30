/**
 * Message parsing utilities and schemas
 *
 * Defines message schemas and parsing functions for gesture messages
 */

import { type InferOutput, array, literal, object, parse } from "valibot";
import { callAction } from "./action";
import {
  ContentActionContextSchema,
  buildContentActionContext,
} from "./action-context";
import { type Direction, DirectionSchema, directionEquals } from "./direction";
import { getSetting } from "./setting";

const GestureMessageSchema = object({
  type: literal("gesture"),
  directions: array(DirectionSchema),
  context: ContentActionContextSchema,
});

type GestureMessage = InferOutput<typeof GestureMessageSchema>;

export function parseMessage(rawMessage: unknown) {
  return parse(GestureMessageSchema, rawMessage);
}

export async function handleMessage(rawMessage: unknown) {
  const message = parseMessage(rawMessage);
  const setting = await getSetting();

  const gesture = setting.gestures.find((x) => {
    return directionEquals(x.inputs, message.directions);
  });
  if (!gesture) {
    return {
      notice: `No matching gesture found for directions: ${message.directions.join(",")}`,
    };
  }

  await callAction({
    gestureAction: gesture.action,
    contentContext: message.context,
  });

  return {};
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
