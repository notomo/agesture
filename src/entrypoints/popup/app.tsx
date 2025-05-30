export function App() {
  return (
    <div className="px-6 py-4 border border-gray-300 bg-gray-50 rounded text-center">
      <h1 className="text-2xl font-bold">agesture</h1>
      <button
        type="button"
        onClick={() => {
          browser.runtime.openOptionsPage();
        }}
        className="text-xl p-2 underline text-blue-500 whitespace-nowrap"
      >
        ⚙ Setting
      </button>
    </div>
  );
}
