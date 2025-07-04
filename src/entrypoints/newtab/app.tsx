import { App as ContentApp } from "../content/app";

export function App() {
  return (
    <div className="flex min-h-screen select-none items-center justify-center bg-gray-900">
      <h1 className="font-bold text-6xl text-gray-800">agesture</h1>
      <ContentApp />
    </div>
  );
}
