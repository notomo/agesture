import { parse, union } from "valibot";
import { GestureMessageSchema, handleGestureMessage } from "./message-gesture";
import {
  handlePiemenuActionMessage,
  PiemenuActionMessageSchema,
} from "./message-piemenu-action";

const MessageSchema = union([GestureMessageSchema, PiemenuActionMessageSchema]);

export async function handleMessage(rawMessage: unknown) {
  const message = parse(MessageSchema, rawMessage);
  const type = message.type;
  switch (type) {
    case "gesture":
      return await handleGestureMessage(message);
    case "piemenuAction":
      return await handlePiemenuActionMessage(message);
    default:
      throw new Error(`unexpected message type: ${type satisfies never}`);
  }
}
