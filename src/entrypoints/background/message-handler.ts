/**
 * Message handler for background script
 *
 * Handles messages from content scripts and executes corresponding actions
 */

import {
  type InferOutput,
  array,
  boolean,
  number,
  object,
  parse,
  string,
  undefined_,
  union,
} from "valibot";
import { type Action, actions } from "../../feature/action";
import { DirectionSchema } from "../../feature/direction";
import { findGestureByDirections, getSettings } from "../../feature/setting";

/**
 * Schema for TabInfo - matching the interface where properties can be undefined
 */
const TabInfoSchema = object({
  id: union([number(), undefined_()]),
  url: union([string(), undefined_()]),
  title: union([string(), undefined_()]),
});

/**
 * Schema for ActiveElement
 */
const ActiveElementSchema = object({
  href: union([string(), undefined_()]),
  tagName: union([string(), undefined_()]),
  innerText: union([string(), undefined_()]),
  isInput: boolean(),
  isEditable: boolean(),
  value: union([string(), undefined_()]),
});

/**
 * Schema for ActionContext
 */
const ActionContextSchema = object({
  selectedText: string(),
  tab: TabInfoSchema,
  activeElement: ActiveElementSchema,
  selectionExists: boolean(),
  gestureDirection: string(),
});

/**
 * Message schema for gesture execution
 */
export const GestureMessageSchema = object({
  type: string(),
  directions: array(DirectionSchema),
  context: ActionContextSchema,
});

/**
 * Type for gesture execution message
 */
export type GestureMessage = InferOutput<typeof GestureMessageSchema>;

/**
 * Handle incoming messages from content scripts
 */
export async function handleMessage(message: unknown): Promise<void> {
  // Parse the message using valibot for type safety
  const parsedMessage = parse(GestureMessageSchema, message);

  // Only handle gesture messages
  if (parsedMessage.type !== "gesture") {
    return;
  }

  // Get current settings
  const settings = await getSettings();

  // Find matching gesture configuration
  const gesture = findGestureByDirections(settings, parsedMessage.directions);

  if (!gesture) {
    console.log(
      "No matching gesture found for directions:",
      parsedMessage.directions,
    );
    return;
  }

  // Get the action function
  const actionName = gesture.action.name as Action;
  const actionFunction = actions[actionName];

  if (!actionFunction) {
    console.error(`Unknown action: ${gesture.action.name}`);
    return;
  }

  // Execute the action with the provided context
  await actionFunction(parsedMessage.context);
}
