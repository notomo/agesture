/**
 * Action definitions
 *
 * Defines actions that are triggered by gestures
 * Each action is implemented as an async function
 */

import type { ActionContext } from "./action-context";

/**
 * Bookmark creation action
 *
 * When this action is executed, it adds the current page or selected item
 * to bookmarks
 *
 * @param context - The action execution context
 * @returns {Promise<void>} Promise indicating completion of the action
 */
export async function bookmarkAction(context: ActionContext): Promise<void> {
  // Extract relevant information from context
  const { tab } = context;

  // Create bookmark data based on available context
  const bookmarkData = {
    url: tab.url || "",
    title: tab.title || "Untitled",
  };

  // Save bookmark using browser API
  await browser.bookmarks.create({
    url: bookmarkData.url,
    title: bookmarkData.title,
  });
}

/**
 * Available actions definition
 *
 * Action definitions used for gesture mapping
 */
export const actions = {
  bookmark: bookmarkAction,
} as const;

/**
 * Action type definitions
 */
export type Action = keyof typeof actions;
export type ActionFunction = (typeof actions)[Action];
