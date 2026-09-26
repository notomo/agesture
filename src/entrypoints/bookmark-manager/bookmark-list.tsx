import { useEffect, useRef, useState } from "react";
import { isEditable } from "@/src/feature/bookmark-edit";
import { type BookmarkNode, isFolder } from "@/src/feature/bookmark-path";
import { cn } from "@/src/lib/tailwind";
import { type DragAndDrop, dropIndicatorClass } from "./folder-tree";
import { FolderIcon, MoreIcon } from "./icons";
import { BOOKMARK_ID_ATTRIBUTE } from "./selection";

function faviconUrl(pageUrl: string) {
  const url = new URL(`chrome-extension://${browser.runtime.id}/_favicon/`);
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", "32");
  return url.toString();
}

const BookmarkLink = ({
  node,
  folderHrefs,
  onOpenFolder,
}: {
  node: BookmarkNode;
  folderHrefs: ReadonlyMap<string, string>;
  onOpenFolder: () => void;
}) => {
  if (isFolder(node)) {
    return (
      <a
        href={folderHrefs.get(node.id)}
        className="flex h-10 min-w-0 flex-1 items-center gap-4 pl-5 text-sm"
        onClick={onOpenFolder}
      >
        <FolderIcon className="text-gray-500" />
        <span className="truncate">{node.title}</span>
      </a>
    );
  }

  const url = node.url ?? "";
  return (
    <a
      href={url}
      className="flex h-10 min-w-0 flex-1 items-center gap-4 pl-5 text-sm"
      onClick={(e) => {
        // chrome:// etc. cannot be opened by link navigation from extension page
        if (
          e.button === 0 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey &&
          !/^https?:/.test(url)
        ) {
          e.preventDefault();
          browser.tabs.update({ url });
        }
      }}
    >
      <img src={faviconUrl(url)} alt="" className="size-4 shrink-0" />
      <span className="max-w-1/2 shrink-0 truncate">{node.title || url}</span>
      <span className="truncate text-gray-500 dark:text-gray-400">{url}</span>
    </a>
  );
};

const MenuItem = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="menuitem"
    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
    onClick={onClick}
  >
    {label}
  </button>
);

const RowMenu = ({
  node,
  onEdit,
  onRemove,
}: {
  node: BookmarkNode;
  onEdit: (node: BookmarkNode) => void;
  onRemove: (node: BookmarkNode) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // not to clear selection
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown, {
        capture: true,
      });
    };
  }, [open]);

  const select = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreIcon />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-10 w-40 rounded bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
        >
          <MenuItem label="Edit" onClick={select(() => onEdit(node))} />
          {node.url && (
            <MenuItem
              label="Copy URL"
              onClick={select(() =>
                navigator.clipboard.writeText(node.url ?? ""),
              )}
            />
          )}
          <MenuItem label="Delete" onClick={select(() => onRemove(node))} />
        </div>
      )}
    </div>
  );
};

export const BookmarkRow = ({
  node,
  selected,
  folderHrefs,
  dnd,
  onOpenFolder,
  onEdit,
  onRemove,
}: {
  node: BookmarkNode;
  selected: boolean;
  folderHrefs: ReadonlyMap<string, string>;
  dnd: DragAndDrop | undefined;
  onOpenFolder: () => void;
  onEdit: (node: BookmarkNode) => void;
  onRemove: (node: BookmarkNode) => void;
}) => {
  return (
    <li
      {...{ [BOOKMARK_ID_ATTRIBUTE]: node.id }}
      data-selected={selected}
      className={cn(
        "flex items-center pr-2",
        selected
          ? "bg-blue-100 dark:bg-blue-900/50"
          : "hover:bg-gray-100 dark:hover:bg-gray-700",
        dnd && dropIndicatorClass({ dropTarget: dnd.dropTarget, node }),
      )}
      {...dnd?.dragProps(node, { single: false })}
      {...dnd?.dropProps(node, { intoOnly: false })}
    >
      <BookmarkLink
        node={node}
        folderHrefs={folderHrefs}
        onOpenFolder={onOpenFolder}
      />
      {isEditable(node) && (
        <RowMenu node={node} onEdit={onEdit} onRemove={onRemove} />
      )}
    </li>
  );
};

export const UndoToast = ({
  removed,
  onUndo,
  onDismiss,
}: {
  removed: BookmarkNode[];
  onUndo: () => void;
  onDismiss: () => void;
}) => (
  <div className="fixed bottom-6 left-6 flex items-center gap-4 rounded bg-gray-800 px-4 py-3 text-sm text-white shadow-lg dark:bg-gray-200 dark:text-gray-900">
    <span className="max-w-80 truncate">
      {removed.length === 1
        ? `Deleted "${removed[0]?.title}"`
        : `Deleted ${removed.length} items`}
    </span>
    <button
      type="button"
      className="font-medium text-blue-300 dark:text-blue-700"
      onClick={onUndo}
    >
      Undo
    </button>
    <button
      type="button"
      className="text-gray-400 dark:text-gray-600"
      onClick={onDismiss}
      aria-label="Close"
    >
      ✕
    </button>
  </div>
);
