/**
 * Action definitions
 *
 * Defines actions that are triggered by gestures
 * Each action is implemented as an async function
 */

import { type InferOutput, literal, union } from "valibot";
import { type ActionContext, buildActionContext } from "./action-context";

async function bookmarkAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  await browser.bookmarks.create({
    url: tab.url,
    title: tab.title,
  });
}

export const ActionNameSchema = union([literal("bookmark")]);
type ActionName = InferOutput<typeof ActionNameSchema>;
type Action = (context: ActionContext) => Promise<void>;

const actions = {
  bookmark: bookmarkAction,
} as const satisfies Record<ActionName, Action>;

export async function callAction({
  actionName,
  contentContext,
}: {
  actionName: ActionName;
  contentContext: ActionContext["content"];
}) {
  const action = actions[actionName];
  const context = buildActionContext(contentContext);
  await action(context);
}
