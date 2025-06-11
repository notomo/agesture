/**
 * Action definitions
 *
 * Defines actions that are triggered by gestures
 * Each action is implemented as an async function
 */

import {
  type InferOutput,
  array,
  boolean,
  literal,
  object,
  optional,
  string,
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

async function removeBookmarkAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  if (!tab.url) {
    return;
  }

  const bookmarkIds = (
    await browser.bookmarks.search({
      url: tab.url,
    })
  ).map((x) => x.id);
  for (const id of bookmarkIds) {
    await browser.bookmarks.remove(id);
  }
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

async function searchAction({ content, getCurrentTab }: ActionContext) {
  const selectedText = content.selectedText.trim();
  if (!selectedText) {
    return;
  }

  const tab = await getCurrentTab();
  const newTab = await browser.tabs.create({
    index: tab.index + 1,
  });
  await browser.search.query({
    text: selectedText,
    tabId: newTab.id,
  });
}

async function closeOtherTabsAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  const allTabs = await browser.tabs.query({
    currentWindow: true,
  });

  const tabsToClose = allTabs
    .filter((x) => x.id !== tab.id)
    .map((x) => x.id)
    .filter((tabId): tabId is number => tabId !== undefined);
  await browser.tabs.remove(tabsToClose);
}

async function maximizeWindowAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  await browser.windows.update(tab.windowId, {
    state: "maximized",
  });
}

async function moveTabToNewWindowAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  await browser.windows.create({
    tabId: tab.id,
  });
}

const OpenLinkActionSchema = object({
  name: literal("openLink"),
  args: object({
    active: optional(boolean(), true),
  }),
});
type OpenLinkActionArgs = InferOutput<typeof OpenLinkActionSchema>["args"];

const PiemenuActionSchema = object({
  name: literal("piemenu"),
  args: object({
    menu: array(string()),
  }),
});
type PiemenuActionArgs = InferOutput<typeof PiemenuActionSchema>["args"];

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

async function piemenuAction({ menu }: ActionContext & PiemenuActionArgs) {
  return {
    piemenu: menu,
  };
}

const NoArgsActionNameSchema = union([
  literal("bookmark"),
  literal("removeBookmark"),
  literal("goForward"),
  literal("goBackward"),
  literal("reload"),
  literal("scrollTop"),
  literal("scrollBottom"),
  literal("search"),
  literal("closeOtherTabs"),
  literal("maximizeWindow"),
  literal("moveTabToNewWindow"),
]);

export const GestureActionSchema = union([
  OpenLinkActionSchema,
  PiemenuActionSchema,
  object({
    name: NoArgsActionNameSchema,
  }),
]);

type GestureAction = InferOutput<typeof GestureActionSchema>;
type ActionName = GestureAction["name"];

const actions = {
  bookmark: bookmarkAction,
  removeBookmark: removeBookmarkAction,
  goForward: goForwardAction,
  goBackward: goBackwardAction,
  reload: reloadAction,
  scrollTop: scrollTopAction,
  scrollBottom: scrollBottomAction,
  search: searchAction,
  closeOtherTabs: closeOtherTabsAction,
  maximizeWindow: maximizeWindowAction,
  moveTabToNewWindow: moveTabToNewWindowAction,
  openLink: openLinkAction,
  piemenu: piemenuAction,
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

  if (gestureAction.name === "piemenu") {
    const action = actions[gestureAction.name];
    return await action({ ...context, ...gestureAction.args });
  }

  const action = actions[gestureAction.name];
  await action(context);
}
