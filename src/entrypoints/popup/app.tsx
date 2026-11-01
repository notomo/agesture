export function App() {
  return (
    <div className="rounded border border-gray-300 bg-gray-50 px-6 py-4 text-center">
      <h1 className="text-2xl font-bold">agesture</h1>
      <div className="inline-block text-left">
        <div>
          <button
            type="button"
            onClick={() => {
              browser.tabs.create({
                url: browser.runtime.getURL("/bookmark-manager.html"),
              });
            }}
            className="p-2 text-xl whitespace-nowrap text-blue-500 underline"
          >
            ★ Bookmarks
          </button>
        </div>
        <div>
          <button
            type="button"
            onClick={() => {
              browser.runtime.openOptionsPage();
            }}
            className="p-2 text-xl whitespace-nowrap text-blue-500 underline"
          >
            ⚙ Setting
          </button>
        </div>
      </div>
    </div>
  );
}
