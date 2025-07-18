import { array, type InferOutput, literal, object } from "valibot";
import { callActions, type PiemenuItem } from "./action";
import {
  buildContentActionContext,
  ContentActionContextSchema,
} from "./action-context";
import {
  type Direction,
  DirectionSchema,
  directionEquals,
  type Point,
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
      items: PiemenuItem[];
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

  const result = await callActions({
    actions: gesture.action,
    contentContext: message.context,
  });
  if (result) {
    return {
      type: "piemenu",
      items: result.piemenu,
    };
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
