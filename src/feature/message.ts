/**
 * Message parsing utilities and schemas
 *
 * Defines message schemas and parsing functions for gesture messages
 */

import {
  type InferOutput,
  array,
  boolean,
  literal,
  object,
  parse,
  string,
} from "valibot";
import { DirectionSchema } from "./direction";

const ContentActionContextSchema = object({
  selectedText: string(),
  selectionExists: boolean(),
  gestureDirection: string(),
});

export const GestureMessageSchema = object({
  type: literal("gesture"),
  directions: array(DirectionSchema),
  context: ContentActionContextSchema,
});

export type GestureMessage = InferOutput<typeof GestureMessageSchema>;

export function parseMessage(message: unknown): GestureMessage {
  return parse(GestureMessageSchema, message);
}
