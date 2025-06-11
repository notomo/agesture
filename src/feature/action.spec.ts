import { parse } from "valibot";
import { describe, expect, it } from "vitest";
import { GestureActionSchema } from "./action";

describe("GestureActionSchema", () => {
  it("should parse piemenu action with menu array", () => {
    const piemenuAction = {
      name: "piemenu",
      args: {
        menu: ["bookmark", "reload", "goBack"],
      },
    };

    const result = parse(GestureActionSchema, piemenuAction);

    expect(result).toEqual(piemenuAction);
  });

  it("should parse openLink action", () => {
    const openLinkAction = {
      name: "openLink",
      args: {
        active: true,
      },
    };

    const result = parse(GestureActionSchema, openLinkAction);

    expect(result).toEqual(openLinkAction);
  });

  it("should parse no-args action", () => {
    const bookmarkAction = {
      name: "bookmark",
    };

    const result = parse(GestureActionSchema, bookmarkAction);

    expect(result).toEqual(bookmarkAction);
  });
});
