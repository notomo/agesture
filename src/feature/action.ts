/**
 * Action definitions
 *
 * Defines actions that are triggered by gestures
 * Each action is implemented as an async function
 */

import type { ActionContext } from "./action-context";

export async function bookmarkAction(context: ActionContext): Promise<void> {
  const { background } = context;
  const { tab } = background;

  await browser.bookmarks.create({
    url: tab.url || "",
    title: tab.title || "Untitled",
  });
}

export const actions = {
  bookmark: bookmarkAction,
} as const;

export type Action = keyof typeof actions;
export type ActionFunction = (typeof actions)[Action];
