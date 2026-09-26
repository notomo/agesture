import { useEffect, useId, useRef, useState } from "react";
import { normalizeUrl } from "@/src/feature/bookmark-edit";
import { type BookmarkNode, isFolder } from "@/src/feature/bookmark-path";

export type EditTarget =
  | { type: "edit"; node: BookmarkNode }
  | { type: "addBookmark"; parentId: string }
  | { type: "addFolder"; parentId: string };

function getTitle(target: EditTarget) {
  switch (target.type) {
    case "edit":
      return isFolder(target.node) ? "Rename folder" : "Edit bookmark";
    case "addBookmark":
      return "Add bookmark";
    case "addFolder":
      return "Add folder";
    default:
      throw new Error(`Invalid type: ${target satisfies never}`);
  }
}

function hasUrl(target: EditTarget) {
  switch (target.type) {
    case "edit":
      return !isFolder(target.node);
    case "addBookmark":
      return true;
    case "addFolder":
      return false;
    default:
      throw new Error(`Invalid type: ${target satisfies never}`);
  }
}

async function save({
  target,
  title,
  url,
}: {
  target: EditTarget;
  title: string;
  url: string | undefined;
}) {
  switch (target.type) {
    case "edit":
      await browser.bookmarks.update(target.node.id, { title, url });
      return;
    case "addBookmark":
    case "addFolder":
      await browser.bookmarks.create({
        parentId: target.parentId,
        title,
        url,
      });
      return;
    default:
      throw new Error(`Invalid type: ${target satisfies never}`);
  }
}

export const EditDialog = ({
  target,
  onClose,
}: {
  target: EditTarget;
  onClose: () => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const node = target.type === "edit" ? target.node : undefined;
  const [title, setTitle] = useState(node?.title ?? "");
  const [url, setUrl] = useState(node?.url ?? "");
  const [error, setError] = useState("");
  const withUrl = hasUrl(target);
  const id = useId();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUrl = withUrl ? normalizeUrl(url) : undefined;
    if (withUrl && !normalizedUrl) {
      setError("Invalid URL");
      return;
    }
    try {
      await save({ target, title, url: normalizedUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      // close by Escape
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-lg bg-white p-6 text-gray-900 shadow-xl backdrop:bg-black/40 dark:bg-gray-800 dark:text-gray-100"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 id={`${id}-title`} className="text-lg">
          {getTitle(target)}
        </h2>
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
          />
        </label>
        {withUrl && (
          <label className="flex flex-col gap-1 text-sm">
            URL
            <input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              className="rounded border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
            />
          </label>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded px-4 py-2 text-blue-600 text-sm hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
};
