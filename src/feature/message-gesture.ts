import { type InferOutput, array, literal, object } from "valibot";
import { type PiemenuItem, callAction } from "./action";
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

export const GestureMessageSchema = object({
  type: literal("gesture"),
  directions: array(DirectionSchema),
  context: ContentActionContextSchema,
});

type GestureMessage = InferOutput<typeof GestureMessageSchema>;

type GestureResponse =
  | {
      type: "piemenu";
      piemenu: PiemenuItem[];
    }
  | {
      type: "message";
      notice: string;
    }
  | {
      type: "none";
    };

export async function handleGestureMessage(
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

export async function sendGestureMessage({
  directions,
  startPoint,
}: {
  directions: Direction[];
  startPoint: Point;
}) {
  const message: GestureMessage = {
    type: "gesture",
    directions,
    context: buildContentActionContext({ startPoint }),
  };
  const response = await browser.runtime.sendMessage(message);
  return response as GestureResponse;
}
