import { useEffect, useId, useState } from "react";
import {
  DEFAULT_SETTING,
  getSetting,
  importSetting,
} from "@/src/feature/setting";
import { cn } from "@/src/lib/tailwind";

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

  const id = useId();

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 font-bold text-2xl">Gesture Setting</h1>

      <div className="mb-4">
        <label htmlFor="setting-json" className="mb-2 block font-medium">
          Setting JSON
        </label>
        <textarea
          id={`setting-json-${id}`}
          className="h-64 w-full rounded border p-2 font-mono"
          value={settingJson}
          onChange={(e) => setSettingJson(e.target.value)}
          placeholder={JSON.stringify(DEFAULT_SETTING)}
        />
      </div>

      {saveResult.message && (
        <div
          className={cn(
            "mb-4 whitespace-pre-wrap rounded p-2",
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
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Save
        </button>
      </div>

      <div className="mt-8 rounded bg-gray-100 p-4">
        <h2 className="mb-2 font-bold text-xl">Example</h2>
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
