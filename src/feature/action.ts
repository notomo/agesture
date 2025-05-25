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

async function goForwardAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  await browser.tabs.goForward(tab.id);
}

async function goBackwardAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  await browser.tabs.goBack(tab.id);
}

export const ActionNameSchema = union([
  literal("bookmark"),
  literal("goForward"),
  literal("goBackward"),
]);
type ActionName = InferOutput<typeof ActionNameSchema>;
type Action = (context: ActionContext) => Promise<void>;

const actions = {
  bookmark: bookmarkAction,
  goForward: goForwardAction,
  goBackward: goBackwardAction,
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
