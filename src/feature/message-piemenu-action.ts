import { type InferOutput, literal, object } from "valibot";
import {
  type GestureActionWithoutPiemenu,
  GestureActionWithoutPiemenuSchema,
  callAction,
} from "./action";
import {
  ContentActionContextSchema,
  buildContentActionContext,
} from "./action-context";
import type { Point } from "./direction";

export const PiemenuActionMessageSchema = object({
  type: literal("piemenuAction"),
  action: GestureActionWithoutPiemenuSchema,
  context: ContentActionContextSchema,
});

type PiemenuActionMessage = InferOutput<typeof PiemenuActionMessageSchema>;

type PiemenuActionResponse = {
  type: "none";
};

export async function handlePiemenuActionMessage(
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

export async function sendPimenuActionMessage({
  action,
  startPoint,
}: {
  action: GestureActionWithoutPiemenu;
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
