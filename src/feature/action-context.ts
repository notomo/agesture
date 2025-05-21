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
 * Interface for the action execution context
 */
export interface ActionContext {
  selectedText: string;
  tab: TabInfo;
  activeElement: ActiveElement;
  selectionExists: boolean;
  gestureDirection: string;
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
 * Create action context object with default values
 */
export function createActionContext(
  partialContext: Partial<ActionContext> = {},
): ActionContext {
  return {
    selectedText: "",
    tab: createTabInfo(),
    activeElement: createActiveElement(),
    selectionExists: false,
    gestureDirection: "",
    ...partialContext,
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
 * Build a complete action context from the current browser state
 */
export async function buildActionContext(
  gestureDirection: string,
): Promise<ActionContext> {
  const selectedText = getSelectedText();
  // const tab = await getCurrentTabInfo();
  const tab = { id: undefined, url: undefined, title: undefined };
  const activeElement = extractActiveElementInfo(document.activeElement);

  return createActionContext({
    selectedText,
    tab,
    activeElement,
    selectionExists: selectedText.length > 0,
    gestureDirection,
  });
}
