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

const SettingsSchema = object({
  gestures: array(GestureSchema),
});
type Settings = InferOutput<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  gestures: [
    {
      inputs: ["RIGHT", "DOWN"],
      action: {
        name: "bookmark",
        args: [],
      },
    },
  ],
};

const settingItem = storage.defineItem<Settings>("local:gestureSettings", {
  defaultValue: DEFAULT_SETTINGS,
});

export async function getSettings(): Promise<Settings> {
  return await settingItem.getValue();
}

async function saveSettings(settings: Settings): Promise<void> {
  await settingItem.setValue(settings);
}

export function findGestureByDirections(
  settings: Settings,
  directions: Direction[],
): Gesture | undefined {
  return settings.gestures.find((gesture) => {
    return directionEquals(gesture.inputs, directions);
  });
}

export async function importSettingsFromJson(
  jsonString: string,
): Promise<{ success: boolean; data?: Settings; error?: string }> {
  const parsed = safeParse(
    pipe(string(), parseJson(), SettingsSchema),
    jsonString,
  );

  if (parsed.success) {
    await saveSettings(parsed.output);
    return { success: true, data: parsed.output };
  }

  return {
    success: false,
    error: `Invalid settings format: ${parsed.issues[0]?.message}`,
  };
}

export async function exportSettingsToJson(): Promise<string> {
  const settings = await getSettings();
  return JSON.stringify(settings, null, 2);
}
