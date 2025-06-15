import { type InferOutput, literal, object } from "valibot";
import {
  type GestureAction,
  GestureActionSchema,
  type PiemenuMenu,
  callAction,
} from "./action";
import {
  ContentActionContextSchema,
  buildContentActionContext,
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
      piemenu: PiemenuMenu[];
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
      piemenu: result.piemenu,
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
