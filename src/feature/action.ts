/**
 * Action definitions
 *
 * Defines actions that are triggered by gestures
 * Each action is implemented as an async function
 */

import { type InferOutput, literal, union } from "valibot";
import type { ActionContext } from "./action-context";

export async function bookmarkAction({
  background,
}: ActionContext): Promise<void> {
  const { tab } = background;

  await browser.bookmarks.create({
    url: tab.url || "",
    title: tab.title || "Untitled",
  });
}

export const ActionNameSchema = union([literal("bookmark")]);
export type ActionName = InferOutput<typeof ActionNameSchema>;
type ActionFunction = (context: ActionContext) => void;

export const actions = {
  bookmark: bookmarkAction,
} as const satisfies Record<ActionName, ActionFunction>;
