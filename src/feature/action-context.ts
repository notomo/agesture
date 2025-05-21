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
 * Interface for active element information
 */
export interface ActiveElement {
  href: string | undefined;
  tagName: string | undefined;
  innerText: string | undefined;
  isInput: boolean;
  isEditable: boolean;
  value: string | undefined;
}

/**
 * Interface for content context information
 */
export type ContentActionContext = {
  selectedText: string;
  activeElement: ActiveElement;
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
 * Create active element info object with default values
 */
export function createActiveElement(
  partialElement: Partial<ActiveElement> = {},
): ActiveElement {
  return {
    href: undefined,
    tagName: undefined,
    innerText: undefined,
    isInput: false,
    isEditable: false,
    value: undefined,
    ...partialElement,
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
    activeElement: createActiveElement(),
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
 * Extract active element information from a DOM element
 */
export function extractActiveElementInfo(
  element: Element | null,
): ActiveElement {
  if (!element) {
    return createActiveElement();
  }

  const tagName = element.tagName;

  // Check if element is an input or editable
  const isInput =
    tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
  const isEditable =
    element.hasAttribute("contenteditable") &&
    element.getAttribute("contenteditable") !== "false";

  // Get href if element is an anchor
  const href =
    tagName === "A" ? (element as HTMLAnchorElement).href : undefined;

  // Get value if element is an input
  const value = isInput ? (element as HTMLInputElement).value : undefined;

  return createActiveElement({
    href,
    tagName,
    innerText: element.textContent || undefined,
    isInput,
    isEditable,
    value,
  });
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
  const activeElement = extractActiveElementInfo(document.activeElement);

  return createContentActionContext({
    selectedText,
    activeElement,
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
