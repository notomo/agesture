import { describe, expect, it } from "vitest";
import { parseMessage, parsePiemenuActionMessage } from "./message";

describe("parseMessage", () => {
  it("should parse valid gesture message", () => {
    const validMessage = {
      type: "gesture",
      directions: ["UP", "DOWN"],
      context: {
        selectedText: "sample text",
      },
    };

    const result = parseMessage(validMessage);

    expect(result).toEqual(validMessage);
  });
});

describe("parsePiemenuActionMessage", () => {
  it("should parse valid piemenu action message", () => {
    const validMessage = {
      type: "piemenuAction",
      actionName: "bookmark",
      context: {
        selectedText: "sample text",
      },
    };

    const result = parsePiemenuActionMessage(validMessage);

    expect(result).toEqual(validMessage);
  });
});
