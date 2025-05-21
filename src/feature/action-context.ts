/**
 * Module for defining action context factory functions
 *
 * These factories create objects that will be passed to action functions
 * to provide contextual information for their execution.
 */

/**
 * Interface for tab information
 */
export interface TabInfo {
  id: number | undefined;
  url: string | undefined;
  title: string | undefined;
}

/**
 * Interface for content context information
 */
export type ContentActionContext = {
  selectedText: string;
  selectionExists: boolean;
  gestureDirection: string;
};

/**
 * Interface for background context information
 */
export type BackgroundActionContext = {
  tab: TabInfo;
};

/**
 * Interface for the action execution context
 */
export interface ActionContext {
  content: ContentActionContext;
  background: BackgroundActionContext;
}

/**
 * Create tab info object with default values
 */
export function createTabInfo(partialTab: Partial<TabInfo> = {}): TabInfo {
  return {
    id: undefined,
    url: undefined,
    title: undefined,
    ...partialTab,
  };
}

/**
 * Create content action context with default values
 */
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

/**
 * Create background action context with default values
 */
export function createBackgroundActionContext(
  partialContext: Partial<BackgroundActionContext> = {},
): BackgroundActionContext {
  return {
    tab: createTabInfo(),
    ...partialContext,
  };
}

/**
 * Create action context object with default values
 */
export function createActionContext(
  partialContent: Partial<ContentActionContext> = {},
  partialBackground: Partial<BackgroundActionContext> = {},
): ActionContext {
  return {
    content: createContentActionContext(partialContent),
    background: createBackgroundActionContext(partialBackground),
  };
}

/**
 * Extract tab information from browser tabs API
 */
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

/**
 * Get the currently selected text in the document
 */
export function getSelectedText(): string {
  return window.getSelection()?.toString() || "";
}

/**
 * Build a content action context from the current document state
 */
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

/**
 * Build a background action context
 */
export async function buildBackgroundActionContext(): Promise<BackgroundActionContext> {
  const tab = await getCurrentTabInfo();

  return createBackgroundActionContext({
    tab,
  });
}

/**
 * Build a complete action context from the content context
 * Note: This should be used in the background script as tab info
 * can only be accessed from the background.
 */
export async function buildActionContext(
  contentContext: ContentActionContext,
): Promise<ActionContext> {
  const backgroundContext = await buildBackgroundActionContext();

  return {
    content: contentContext,
    background: backgroundContext,
  };
}
