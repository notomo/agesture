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
/**
 * Module for managing gesture settings
 */
import { type Direction, DirectionSchema, directionEquals } from "./direction";

/**
 * Schema for gesture action
 */
export const GestureActionSchema = object({
  name: string(),
  args: array(unknown()),
});

/**
 * Type for gesture action
 */
export type GestureAction = InferOutput<typeof GestureActionSchema>;

/**
 * Schema for gesture configuration
 */
export const GestureSchema = object({
  inputs: array(DirectionSchema),
  action: GestureActionSchema,
});

/**
 * Type for gesture configuration
 */
export type Gesture = InferOutput<typeof GestureSchema>;

/**
 * Schema for settings
 */
export const SettingsSchema = object({
  gestures: array(GestureSchema),
});

/**
 * Type for settings
 */
export type Settings = InferOutput<typeof SettingsSchema>;

/**
 * Default settings
 */
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

/**
 * Storage key for settings
 */
const STORAGE_KEY = "gestureSettings";

/**
 * Get current settings from storage
 */
export async function getSettings(): Promise<Settings> {
  const result = await browser.storage.sync.get(STORAGE_KEY);
  const rawSettings = result[STORAGE_KEY] || DEFAULT_SETTINGS;

  // Parse and validate the settings using the defined schema with safeParse
  const parseResult = safeParse(SettingsSchema, rawSettings);

  if (parseResult.success) {
    return parseResult.output;
  }
  console.error("Invalid settings format in storage:", parseResult.issues);
  // Return default settings if stored settings are invalid
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to storage
 */
export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ [STORAGE_KEY]: settings });
}

/**
 * Find gesture by direction sequence
 */
export function findGestureByDirections(
  settings: Settings,
  directions: Direction[],
): Gesture | undefined {
  return settings.gestures.find((gesture) => {
    return directionEquals(gesture.inputs, directions);
  });
}

/**
 * Import settings from JSON string
 * @returns An object with success flag and either settings or error message
 */
export async function importSettingsFromJson(
  jsonString: string,
): Promise<{ success: boolean; data?: Settings; error?: string }> {
  const parseResult = safeParse(
    pipe(string(), parseJson(), SettingsSchema),
    jsonString,
  );

  if (parseResult.success) {
    // Save the validated settings
    await saveSettings(parseResult.output);
    return { success: true, data: parseResult.output };
  }
  // Schema validation error
  return {
    success: false,
    error: `Invalid settings format: ${parseResult.issues[0]?.message}`,
  };
}

/**
 * Export settings to JSON string
 */
export async function exportSettingsToJson(): Promise<string> {
  const settings = await getSettings();
  return JSON.stringify(settings, null, 2);
}
