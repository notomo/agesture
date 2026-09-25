export function App() {
  return (
    <div className="rounded border border-gray-300 bg-gray-50 px-6 py-4 text-center">
      <h1 className="font-bold text-2xl">agesture</h1>
      <div className="inline-block text-left">
        <div>
          <button
            type="button"
            onClick={() => {
              browser.tabs.create({
                url: browser.runtime.getURL("/bookmark-manager.html"),
              });
            }}
            className="whitespace-nowrap p-2 text-blue-500 text-xl underline"
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
            className="whitespace-nowrap p-2 text-blue-500 text-xl underline"
          >
            ⚙ Setting
          </button>
        </div>
      </div>
    </div>
  );
}
