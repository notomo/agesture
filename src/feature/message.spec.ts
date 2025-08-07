import { describe, expect, it } from "vitest";
import { handleMessage } from "./message";
import { settingItem } from "./setting";

const defaultContext = {
  selectedText: "",
  url: undefined,
};

describe("gesture message handling", () => {
  it("responses message", async () => {
    const got = await handleMessage({
      type: "gesture",
      directions: [],
      context: defaultContext,
    });
    expect(got).toEqual({
      type: "message",
      message: {
        info: "No matching gesture found",
        directions: [],
      },
    });
  });

  it("responses piemenu items", async () => {
    settingItem.setValue({
      gestures: [
        {
          inputs: ["LEFT", "RIGHT"],
          action: {
            name: "piemenu",
            args: {
              menus: [
                {
                  label: "Extensions",
                  action: {
                    name: "openUrl",
                    args: { url: "chrome://extensions/" },
                  },
                },
              ],
            },
          },
        },
      ],
    });

    const got = await handleMessage({
      type: "gesture",
      directions: ["LEFT", "RIGHT"],
      context: defaultContext,
    });

    expect(got).toEqual({
      type: "piemenu",
      items: [
        {
          label: "Extensions",
          action: {
            name: "openUrl",
            args: { url: "chrome://extensions/" },
          },
        },
      ],
    });
  });

  it("responses none", async () => {
    settingItem.setValue({
      gestures: [
        {
          inputs: ["LEFT", "RIGHT"],
          action: {
            name: "doNothing",
          },
        },
      ],
    });

    const got = await handleMessage({
      type: "gesture",
      directions: ["LEFT", "RIGHT"],
      context: defaultContext,
    });

    expect(got).toEqual({
      type: "none",
    });
  });

  it("responses message for early return cases", async () => {
    settingItem.setValue({
      gestures: [
        {
          inputs: ["LEFT", "RIGHT"],
          action: {
            name: "search",
          },
        },
      ],
    });

    const got = await handleMessage({
      type: "gesture",
      directions: ["LEFT", "RIGHT"],
      context: { selectedText: "", url: undefined },
    });

    expect(got).toEqual({
      type: "message",
      message: {
        info: "No text selected for search",
        actionName: "search",
      },
    });
  });
});

describe("piemenu action message handling", () => {
  it("responses piemenu items", async () => {
    const got = await handleMessage({
      type: "piemenuAction",
      action: {
        name: "piemenu",
        args: {
          menus: [
            {
              label: "Extensions",
              action: {
                name: "openUrl",
                args: { url: "chrome://extensions/" },
              },
            },
          ],
        },
      },
      context: defaultContext,
    });

    expect(got).toEqual({
      type: "piemenu",
      items: [
        {
          label: "Extensions",
          action: {
            name: "openUrl",
            args: { url: "chrome://extensions/" },
          },
        },
      ],
    });
  });

  it("responses none", async () => {
    const got = await handleMessage({
      type: "piemenuAction",
      action: {
        name: "doNothing",
      },
      context: defaultContext,
    });

    expect(got).toEqual({
      type: "none",
    });
  });

  it("responses message for early return cases", async () => {
    const got = await handleMessage({
      type: "piemenuAction",
      action: {
        name: "openLink",
        args: { active: true },
      },
      context: { selectedText: "", url: undefined },
    });

    expect(got).toEqual({
      type: "message",
      message: {
        info: "No link URL available to open",
        actionName: "openLink",
      },
    });
  });
});
