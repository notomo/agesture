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
  union,
} from "valibot";
import {
  GestureActionWithoutPiemenuSchema,
  type PiemenuMenu,
  callAction,
} from "./action";
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
  action: GestureActionWithoutPiemenuSchema,
  context: ContentActionContextSchema,
});

type PiemenuActionMessage = InferOutput<typeof PiemenuActionMessageSchema>;

const MessageSchema = union([GestureMessageSchema, PiemenuActionMessageSchema]);

type GestureResponse =
  | {
      piemenu?: PiemenuMenu[];
    }
  | { notice?: string };

export function parseGestureMessage(rawMessage: unknown) {
  return parse(GestureMessageSchema, rawMessage);
}

export function parsePiemenuActionMessage(rawMessage: unknown) {
  return parse(PiemenuActionMessageSchema, rawMessage);
}

async function handleGestureMessage(
  message: GestureMessage,
): Promise<GestureResponse> {
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
  await callAction({
    gestureAction: message.action,
    contentContext: message.context,
  });
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

export function buildPimenuActionMessage({
  action,
  startPoint,
}: {
  action: InferOutput<typeof GestureActionWithoutPiemenuSchema>;
  startPoint: Point;
}): PiemenuActionMessage {
  return {
    type: "piemenuAction",
    action,
    context: buildContentActionContext({ startPoint }),
  };
}

export async function sendGestureMessage({
  directions,
  startPoint,
}: {
  directions: Direction[];
  startPoint: Point;
}): Promise<GestureResponse> {
  const message = buildGestureMessage({ directions, startPoint });
  const response = await browser.runtime.sendMessage(message);
  return response as GestureResponse;
}
