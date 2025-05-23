/**
 * Module for defining action context factory functions
 *
 * These factories create objects that will be passed to action functions
 * to provide contextual information for their execution.
 */

async function getCurrentTabInfo() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs.at(0);
  if (!currentTab?.id) {
    throw new Error("current tab is not available");
  }
  return {
    id: currentTab.id,
    url: currentTab.url ?? "",
    title: currentTab.title ?? "Untitle",
  };
}

function getSelectedText(): string {
  return window.getSelection()?.toString() || "";
}

type ContentActionContext = {
  selectedText: string;
};
export function buildContentActionContext(): ContentActionContext {
  return {
    selectedText: getSelectedText(),
  };
}

export function buildActionContext(contentContext: ContentActionContext) {
  return {
    content: contentContext,
    background: {
      getCurrentTabInfo,
    },
  };
}

export type ActionContext = ReturnType<typeof buildActionContext>;
