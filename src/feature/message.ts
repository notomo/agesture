/**
 * Message parsing utilities and schemas
 *
 * Defines message schemas and parsing functions for gesture messages
 */

import { array, literal, object, parse, string } from "valibot";
import { DirectionSchema } from "./direction";

const ContentActionContextSchema = object({
  selectedText: string(),
});

const GestureMessageSchema = object({
  type: literal("gesture"),
  directions: array(DirectionSchema),
  context: ContentActionContextSchema,
});

export function parseMessage(message: unknown) {
  return parse(GestureMessageSchema, message);
}
