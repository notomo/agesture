import { parse } from "valibot";
import { describe, expect, it } from "vitest";
import { GestureActionSchema } from "./action";

describe("GestureActionSchema", () => {
  it("should parse piemenu action with menus array", () => {
    const piemenuAction = {
      name: "piemenu",
      args: {
        menus: [
          { label: "Bookmark", action: { name: "bookmark" } },
          { label: "Reload", action: { name: "reload" } },
          { label: "Go Back", action: { name: "goBackward" } },
        ],
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

  it("should parse openUrl action", () => {
    const openUrlAction = {
      name: "openUrl",
      args: {
        url: "https://example.com",
      },
    };

    const result = parse(GestureActionSchema, openUrlAction);

    expect(result).toEqual(openUrlAction);
  });

  it("should parse maximizeWindow action", () => {
    const maximizeWindowAction = {
      name: "maximizeWindow",
      args: {
        all: true,
      },
    };

    const result = parse(GestureActionSchema, maximizeWindowAction);

    expect(result).toEqual(maximizeWindowAction);
  });

  it("should parse maximizeWindow action without all arg", () => {
    const maximizeWindowAction = {
      name: "maximizeWindow",
      args: {},
    };

    const result = parse(GestureActionSchema, maximizeWindowAction);

    expect(result).toEqual({
      name: "maximizeWindow",
      args: {
        all: false,
      },
    });
  });

  it("should parse no-args action", () => {
    const bookmarkAction = {
      name: "bookmark",
    };

    const result = parse(GestureActionSchema, bookmarkAction);

    expect(result).toEqual(bookmarkAction);
  });
});
