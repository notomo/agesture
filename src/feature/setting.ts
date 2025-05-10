/**
 * Module for managing gesture settings
 */
import type { Direction } from "./direction";

/**
 * Interface for gesture action
 */
export interface GestureAction {
  name: string;
  args: unknown[];
}

/**
 * Interface for gesture configuration
 */
export interface Gesture {
  inputs: Direction[];
  action: GestureAction;
}

/**
 * Interface for settings
 */
export interface Settings {
  gestures: Gesture[];
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: Settings = {
  gestures: [],
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
  return (result[STORAGE_KEY] as Settings | undefined) || DEFAULT_SETTINGS;
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
  const directionString = directions.join("");

  return settings.gestures.find((gesture) => {
    const gestureDirectionString = gesture.inputs.join("");
    return gestureDirectionString === directionString;
  });
}

/**
 * Add a new gesture or update an existing one
 */
export async function addOrUpdateGesture(gesture: Gesture): Promise<Settings> {
  const settings = await getSettings();

  // Find existing gesture with same inputs
  const existingIndex = settings.gestures.findIndex(
    (g) => g.inputs.join("") === gesture.inputs.join(""),
  );

  if (existingIndex >= 0) {
    // Update existing gesture
    settings.gestures[existingIndex] = gesture;
  } else {
    // Add new gesture
    settings.gestures.push(gesture);
  }

  await saveSettings(settings);
  return settings;
}

/**
 * Remove a gesture
 */
export async function removeGesture(inputs: Direction[]): Promise<Settings> {
  const settings = await getSettings();

  const inputsString = inputs.join("");

  // Filter out the gesture with matching inputs
  settings.gestures = settings.gestures.filter(
    (g) => g.inputs.join("") !== inputsString,
  );

  await saveSettings(settings);
  return settings;
}

/**
 * Clear all gestures
 */
export async function clearAllGestures(): Promise<Settings> {
  const settings = await getSettings();
  settings.gestures = [];

  await saveSettings(settings);
  return settings;
}

/**
 * Import settings from JSON string
 */
export async function importSettingsFromJson(
  jsonString: string,
): Promise<Settings> {
  const parsed = JSON.parse(jsonString);

  // Validate the parsed object has the expected structure
  if (!parsed || !Array.isArray(parsed.gestures)) {
    throw new Error("Invalid settings format");
  }

  // Validate each gesture has the correct structure
  for (const gesture of parsed.gestures) {
    if (
      !gesture ||
      typeof gesture !== "object" ||
      !Array.isArray((gesture as Gesture).inputs) ||
      !(gesture as Gesture).action ||
      typeof (gesture as Gesture).action !== "object" ||
      typeof (gesture as Gesture).action.name !== "string" ||
      !Array.isArray((gesture as Gesture).action.args)
    ) {
      throw new Error("Invalid gesture format");
    }
  }

  await saveSettings(parsed);
  return parsed;
}

/**
 * Export settings to JSON string
 */
export async function exportSettingsToJson(): Promise<string> {
  const settings = await getSettings();
  return JSON.stringify(settings, null, 2);
}
