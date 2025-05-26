import {
  type InferOutput,
  array,
  object,
  parseJson,
  pipe,
  safeParse,
  string,
  unknown,
} from "valibot";
import { ActionNameSchema } from "./action";
import { type Direction, DirectionSchema, directionEquals } from "./direction";

const GestureActionSchema = object({
  name: ActionNameSchema,
  args: array(unknown()),
});

const GestureSchema = object({
  inputs: array(DirectionSchema),
  action: GestureActionSchema,
});
type Gesture = InferOutput<typeof GestureSchema>;

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
        args: [],
      },
    },
    {
      inputs: ["DOWN", "RIGHT"],
      action: {
        name: "search",
        args: [],
      },
    },
    {
      inputs: ["DOWN", "UP"],
      action: {
        name: "scrollTop",
        args: [],
      },
    },
    {
      inputs: ["UP", "DOWN"],
      action: {
        name: "scrollBottom",
        args: [],
      },
    },
    {
      inputs: ["RIGHT", "LEFT"],
      action: {
        name: "reload",
        args: [],
      },
    },
    {
      inputs: ["RIGHT"],
      action: {
        name: "goForward",
        args: [],
      },
    },
    {
      inputs: ["LEFT"],
      action: {
        name: "goBackward",
        args: [],
      },
    },
    {
      inputs: ["DOWN"],
      action: {
        name: "reload",
        args: [],
      },
    },
    {
      inputs: ["RIGHT", "DOWN"],
      action: {
        name: "bookmark",
        args: [],
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

async function saveSetting(setting: Setting): Promise<void> {
  await settingItem.setValue(setting);
}

export function findGesture(
  setting: Setting,
  directions: Direction[],
): Gesture | undefined {
  return setting.gestures.find((gesture) => {
    return directionEquals(gesture.inputs, directions);
  });
}

export async function importSetting(
  jsonString: string,
): Promise<{ success: boolean; data?: Setting; error?: string }> {
  const parsed = safeParse(
    pipe(string(), parseJson(), SettingSchema),
    jsonString,
  );
  if (!parsed.success) {
    return {
      success: false,
      error: `Invalid setting format: ${parsed.issues[0]?.message}`,
    };
  }

  await saveSetting(parsed.output);

  return {
    success: true,
    data: parsed.output,
  };
}

export async function exportSettingToJson(): Promise<string> {
  const setting = await getSetting();
  return JSON.stringify(setting, null, 2);
}
