/**
 * Action definitions
 *
 * Defines actions that are triggered by gestures
 * Each action is implemented as an async function
 */

import {
  any,
  array,
  boolean,
  type InferOutput,
  literal,
  object,
  optional,
  string,
  union,
} from "valibot";
import { type ActionContext, buildActionContext } from "./action-context";

async function getWindowIds(): Promise<number[]> {
  const allWindows = await browser.windows.getAll();
  return allWindows
    .map((window) => window.id)
    .filter((id): id is number => id !== undefined);
}

async function getTabIds({
  excludeWindowId,
}: {
  excludeWindowId: number;
}): Promise<number[]> {
  const allWindows = await browser.windows.getAll({ populate: true });
  return allWindows
    .filter((window) => window.id !== excludeWindowId && window.tabs)
    .flatMap((window) => window.tabs || [])
    .map((tab) => tab.id)
    .filter((id): id is number => id !== undefined);
}

async function executeScript({
  tabId,
  url,
  func,
}: {
  tabId: number;
  url: string;
  func: () => void;
}) {
  if (url.startsWith("chrome://")) {
    return {
      type: "message",
      message: { info: "Cannot access chrome:// tab" },
    } as const;
  }
  await browser.scripting.executeScript({
    target: { tabId },
    func,
  });
}

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
    return {
      type: "message",
      message: { info: "No URL available to remove bookmark" },
    } as const;
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
  try {
    await browser.tabs.goForward(tab.id);
  } catch (e) {
    if (
      e instanceof Error &&
      e.message === "Cannot find a next page in history."
    ) {
      return {
        type: "message",
        message: { info: e.message },
      } as const;
    }
    throw e;
  }
}

async function goBackwardAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  try {
    await browser.tabs.goBack(tab.id);
  } catch (e) {
    if (
      e instanceof Error &&
      e.message === "Cannot find a next page in history."
    ) {
      return {
        type: "message",
        message: { info: e.message },
      } as const;
    }
    throw e;
  }
}

async function reloadAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  await browser.tabs.reload(tab.id);
}

async function scrollTopAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  return await executeScript({
    tabId: tab.id,
    url: tab.url,
    func: () => {
      window.scrollTo(0, 0);
    },
  });
}

async function scrollBottomAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  return await executeScript({
    tabId: tab.id,
    url: tab.url,
    func: () => {
      window.scrollTo(0, document.body.scrollHeight);
    },
  });
}

async function searchAction({ content, getCurrentTab }: ActionContext) {
  const selectedText = content.selectedText.trim();
  if (!selectedText) {
    return {
      type: "message",
      message: { info: "No text selected for search" },
    } as const;
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
      focused: true,
    });
    return;
  }

  const windowIds = await getWindowIds();
  for (const windowId of windowIds) {
    await browser.windows.update(windowId, {
      state: "maximized",
      focused: true,
    });
  }

  const currentTab = await getCurrentTab();
  await browser.windows.update(currentTab.windowId, {
    focused: true,
  });
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
    return {
      type: "message",
      message: { info: "Current window not found in window list" },
    } as const;
  }

  const nextWindowIndex = (currentWindowIndex + 1) % sortedWindows.length;
  const nextWindow = sortedWindows[nextWindowIndex];
  if (nextWindow?.id) {
    await browser.tabs.move(tab.id, {
      windowId: nextWindow.id,
      index: -1, // Move to end of tab list
    });
    await browser.tabs.update(tab.id, {
      active: true,
    });
  }
}

async function fullscreenVideoAction({ getCurrentTab }: ActionContext) {
  const tab = await getCurrentTab();
  return await executeScript({
    tabId: tab.id,
    url: tab.url,
    func: () => {
      document.querySelector("video")?.requestFullscreen();
    },
  });
}

async function reopenLastClosedTabAction(_: ActionContext) {
  const sessions = await browser.sessions.getRecentlyClosed({
    maxResults: 1,
  });

  const sessionId = sessions.at(0)?.tab?.sessionId;
  if (!sessionId) {
    return {
      type: "message",
      message: { info: "No recently closed tabs to reopen" },
    } as const;
  }

  await browser.sessions.restore(sessionId);
}

async function moveTabsToCurrentWindowAction({ getCurrentTab }: ActionContext) {
  const currentTab = await getCurrentTab();
  const tabIds = await getTabIds({ excludeWindowId: currentTab.windowId });

  if (tabIds.length === 0) {
    return {
      type: "message",
      message: { info: "No other tabs" },
    } as const;
  }

  await browser.tabs.move(tabIds, {
    windowId: currentTab.windowId,
    index: -1,
  });
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
  literal("fullscreenVideo"),
  literal("reopenLastClosedTab"),
  literal("moveTabsToCurrentWindow"),
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

const GestureActionWithoutPiemenuSchema = union([
  OpenLinkActionSchema,
  OpenUrlActionSchema,
  MaximizeWindowActionSchema,
  object({
    name: NoArgsActionNameSchema,
  }),
]);

const PiemenuItemActionSchema = union([
  GestureActionWithoutPiemenuSchema,
  object({
    name: literal("piemenu"),
    args: object({
      menus: array(
        object({
          label: string(),
          action: object({
            name: any(),
            args: any(),
          }),
        }),
      ),
    }),
  }),
]);

const PiemenuItemSchema = object({
  label: string(),
  action: union([PiemenuItemActionSchema, array(PiemenuItemActionSchema)]),
});
export type PiemenuItem = InferOutput<typeof PiemenuItemSchema>;

export type ActionResult =
  | {
      type: "message";
      message: {
        info: string;
      } & Record<string, unknown>;
    }
  | {
      type: "piemenu";
      items: PiemenuItem[];
    };

const PiemenuActionSchema = object({
  name: literal("piemenu"),
  args: object({
    menus: array(PiemenuItemSchema),
  }),
});
type PiemenuActionArgs = InferOutput<typeof PiemenuActionSchema>["args"];

async function openLinkAction({
  content,
  getCurrentTab,
  active,
}: ActionContext & OpenLinkActionArgs) {
  if (!content.url) {
    return {
      type: "message",
      message: { info: "No link URL available to open" },
    } as const;
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
    type: "piemenu" as const,
    items: menus,
  };
}

export const GestureActionSchema = union([
  GestureActionWithoutPiemenuSchema,
  PiemenuActionSchema,
]);

export type GestureAction = InferOutput<typeof GestureActionSchema>;

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
  fullscreenVideo: fullscreenVideoAction,
  reopenLastClosedTab: reopenLastClosedTabAction,
  moveTabsToCurrentWindow: moveTabsToCurrentWindowAction,
  doNothing: doNothingAction,
  openLink: openLinkAction,
  openUrl: openUrlAction,
  piemenu: piemenuAction,
} as const satisfies Record<ActionName, unknown> satisfies Record<
  GestureAction["name"],
  unknown
>;

function buildResult({
  actionName,
  result,
}: {
  actionName: string;
  result?: ActionResult;
}) {
  if (result?.type === "message") {
    return {
      type: result.type,
      message: {
        ...result.message,
        actionName,
      },
    };
  }
  return result;
}

async function callAction({
  gestureAction,
  contentContext,
}: {
  gestureAction: GestureAction;
  contentContext: ActionContext["content"];
}) {
  const context = buildActionContext(contentContext);
  const actionName = gestureAction.name;

  if (actionName === "openLink") {
    const action = actions[actionName];
    const result = await action({ ...context, ...gestureAction.args });
    return buildResult({ actionName, result: result ?? undefined });
  }

  if (actionName === "openUrl") {
    const action = actions[actionName];
    const result = await action({ ...context, ...gestureAction.args });
    return buildResult({ actionName, result: result ?? undefined });
  }

  if (actionName === "maximizeWindow") {
    const action = actions[actionName];
    const result = await action({ ...context, ...gestureAction.args });
    return buildResult({ actionName, result: result ?? undefined });
  }

  if (actionName === "piemenu") {
    const action = actions[actionName];
    const result = await action({ ...context, ...gestureAction.args });
    return buildResult({ actionName, result });
  }

  const action = actions[actionName];
  const result = await action(context);
  return buildResult({ actionName, result: result ?? undefined });
}

export async function callActions({
  actions,
  contentContext,
}: {
  actions: GestureAction | GestureAction[];
  contentContext: ActionContext["content"];
}): Promise<ActionResult | null> {
  const allActions = Array.isArray(actions) ? actions : [actions];

  for (const action of allActions) {
    const result = await callAction({
      gestureAction: action,
      contentContext,
    });
    if (result) {
      return result;
    }
  }

  return null;
}
