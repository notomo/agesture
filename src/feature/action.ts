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

async function maximizeWindowAction({
  getCurrentTab,
  all,
}: ActionContext & { all?: boolean }) {
  if (!all) {
    const tab = await getCurrentTab();
    await browser.windows.update(tab.windowId, {
      state: "maximized",
    });
    return;
  }

  const allWindows = await browser.windows.getAll();
  for (const window of allWindows) {
    if (window.id) {
      await browser.windows.update(window.id, {
        state: "maximized",
      });
    }
  }
}

async function moveTabToNextWindowAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  const allWindows = await browser.windows.getAll();

  const sortedWindows = allWindows
    .filter((window) => window.id !== undefined)
    .sort((a, b) => (a.id || 0) - (b.id || 0));
  if (sortedWindows.length <= 1) {
    await browser.windows.create({
      tabId: tab.id,
    });
    return;
  }

  const currentWindowIndex = sortedWindows.findIndex(
    (window) => window.id === tab.windowId,
  );
  if (currentWindowIndex === -1) {
    return;
  }

  const nextWindowIndex = (currentWindowIndex + 1) % sortedWindows.length;
  const nextWindow = sortedWindows[nextWindowIndex];
  if (nextWindow?.id) {
    await browser.tabs.move(tab.id, {
      windowId: nextWindow.id,
      index: -1, // Move to end of tab list
    });
  }
}

async function doNothingAction(_: ActionContext) {
  // Intentionally does nothing
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
  literal("moveTabToNextWindow"),
  literal("doNothing"),
]);
const ActionNameSchema = union([
  NoArgsActionNameSchema,
  literal("openLink"),
  literal("openUrl"),
  literal("piemenu"),
  literal("maximizeWindow"),
]);

const OpenLinkActionSchema = object({
  name: literal("openLink"),
  args: object({
    active: optional(boolean(), true),
  }),
});
type OpenLinkActionArgs = InferOutput<typeof OpenLinkActionSchema>["args"];

const OpenUrlActionSchema = object({
  name: literal("openUrl"),
  args: object({
    url: string(),
  }),
});
type OpenUrlActionArgs = InferOutput<typeof OpenUrlActionSchema>["args"];

const MaximizeWindowActionSchema = object({
  name: literal("maximizeWindow"),
  args: object({
    all: optional(boolean(), false),
  }),
});

export const GestureActionWithoutPiemenuSchema = union([
  OpenLinkActionSchema,
  OpenUrlActionSchema,
  MaximizeWindowActionSchema,
  object({
    name: NoArgsActionNameSchema,
  }),
]);

export type GestureActionWithoutPiemenu = InferOutput<
  typeof GestureActionWithoutPiemenuSchema
>;

const PiemenuMenuSchema = object({
  label: string(),
  action: GestureActionWithoutPiemenuSchema,
});
export type PiemenuMenu = InferOutput<typeof PiemenuMenuSchema>;

const PiemenuActionSchema = object({
  name: literal("piemenu"),
  args: object({
    menus: array(PiemenuMenuSchema),
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

async function openUrlAction({
  getCurrentTab,
  url,
}: ActionContext & OpenUrlActionArgs) {
  const tab = await getCurrentTab();
  await browser.tabs.create({
    url,
    index: tab.index + 1,
  });
}

async function piemenuAction({ menus }: ActionContext & PiemenuActionArgs) {
  return {
    piemenu: menus,
  };
}

export const GestureActionSchema = union([
  GestureActionWithoutPiemenuSchema,
  PiemenuActionSchema,
]);

type GestureAction = InferOutput<typeof GestureActionSchema>;

type ActionName = InferOutput<typeof ActionNameSchema>;

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
  moveTabToNextWindow: moveTabToNextWindowAction,
  doNothing: doNothingAction,
  openLink: openLinkAction,
  openUrl: openUrlAction,
  piemenu: piemenuAction,
} as const satisfies Record<ActionName, unknown> satisfies Record<
  GestureAction["name"],
  unknown
>;

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

  if (gestureAction.name === "openUrl") {
    const action = actions[gestureAction.name];
    await action({ ...context, ...gestureAction.args });
    return;
  }

  if (gestureAction.name === "maximizeWindow") {
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
