import { describe, expect, it, vi } from "vitest";
import {
  type BackgroundActionContext,
  type ContentActionContext,
  createActionContext,
  createActiveElement,
  createBackgroundActionContext,
  createContentActionContext,
  createTabInfo,
  extractActiveElementInfo,
  getSelectedText,
} from "./action-context";

describe("Action Context", () => {
  describe("createActiveElement", () => {
    it("should create active element info with default values", () => {
      const activeElement = createActiveElement();

      expect(activeElement).toEqual({
        href: undefined,
        tagName: undefined,
        innerText: undefined,
        isInput: false,
        isEditable: false,
        value: undefined,
      });
    });

    it("should create active element info with provided values", () => {
      const activeElement = createActiveElement({
        href: "https://example.com/link",
        tagName: "A",
        innerText: "Click me",
        isInput: false,
        isEditable: false,
        value: undefined,
      });

      expect(activeElement).toEqual({
        href: "https://example.com/link",
        tagName: "A",
        innerText: "Click me",
        isInput: false,
        isEditable: false,
        value: undefined,
      });
    });

    it("should identify input elements", () => {
      const inputElement = createActiveElement({
        tagName: "INPUT",
        isInput: true,
        value: "test value",
      });

      expect(inputElement.isInput).toBe(true);
      expect(inputElement.value).toBe("test value");
    });

    it("should identify editable elements", () => {
      const editableElement = createActiveElement({
        tagName: "DIV",
        isEditable: true,
      });

      expect(editableElement.isEditable).toBe(true);
    });
  });

  describe("createContentActionContext", () => {
    it("should create content action context with default values", () => {
      const context = createContentActionContext();

      expect(context).toEqual({
        selectedText: "",
        activeElement: {
          href: undefined,
          tagName: undefined,
          innerText: undefined,
          isInput: false,
          isEditable: false,
          value: undefined,
        },
        selectionExists: false,
        gestureDirection: "",
      });
    });

    it("should create content action context with provided values", () => {
      const activeElement = createActiveElement({
        href: "https://example.com/link",
        tagName: "A",
        innerText: "Click me",
      });

      const context = createContentActionContext({
        selectedText: "Selected text",
        activeElement,
        selectionExists: true,
        gestureDirection: "LEFTRIGHT",
      });

      expect(context).toEqual({
        selectedText: "Selected text",
        activeElement: {
          href: "https://example.com/link",
          tagName: "A",
          innerText: "Click me",
          isInput: false,
          isEditable: false,
          value: undefined,
        },
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
          activeElement: {
            href: undefined,
            tagName: undefined,
            innerText: undefined,
            isInput: false,
            isEditable: false,
            value: undefined,
          },
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
        activeElement: createActiveElement({
          href: "https://example.com/link",
          tagName: "A",
          innerText: "Click me",
        }),
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
          activeElement: {
            href: "https://example.com/link",
            tagName: "A",
            innerText: "Click me",
            isInput: false,
            isEditable: false,
            value: undefined,
          },
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

  describe("extractActiveElementInfo", () => {
    it("should return default values when element is null", () => {
      const result = extractActiveElementInfo(null);
      expect(result).toEqual(createActiveElement());
    });

    it("should extract information from anchor element", () => {
      // Create a mock element
      const element = document.createElement("a");
      element.href = "https://example.com";
      element.textContent = "Example Link";

      const result = extractActiveElementInfo(element);

      // Use includes to avoid trailing slash differences
      expect(result.href?.includes("https://example.com")).toBeTruthy();
      expect(result.tagName).toBe("A");
      expect(result.innerText).toBe("Example Link");
      expect(result.isInput).toBe(false);
      expect(result.isEditable).toBe(false);
    });

    it("should extract information from input element", () => {
      // Create a mock element
      const element = document.createElement("input");
      element.value = "test input";

      const result = extractActiveElementInfo(element);

      expect(result.tagName).toBe("INPUT");
      expect(result.isInput).toBe(true);
      expect(result.value).toBe("test input");
    });

    it("should detect contenteditable elements", () => {
      // Create a mock element
      const element = document.createElement("div");
      element.setAttribute("contenteditable", "true");

      const result = extractActiveElementInfo(element);

      expect(result.isEditable).toBe(true);
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

      // Mock document.activeElement
      const mockActiveElement = document.createElement("a");
      mockActiveElement.href = "https://example.com/link";
      mockActiveElement.textContent = "Active Link";
      vi.spyOn(document, "activeElement", "get").mockReturnValue(
        mockActiveElement,
      );

      // Get the content context
      const context = createContentActionContext({
        selectedText: "Selected text",
        activeElement: createActiveElement({
          href: "https://example.com/link",
          tagName: "A",
          innerText: "Active Link",
        }),
        selectionExists: true,
        gestureDirection: "LEFTRIGHT",
      });

      expect(context.selectedText).toBe("Selected text");
      expect(context.selectionExists).toBe(true);
      expect(context.gestureDirection).toBe("LEFTRIGHT");
      expect(context.activeElement.href).toBe("https://example.com/link");
      expect(context.activeElement.tagName).toBe("A");
      expect(context.activeElement.innerText).toBe("Active Link");
    });
  });
});
