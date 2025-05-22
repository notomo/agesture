/**
 * Module for defining action context factory functions
 *
 * These factories create objects that will be passed to action functions
 * to provide contextual information for their execution.
 */

export interface TabInfo {
  id: number | undefined;
  url: string | undefined;
  title: string | undefined;
}

export type ContentActionContext = {
  selectedText: string;
  selectionExists: boolean;
  gestureDirection: string;
};

export type BackgroundActionContext = {
  tab: TabInfo;
};

export interface ActionContext {
  content: ContentActionContext;
  background: BackgroundActionContext;
}

export function createTabInfo(partialTab: Partial<TabInfo> = {}): TabInfo {
  return {
    id: undefined,
    url: undefined,
    title: undefined,
    ...partialTab,
  };
}

export function createContentActionContext(
  partialContext: Partial<ContentActionContext> = {},
): ContentActionContext {
  return {
    selectedText: "",
    selectionExists: false,
    gestureDirection: "",
    ...partialContext,
  };
}

export function createBackgroundActionContext(
  partialContext: Partial<BackgroundActionContext> = {},
): BackgroundActionContext {
  return {
    tab: createTabInfo(),
    ...partialContext,
  };
}

export function createActionContext(
  partialContent: Partial<ContentActionContext> = {},
  partialBackground: Partial<BackgroundActionContext> = {},
): ActionContext {
  return {
    content: createContentActionContext(partialContent),
    background: createBackgroundActionContext(partialBackground),
  };
}

export async function getCurrentTabInfo(): Promise<TabInfo> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs.at(0);

  if (!currentTab) {
    return createTabInfo();
  }

  return createTabInfo({
    id: currentTab.id,
    url: currentTab.url,
    title: currentTab.title,
  });
}

export function getSelectedText(): string {
  return window.getSelection()?.toString() || "";
}

export function buildContentActionContext(
  gestureDirection: string,
): ContentActionContext {
  const selectedText = getSelectedText();
  return createContentActionContext({
    selectedText,
    selectionExists: selectedText.length > 0,
    gestureDirection,
  });
}

export async function buildBackgroundActionContext(): Promise<BackgroundActionContext> {
  const tab = await getCurrentTabInfo();
  return createBackgroundActionContext({
    tab,
  });
}

export async function buildActionContext(
  contentContext: ContentActionContext,
): Promise<ActionContext> {
  const backgroundContext = await buildBackgroundActionContext();

  return {
    content: contentContext,
    background: backgroundContext,
  };
}
