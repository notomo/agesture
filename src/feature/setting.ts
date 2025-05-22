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
import { type Direction, DirectionSchema, directionEquals } from "./direction";

export const GestureActionSchema = object({
  name: string(),
  args: array(unknown()),
});

export type GestureAction = InferOutput<typeof GestureActionSchema>;

export const GestureSchema = object({
  inputs: array(DirectionSchema),
  action: GestureActionSchema,
});

export type Gesture = InferOutput<typeof GestureSchema>;

export const SettingsSchema = object({
  gestures: array(GestureSchema),
});

export type Settings = InferOutput<typeof SettingsSchema>;

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

const STORAGE_KEY = "gestureSettings";

export async function getSettings(): Promise<Settings> {
  const result = await browser.storage.sync.get(STORAGE_KEY);
  const rawSettings = result[STORAGE_KEY] || DEFAULT_SETTINGS;

  const parseResult = safeParse(SettingsSchema, rawSettings);

  if (parseResult.success) {
    return parseResult.output;
  }
  console.error("Invalid settings format in storage:", parseResult.issues);

  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ [STORAGE_KEY]: settings });
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
  const parseResult = safeParse(
    pipe(string(), parseJson(), SettingsSchema),
    jsonString,
  );

  if (parseResult.success) {
    await saveSettings(parseResult.output);
    return { success: true, data: parseResult.output };
  }

  return {
    success: false,
    error: `Invalid settings format: ${parseResult.issues[0]?.message}`,
  };
}

export async function exportSettingsToJson(): Promise<string> {
  const settings = await getSettings();
  return JSON.stringify(settings, null, 2);
}
