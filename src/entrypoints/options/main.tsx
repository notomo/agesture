import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DEFAULT_SETTINGS,
  exportSettingsToJson,
  importSettingsFromJson,
} from "../../../src/feature/setting";

const container = document.getElementById("app");
if (!container) {
  throw new Error("bug: not found app element");
}
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

function App() {
  const [settingsJson, setSettingsJson] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Load current settings when component mounts
    async function loadSettings() {
      const loadedSettingsJson = await exportSettingsToJson();
      setSettingsJson(loadedSettingsJson);
    }

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    const result = await importSettingsFromJson(settingsJson);

    if (result.success) {
      setIsError(false);
      setStatusMessage("Settings saved successfully");
    } else {
      setIsError(true);
      setStatusMessage(`Error: ${result.error}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gesture Settings</h1>

      <div className="mb-4">
        <label htmlFor="settings-json" className="block font-medium mb-2">
          Settings JSON
        </label>
        <textarea
          id="settings-json"
          className="w-full h-64 p-2 border rounded font-mono"
          value={settingsJson}
          onChange={(e) => setSettingsJson(e.target.value)}
          placeholder={JSON.stringify(DEFAULT_SETTINGS)}
        />
      </div>

      {statusMessage && (
        <div
          className={`p-2 mb-4 rounded ${
            isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Settings
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-2">Example Settings</h2>
        <pre className="font-mono text-sm">
          {JSON.stringify(DEFAULT_SETTINGS, null, 2)}
        </pre>
      </div>
    </div>
  );
}
