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

async function reloadAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  await browser.tabs.reload(tab.id);
}

async function scrollTopAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      window.scrollTo(0, 0);
    },
  });
}

async function scrollBottomAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      window.scrollTo(0, document.body.scrollHeight);
    },
  });
}

async function searchAction({ content }: ActionContext) {
  const selectedText = content.selectedText.trim();
  if (!selectedText) {
    return;
  }

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
  await browser.tabs.create({ url: searchUrl });
}

export const ActionNameSchema = union([
  literal("bookmark"),
  literal("goForward"),
  literal("goBackward"),
  literal("reload"),
  literal("scrollTop"),
  literal("scrollBottom"),
  literal("search"),
]);
type ActionName = InferOutput<typeof ActionNameSchema>;
type Action = (context: ActionContext) => Promise<void>;

const actions = {
  bookmark: bookmarkAction,
  goForward: goForwardAction,
  goBackward: goBackwardAction,
  reload: reloadAction,
  scrollTop: scrollTopAction,
  scrollBottom: scrollBottomAction,
  search: searchAction,
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
