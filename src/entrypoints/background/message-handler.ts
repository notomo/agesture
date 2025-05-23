/**
 * Message handler for background script
 *
 * Handles messages from content scripts and executes corresponding actions
 */

import { actions } from "../../feature/action";
import { buildActionContext } from "../../feature/action-context";
import { parseMessage } from "../../feature/message";
import { findGestureByDirections, getSettings } from "../../feature/setting";

export async function handleMessage(rawMessage: unknown): Promise<void> {
  const message = parseMessage(rawMessage);
  const settings = await getSettings();
  const gesture = findGestureByDirections(settings, message.directions);

  if (!gesture) {
    console.log(
      "No matching gesture found for directions:",
      message.directions,
    );
    return;
  }

  const actionName = gesture.action.name;
  const action = actions[actionName];
  const context = await buildActionContext(message.context);
  await action(context);
}
