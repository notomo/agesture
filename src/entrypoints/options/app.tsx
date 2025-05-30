import {
  DEFAULT_SETTING,
  getSetting,
  importSetting,
} from "@/src/feature/setting";
import { cn } from "@/src/lib/tailwind";
import { useEffect, useState } from "react";

export function App() {
  const [settingJson, setSettingJson] = useSetting();
  const [saveResult, setSaveResult] = useState({
    isError: false,
    message: "",
  });

  const handleSave = async () => {
    const result = await importSetting(settingJson);
    setSaveResult({
      isError: !!result.error,
      message: result.error ?? "Setting saved successfully",
    });
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

      {saveResult.message && (
        <div
          className={cn(
            "p-2 mb-4 rounded whitespace-pre-wrap",
            saveResult.isError
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700",
          )}
        >
          {saveResult.message}
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

const useSetting = () => {
  const [settingJson, setSettingJson] = useState("");

  useEffect(() => {
    async function loadSetting() {
      const setting = await getSetting();
      setSettingJson(JSON.stringify(setting, null, 2));
    }
    loadSetting();
  }, []);

  return [settingJson, setSettingJson] as const;
};
