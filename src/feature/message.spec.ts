import { describe, expect, it } from "vitest";
import { parseMessage } from "./message";

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
