import { array, type InferOutput, literal, object, union } from "valibot";
import {
  callActions,
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
      type: "message";
      notice: string;
    }
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
  if (result) {
    if (result.type === "message") {
      return {
        type: "message",
        notice: result.notice,
      };
    }
    if (result.type === "piemenu") {
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
