/**
 * Action definitions
 *
 * Defines actions that are triggered by gestures
 * Each action is implemented as an async function
 */

import {
  type InferOutput,
  boolean,
  literal,
  object,
  optional,
  union,
} from "valibot";
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

  await browser.search.query({
    text: selectedText,
    disposition: "NEW_TAB",
  });
}

async function closeOtherTabsAction({ getCurrentTab }: ActionContext) {
  const currentTab = await getCurrentTab();
  const allTabs = await browser.tabs.query({
    currentWindow: true,
  });

  const tabsToClose = allTabs
    .filter((tab) => tab.id !== currentTab.id)
    .map((tab) => tab.id)
    .filter((id): id is number => id !== undefined);
  await browser.tabs.remove(tabsToClose);
}

const OpenLinkActionSchema = object({
  name: literal("openLink"),
  args: object({
    active: optional(boolean(), true),
  }),
});
type OpenLinkActionArgs = InferOutput<typeof OpenLinkActionSchema>["args"];

async function openLinkAction({
  content,
  getCurrentTab,
  active,
}: ActionContext & OpenLinkActionArgs) {
  if (!content.url) {
    return;
  }

  const tab = await getCurrentTab();
  await browser.tabs.create({
    url: content.url,
    index: tab.index + 1,
    active,
  });
}

const NoArgsActionNameSchema = union([
  literal("bookmark"),
  literal("goForward"),
  literal("goBackward"),
  literal("reload"),
  literal("scrollTop"),
  literal("scrollBottom"),
  literal("search"),
  literal("closeOtherTabs"),
]);

export const GestureActionSchema = union([
  OpenLinkActionSchema,
  object({
    name: NoArgsActionNameSchema,
  }),
]);

type GestureAction = InferOutput<typeof GestureActionSchema>;
type ActionName = GestureAction["name"];

const actions = {
  bookmark: bookmarkAction,
  goForward: goForwardAction,
  goBackward: goBackwardAction,
  reload: reloadAction,
  scrollTop: scrollTopAction,
  scrollBottom: scrollBottomAction,
  search: searchAction,
  closeOtherTabs: closeOtherTabsAction,
  openLink: openLinkAction,
} as const satisfies Record<ActionName, unknown>;

export async function callAction({
  gestureAction,
  contentContext,
}: {
  gestureAction: GestureAction;
  contentContext: ActionContext["content"];
}) {
  const context = buildActionContext(contentContext);

  if (gestureAction.name === "openLink") {
    const action = actions[gestureAction.name];
    await action({ ...context, ...gestureAction.args });
    return;
  }

  const action = actions[gestureAction.name];
  await action(context);
}
