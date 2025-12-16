import { array, type InferOutput, literal, object, union } from "valibot";
import {
  type ActionResult,
  callActions,
  type GestureAction,
  GestureActionSchema,
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
  | ActionResult
  | {
      type: "none";
    };

export async function handlePiemenuActionMessage(
  message: PiemenuActionMessage,
): Promise<PiemenuActionResponse> {
  const result = await callActions({
    actions: message.action,
    contentContext: message.context,
  });
  return result ?? { type: "none" };
}

export async function sendPimenuActionMessage({
  action,
  startPoint,
  selectedText,
}: {
  action: GestureAction | GestureAction[];
  startPoint: Point;
  selectedText: string;
}) {
  const message: PiemenuActionMessage = {
    type: "piemenuAction",
    action,
    context: buildContentActionContext({ startPoint, selectedText }),
  };
  const response = await browser.runtime.sendMessage(message);
  return response as PiemenuActionResponse;
}
