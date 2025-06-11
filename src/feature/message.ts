/**
 * Message parsing utilities and schemas
 *
 * Defines message schemas and parsing functions for gesture messages
 */

import {
  type InferOutput,
  array,
  literal,
  object,
  parse,
  string,
  union,
} from "valibot";
import { callAction } from "./action";
import {
  ContentActionContextSchema,
  buildContentActionContext,
} from "./action-context";
import {
  type Direction,
  DirectionSchema,
  type Point,
  directionEquals,
} from "./direction";
import { getSetting } from "./setting";

const GestureMessageSchema = object({
  type: literal("gesture"),
  directions: array(DirectionSchema),
  context: ContentActionContextSchema,
});

type GestureMessage = InferOutput<typeof GestureMessageSchema>;

const PiemenuActionMessageSchema = object({
  type: literal("piemenuAction"),
  actionName: string(),
  context: ContentActionContextSchema,
});

type PiemenuActionMessage = InferOutput<typeof PiemenuActionMessageSchema>;

const MessageSchema = union([GestureMessageSchema, PiemenuActionMessageSchema]);

export function parseGestureMessage(rawMessage: unknown) {
  return parse(GestureMessageSchema, rawMessage);
}

export function parsePiemenuActionMessage(rawMessage: unknown) {
  return parse(PiemenuActionMessageSchema, rawMessage);
}

async function handleGestureMessage(message: GestureMessage) {
  const setting = await getSetting();

  const gesture = setting.gestures.find((x) => {
    return directionEquals(x.inputs, message.directions);
  });
  if (!gesture) {
    return {
      notice: `No matching gesture found for directions: ${message.directions.join(",")}`,
    };
  }

  const actions = Array.isArray(gesture.action)
    ? gesture.action
    : [gesture.action];

  for (const action of actions) {
    const result = await callAction({
      gestureAction: action,
      contentContext: message.context,
    });
    if (result) {
      return result;
    }
  }

  return {};
}

async function handlePiemenuActionMessage(message: PiemenuActionMessage) {
  const setting = await getSetting();

  const gesture = setting.gestures.find((g) => {
    const actions = Array.isArray(g.action) ? g.action : [g.action];
    return actions.some((a) => a.name === message.actionName);
  });

  if (gesture) {
    const actions = Array.isArray(gesture.action)
      ? gesture.action
      : [gesture.action];
    const action = actions.find((a) => a.name === message.actionName);

    if (action) {
      await callAction({
        gestureAction: action,
        contentContext: message.context,
      });
    }
  }
}

export async function handleMessage(rawMessage: unknown) {
  const message = parse(MessageSchema, rawMessage);

  if (message.type === "gesture") {
    return handleGestureMessage(message);
  }

  if (message.type === "piemenuAction") {
    return handlePiemenuActionMessage(message);
  }
}

export function buildGestureMessage({
  directions,
  startPoint,
}: {
  directions: Direction[];
  startPoint: Point;
}): GestureMessage {
  return {
    type: "gesture",
    directions,
    context: buildContentActionContext({ startPoint }),
  };
}
