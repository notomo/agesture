/**
 * Module for defining action context factory functions
 *
 * These factories create objects that will be passed to action functions
 * to provide contextual information for their execution.
 */

import { type InferOutput, object, optional, string } from "valibot";

async function getCurrentTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs.at(0);
  if (!currentTab?.id) {
    throw new Error("current tab is not available");
  }
  return {
    id: currentTab.id,
    index: currentTab.index,
    url: currentTab.url ?? "",
    title: currentTab.title ?? "Untitle",
  };
}

function getSelectedText(): string {
  return window.getSelection()?.toString() || "";
}

function findLinkUrl(point: { x: number; y: number }): string | undefined {
  const element = document.elementFromPoint(point.x, point.y);
  return element?.closest("a")?.href;
}

export const ContentActionContextSchema = object({
  selectedText: string(),
  url: optional(string()),
});

type ContentActionContext = InferOutput<typeof ContentActionContextSchema>;

export function buildContentActionContext(point: {
  x: number;
  y: number;
}): ContentActionContext {
  return {
    selectedText: getSelectedText(),
    url: findLinkUrl(point),
  };
}

export function buildActionContext(contentContext: ContentActionContext) {
  return {
    content: contentContext,
    getCurrentTab,
  };
}

export type ActionContext = ReturnType<typeof buildActionContext>;
