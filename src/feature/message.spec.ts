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
      notice: "No matching gesture found for directions: ",
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
});
