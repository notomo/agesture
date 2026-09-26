import { parse } from "valibot";
import { describe, expect, it } from "vitest";
import { GestureActionSchema } from "./action";

describe("openBookmarkManager action", () => {
  it("opens this extension's manager at bookmarks bar by default", () => {
    expect(parse(GestureActionSchema, { name: "openBookmarkManager" })).toEqual(
      {
        name: "openBookmarkManager",
        args: { path: "bookmarks-bar", manager: "agesture" },
      },
    );
  });

  it("accepts chrome manager", () => {
    expect(
      parse(GestureActionSchema, {
        name: "openBookmarkManager",
        args: { path: "other", manager: "chrome" },
      }),
    ).toEqual({
      name: "openBookmarkManager",
      args: { path: "other", manager: "chrome" },
    });
  });
});
