/**
 * Message handler for background script
 *
 * Handles messages from content scripts and executes corresponding actions
 */

import {
  type InferOutput,
  array,
  boolean,
  object,
  parse,
  string,
} from "valibot";
import { type Action, actions } from "../../feature/action";
import { buildActionContext } from "../../feature/action-context";
import { DirectionSchema } from "../../feature/direction";
import { findGestureByDirections, getSettings } from "../../feature/setting";

const ContentActionContextSchema = object({
  selectedText: string(),
  selectionExists: boolean(),
  gestureDirection: string(),
});

export const GestureMessageSchema = object({
  type: string(),
  directions: array(DirectionSchema),
  context: ContentActionContextSchema,
});

export type GestureMessage = InferOutput<typeof GestureMessageSchema>;

export async function handleMessage(message: unknown): Promise<void> {
  const parsedMessage = parse(GestureMessageSchema, message);

  if (parsedMessage.type !== "gesture") {
    return;
  }

  const settings = await getSettings();
  const gesture = findGestureByDirections(settings, parsedMessage.directions);

  if (!gesture) {
    console.log(
      "No matching gesture found for directions:",
      parsedMessage.directions,
    );
    return;
  }

  const actionName = gesture.action.name as Action;
  const actionFunction = actions[actionName];

  if (!actionFunction) {
    console.error(`Unknown action: ${gesture.action.name}`);
    return;
  }

  const contentContext = parsedMessage.context;
  const fullContext = await buildActionContext(contentContext);
  await actionFunction(fullContext);
}
