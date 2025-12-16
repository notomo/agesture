import { array, type InferOutput, literal, object } from "valibot";
import { type ActionResult, callActions } from "./action";
import {
  buildContentActionContext,
  ContentActionContextSchema,
} from "./action-context";
import { type Direction, DirectionSchema, type Point } from "./direction";
import { findMatchingGesture } from "./gesture-matcher";
import { getSetting } from "./setting";

export const GestureMessageSchema = object({
  type: literal("gesture"),
  directions: array(DirectionSchema),
  context: ContentActionContextSchema,
});

type GestureMessage = InferOutput<typeof GestureMessageSchema>;

type GestureResponse =
  | ActionResult
  | {
      type: "none";
    };

export async function handleGestureMessage(
  message: GestureMessage,
): Promise<GestureResponse> {
  const setting = await getSetting();

  const gesture = findMatchingGesture({
    gestures: setting.gestures,
    directions: message.directions,
  });
  if (!gesture) {
    return {
      type: "message",
      message: {
        info: "No matching gesture found",
        directions: message.directions,
      },
    };
  }

  const result = await callActions({
    actions: gesture.action,
    contentContext: message.context,
  });
  return result ?? { type: "none" };
}

export async function sendGestureMessage({
  directions,
  startPoint,
  selectedText,
}: {
  directions: Direction[];
  startPoint: Point;
  selectedText: string;
}) {
  const message: GestureMessage = {
    type: "gesture",
    directions,
    context: buildContentActionContext({ startPoint, selectedText }),
  };
  const response = await browser.runtime.sendMessage(message);
  return response as GestureResponse;
}
