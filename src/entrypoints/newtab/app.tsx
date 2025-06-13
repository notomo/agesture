import { App as ContentApp } from "../content/app";

export function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center select-none">
      <h1 className="text-gray-800 text-6xl font-bold">agesture</h1>
      <ContentApp />
    </div>
  );
}
