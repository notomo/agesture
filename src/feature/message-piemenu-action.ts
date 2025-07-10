import { array, type InferOutput, literal, object, union } from "valibot";
import {
  callAction,
  type GestureAction,
  GestureActionSchema,
  type PiemenuItem,
} from "./action";
import {
  buildContentActionContext,
  ContentActionContextSchema,
} from "./action-context";
import type { Point } from "./direction";

const PiemenuActionOrArraySchema = union([
  GestureActionSchema,
  array(GestureActionSchema),
]);

export const PiemenuActionMessageSchema = object({
  type: literal("piemenuAction"),
  action: PiemenuActionOrArraySchema,
  context: ContentActionContextSchema,
});

type PiemenuActionMessage = InferOutput<typeof PiemenuActionMessageSchema>;

type PiemenuActionResponse =
  | {
      type: "piemenu";
      items: PiemenuItem[];
    }
  | {
      type: "none";
    };

export async function handlePiemenuActionMessage(
  message: PiemenuActionMessage,
): Promise<PiemenuActionResponse> {
  const actions = Array.isArray(message.action)
    ? message.action
    : [message.action];

  for (const action of actions) {
    const result = await callAction({
      gestureAction: action,
      contentContext: message.context,
    });
    if (result) {
      return {
        type: "piemenu",
        items: result.piemenu,
      };
    }
  }

  return {
    type: "none",
  };
}

export async function sendPimenuActionMessage({
  action,
  startPoint,
}: {
  action: GestureAction | GestureAction[];
  startPoint: Point;
}) {
  const message: PiemenuActionMessage = {
    type: "piemenuAction",
    action,
    context: buildContentActionContext({ startPoint }),
  };
  const response = await browser.runtime.sendMessage(message);
  return response as PiemenuActionResponse;
}
