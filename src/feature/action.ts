/**
 * Action definitions
 *
 * Defines actions that are triggered by gestures
 * Each action is implemented as an async function
 */

import { type InferOutput, literal, union } from "valibot";
import type { ActionContext } from "./action-context";

async function bookmarkAction({ background }: ActionContext) {
  const { tab } = background;

  await browser.bookmarks.create({
    url: tab.url || "",
    title: tab.title || "Untitled",
  });
}

export const ActionNameSchema = union([literal("bookmark")]);
type ActionName = InferOutput<typeof ActionNameSchema>;
type Action = (context: ActionContext) => void;

export const actions = {
  bookmark: bookmarkAction,
} as const satisfies Record<ActionName, Action>;
