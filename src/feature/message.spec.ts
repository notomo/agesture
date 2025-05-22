/**
 * Tests for message parsing utilities and schemas
 */

import { ValiError } from "valibot";
import { describe, expect, it } from "vitest";
import { parseMessage } from "./message";

describe("parseMessage", () => {
  it("should parse valid gesture message", () => {
    const validMessage = {
      type: "gesture",
      directions: ["UP", "DOWN"],
      context: {
        selectedText: "sample text",
        selectionExists: true,
        gestureDirection: "up",
      },
    };

    const result = parseMessage(validMessage);

    expect(result).toEqual(validMessage);
  });

  it("should throw error for invalid message type", () => {
    const invalidMessage = {
      type: "invalid",
      directions: ["UP", "DOWN"],
      context: {
        selectedText: "sample text",
        selectionExists: true,
        gestureDirection: "up",
      },
    };

    expect(() => parseMessage(invalidMessage)).toThrow(ValiError);
  });

  it("should throw error for missing directions", () => {
    const invalidMessage = {
      type: "gesture",
      context: {
        selectedText: "sample text",
        selectionExists: true,
        gestureDirection: "up",
      },
    };

    expect(() => parseMessage(invalidMessage)).toThrow(ValiError);
  });

  it("should throw error for invalid context", () => {
    const invalidMessage = {
      type: "gesture",
      directions: ["UP", "DOWN"],
      context: {
        selectedText: "sample text",
        // missing selectionExists
        gestureDirection: "up",
      },
    };

    expect(() => parseMessage(invalidMessage)).toThrow(ValiError);
  });

  it("should throw error for null or undefined input", () => {
    expect(() => parseMessage(null)).toThrow(ValiError);
    expect(() => parseMessage(undefined)).toThrow(ValiError);
  });
});
