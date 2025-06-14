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
  type GestureActionWithoutPiemenu,
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
      type: "piemenu";
      piemenu: PiemenuMenu[];
    }
  | {
      type: "message";
      notice: string;
    }
  | {
      type: "none";
    };

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
      type: "message",
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
      return {
        type: "piemenu",
        piemenu: result.piemenu,
      };
    }
  }

  return {
    type: "none",
  };
}

type PiemenuActionResponse = {
  type: "none";
};

async function handlePiemenuActionMessage(
  message: PiemenuActionMessage,
): Promise<PiemenuActionResponse> {
  await callAction({
    gestureAction: message.action,
    contentContext: message.context,
  });
  return {
    type: "none",
  };
}

export async function handleMessage(rawMessage: unknown) {
  const message = parse(MessageSchema, rawMessage);
  const type = message.type;

  if (type === "gesture") {
    return await handleGestureMessage(message);
  }

  if (type === "piemenuAction") {
    return await handlePiemenuActionMessage(message);
  }

  throw new Error(`unexpected message type: ${type satisfies never}`);
}

export async function sendPimenuActionMessage({
  action,
  startPoint,
}: {
  action: GestureActionWithoutPiemenu;
  startPoint: Point;
}) {
  const message = {
    type: "piemenuAction",
    action,
    context: buildContentActionContext({ startPoint }),
  };
  const response = await browser.runtime.sendMessage(message);
  return response as PiemenuActionResponse;
}

export async function sendGestureMessage({
  directions,
  startPoint,
}: {
  directions: Direction[];
  startPoint: Point;
}) {
  const message = {
    type: "gesture",
    directions,
    context: buildContentActionContext({ startPoint }),
  };
  const response = await browser.runtime.sendMessage(message);
  return response as GestureResponse;
}
