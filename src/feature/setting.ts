import {
  type InferOutput,
  array,
  object,
  parseJson,
  pipe,
  safeParse,
  string,
} from "valibot";
import { GestureActionSchema } from "./action";
import { DirectionSchema } from "./direction";

const GestureSchema = object({
  inputs: array(DirectionSchema),
  action: GestureActionSchema,
});

const SettingSchema = object({
  gestures: array(GestureSchema),
});
type Setting = InferOutput<typeof SettingSchema>;

export const DEFAULT_SETTING: Setting = {
  gestures: [
    {
      inputs: ["UP"],
      action: {
        name: "openLink",
        args: {
          active: true,
        },
      },
    },
    {
      inputs: ["DOWN"],
      action: {
        name: "openLink",
        args: {
          active: false,
        },
      },
    },
    {
      inputs: ["DOWN", "RIGHT"],
      action: {
        name: "search",
      },
    },
    {
      inputs: ["DOWN", "UP"],
      action: {
        name: "scrollTop",
      },
    },
    {
      inputs: ["UP", "DOWN"],
      action: {
        name: "scrollBottom",
      },
    },
    {
      inputs: ["RIGHT", "LEFT"],
      action: {
        name: "reload",
      },
    },
    {
      inputs: ["RIGHT"],
      action: {
        name: "goForward",
      },
    },
    {
      inputs: ["LEFT"],
      action: {
        name: "goBackward",
      },
    },
    {
      inputs: ["UP", "RIGHT"],
      action: {
        name: "bookmark",
      },
    },
    {
      inputs: ["DOWN", "LEFT", "DOWN", "LEFT"],
      action: {
        name: "closeOtherTabs",
      },
    },
  ],
};

const settingItem = storage.defineItem<Setting>("local:gestureSetting", {
  defaultValue: DEFAULT_SETTING,
});

export async function getSetting(): Promise<Setting> {
  return await settingItem.getValue();
}

export async function importSetting(jsonString: string) {
  const parsed = safeParse(
    pipe(string(), parseJson(), SettingSchema),
    jsonString,
  );
  if (!parsed.success) {
    const detail = parsed.issues
      .flatMap((x) => [x, ...(x.issues ?? [])])
      .map((x) => x.message)
      .join("\n");
    return {
      error: `Invalid setting format: ${detail}`,
    };
  }

  await settingItem.setValue(parsed.output);

  return {};
}
