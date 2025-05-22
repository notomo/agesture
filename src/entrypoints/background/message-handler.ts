/**
 * Message handler for background script
 *
 * Handles messages from content scripts and executes corresponding actions
 */

import { type Action, actions } from "../../feature/action";
import { buildActionContext } from "../../feature/action-context";
import { parseMessage } from "../../feature/message";
import { findGestureByDirections, getSettings } from "../../feature/setting";

export async function handleMessage(message: unknown): Promise<void> {
  const parsedMessage = parseMessage(message);
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
