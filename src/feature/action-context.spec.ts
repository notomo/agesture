import { describe, expect, it, vi } from "vitest";
import {
  type BackgroundActionContext,
  type ContentActionContext,
  createActionContext,
  createBackgroundActionContext,
  createContentActionContext,
  createTabInfo,
  getSelectedText,
} from "./action-context";

describe("Action Context", () => {
  describe("createContentActionContext", () => {
    it("should create content action context with default values", () => {
      const context = createContentActionContext();

      expect(context).toEqual({
        selectedText: "",
        selectionExists: false,
        gestureDirection: "",
      });
    });

    it("should create content action context with provided values", () => {
      const context = createContentActionContext({
        selectedText: "Selected text",
        selectionExists: true,
        gestureDirection: "LEFTRIGHT",
      });

      expect(context).toEqual({
        selectedText: "Selected text",
        selectionExists: true,
        gestureDirection: "LEFTRIGHT",
      });
    });
  });

  describe("createBackgroundActionContext", () => {
    it("should create background action context with default values", () => {
      const context = createBackgroundActionContext();

      expect(context).toEqual({
        tab: {
          id: undefined,
          url: undefined,
          title: undefined,
        },
      });
    });

    it("should create background action context with provided values", () => {
      const tab = createTabInfo({
        id: 123,
        url: "https://example.com",
        title: "Example Page",
      });

      const context = createBackgroundActionContext({
        tab,
      });

      expect(context).toEqual({
        tab: {
          id: 123,
          url: "https://example.com",
          title: "Example Page",
        },
      });
    });
  });

  describe("createActionContext", () => {
    it("should create action context with default values", () => {
      const context = createActionContext();

      expect(context).toEqual({
        content: {
          selectedText: "",
          selectionExists: false,
          gestureDirection: "",
        },
        background: {
          tab: {
            id: undefined,
            url: undefined,
            title: undefined,
          },
        },
      });
    });

    it("should create action context with provided values", () => {
      const contentContext: Partial<ContentActionContext> = {
        selectedText: "Selected text",
        selectionExists: true,
        gestureDirection: "LEFTRIGHT",
      };

      const backgroundContext: Partial<BackgroundActionContext> = {
        tab: createTabInfo({
          id: 123,
          url: "https://example.com",
          title: "Example Page",
        }),
      };

      const context = createActionContext(contentContext, backgroundContext);

      expect(context).toEqual({
        content: {
          selectedText: "Selected text",
          selectionExists: true,
          gestureDirection: "LEFTRIGHT",
        },
        background: {
          tab: {
            id: 123,
            url: "https://example.com",
            title: "Example Page",
          },
        },
      });
    });
  });

  describe("getSelectedText", () => {
    it("should return empty string when no selection exists", () => {
      // Spy on window.getSelection
      vi.spyOn(window, "getSelection").mockReturnValue(null);

      const result = getSelectedText();

      expect(result).toBe("");
    });

    it("should return selected text when selection exists", () => {
      // Spy on window.getSelection
      vi.spyOn(window, "getSelection").mockReturnValue({
        toString: () => "Selected text",
      } as Selection);

      const result = getSelectedText();

      expect(result).toBe("Selected text");
    });
  });

  // Integration of buildActionContext will be tested separately
  describe("buildContentActionContext", () => {
    it("should create content action context with gesture direction", () => {
      // Mock getSelectedText
      vi.spyOn(window, "getSelection").mockReturnValue({
        toString: () => "Selected text",
      } as Selection);

      // Get the content context
      const context = createContentActionContext({
        selectedText: "Selected text",
        selectionExists: true,
        gestureDirection: "LEFTRIGHT",
      });

      expect(context.selectedText).toBe("Selected text");
      expect(context.selectionExists).toBe(true);
      expect(context.gestureDirection).toBe("LEFTRIGHT");
    });
  });
});
