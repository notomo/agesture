import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  DEFAULT_SETTING,
  exportSettingToJson,
  importSetting,
} from "../../feature/setting";
import { cn } from "../../lib/tailwind";

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
  const [settingJson, setSettingJson] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function loadSetting() {
      const loadedSettingJson = await exportSettingToJson();
      setSettingJson(loadedSettingJson);
    }

    loadSetting();
  }, []);

  const handleSave = async () => {
    const result = await importSetting(settingJson);

    if (result.success) {
      setIsError(false);
      setStatusMessage("Setting saved successfully");
    } else {
      setIsError(true);
      setStatusMessage(`Error: ${result.error}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gesture Setting</h1>

      <div className="mb-4">
        <label htmlFor="setting-json" className="block font-medium mb-2">
          Setting JSON
        </label>
        <textarea
          id="setting-json"
          className="w-full h-64 p-2 border rounded font-mono"
          value={settingJson}
          onChange={(e) => setSettingJson(e.target.value)}
          placeholder={JSON.stringify(DEFAULT_SETTING)}
        />
      </div>

      {statusMessage && (
        <div
          className={cn(
            "p-2 mb-4 rounded",
            isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700",
          )}
        >
          {statusMessage}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-2">Example</h2>
        <pre className="font-mono text-sm">
          {JSON.stringify(DEFAULT_SETTING, null, 2)}
        </pre>
      </div>
    </div>
  );
}
