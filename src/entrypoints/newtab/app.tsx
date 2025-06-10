import { App as ContentApp } from "../content/app";

export function App() {
  return (
    <div className="min-h-screen bg-gray-700 flex items-center justify-center">
      <h1 className="text-gray-300 text-6xl font-bold">agesture</h1>
      <ContentApp />
    </div>
  );
}
