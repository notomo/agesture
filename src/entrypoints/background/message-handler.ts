/**
 * Message handler for background script
 *
 * Handles messages from content scripts and executes corresponding actions
 */

import { callAction } from "../../feature/action";
import { parseMessage } from "../../feature/message";
import { findGesture, getSetting } from "../../feature/setting";

export async function handleMessage(rawMessage: unknown): Promise<void> {
  const message = parseMessage(rawMessage);
  const setting = await getSetting();
  const gesture = findGesture(setting, message.directions);
  if (!gesture) {
    console.log(
      "No matching gesture found for directions:",
      message.directions,
    );
    return;
  }

  await callAction({
    actionName: gesture.action.name,
    contentContext: message.context,
  });
}
