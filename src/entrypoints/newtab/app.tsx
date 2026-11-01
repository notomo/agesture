import { App as ContentApp } from "../content/app";

export function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 select-none">
      <h1 className="text-6xl font-bold text-gray-800">agesture</h1>
      <ContentApp />
    </div>
  );
}
