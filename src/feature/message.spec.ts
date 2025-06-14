import { describe, expect, it } from "vitest";
import { parseGestureMessage, parsePiemenuActionMessage } from "./message";

describe("parseGestureMessage", () => {
  it("should parse valid gesture message", () => {
    const validMessage = {
      type: "gesture",
      directions: ["UP", "DOWN"],
      context: {
        selectedText: "sample text",
      },
    };

    const result = parseGestureMessage(validMessage);

    expect(result).toEqual(validMessage);
  });
});

describe("parsePiemenuActionMessage", () => {
  it("should parse valid piemenu action message", () => {
    const validMessage = {
      type: "piemenuAction",
      action: {
        name: "bookmark",
      },
      context: {
        selectedText: "sample text",
      },
    };

    const result = parsePiemenuActionMessage(validMessage);

    expect(result).toEqual(validMessage);
  });
});
