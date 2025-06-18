import { type InferOutput, literal, object } from "valibot";
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

export const PiemenuActionMessageSchema = object({
  type: literal("piemenuAction"),
  action: GestureActionSchema,
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
  const result = await callAction({
    gestureAction: message.action,
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

export async function sendPimenuActionMessage({
  action,
  startPoint,
}: {
  action: GestureAction;
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
