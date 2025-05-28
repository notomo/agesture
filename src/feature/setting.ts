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
import { type Direction, DirectionSchema, directionEquals } from "./direction";

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
  ],
};

const settingItem = storage.defineItem<Setting>("local:gestureSetting", {
  defaultValue: DEFAULT_SETTING,
});

export async function getSetting(): Promise<Setting> {
  return await settingItem.getValue();
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

  await settingItem.setValue(parsed.output);

  return {
    success: true,
    data: parsed.output,
  };
}
