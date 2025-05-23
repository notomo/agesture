/**
 * Action definitions
 *
 * Defines actions that are triggered by gestures
 * Each action is implemented as an async function
 */

import { type InferOutput, literal, union } from "valibot";
import type { ActionContext } from "./action-context";

async function bookmarkAction({ background }: ActionContext) {
  const tab = await background.getCurrentTabInfo();
  await browser.bookmarks.create({
    url: tab.url,
    title: tab.title,
  });
}

export const ActionNameSchema = union([literal("bookmark")]);
type ActionName = InferOutput<typeof ActionNameSchema>;
type Action = (context: ActionContext) => Promise<void>;

export const actions = {
  bookmark: bookmarkAction,
} as const satisfies Record<ActionName, Action>;
