import { useCallback, useEffect, useMemo, useState } from "react";
import { isEditable } from "@/src/feature/bookmark-edit";
import {
  type BookmarkNode,
  buildFolderPaths,
  decodeFolderPath,
  encodeFolderPath,
  findFolderByPath,
  findNodeById,
  isFolder,
} from "@/src/feature/bookmark-path";
import { cn } from "@/src/lib/tailwind";
import { App as ContentApp } from "../content/app";
import {
  type DropTarget,
  useBookmarkDragAndDrop,
  useRemoveWithUndo,
} from "./edit";

const DEFAULT_PATH = "bookmarks-bar";

function useBookmarkRoots() {
  const [roots, setRoots] = useState<BookmarkNode[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const tree = await browser.bookmarks.getTree();
      setRoots(tree.at(0)?.children ?? []);
    };
    load();

    const events = [
      browser.bookmarks.onCreated,
      browser.bookmarks.onRemoved,
      browser.bookmarks.onChanged,
      browser.bookmarks.onMoved,
      browser.bookmarks.onChildrenReordered,
      browser.bookmarks.onImportEnded,
    ];
    for (const event of events) {
      event.addListener(load);
    }
    return () => {
      for (const event of events) {
        event.removeListener(load);
      }
    };
  }, []);

  return roots;
}

function getHashPath() {
  return window.location.hash.slice(1) || DEFAULT_PATH;
}

function useHashPath() {
  const [path, setPath] = useState(getHashPath);

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return path;
}

function useSearchResults(query: string) {
  const [results, setResults] = useState<BookmarkNode[]>([]);

  useEffect(() => {
    if (query === "") {
      setResults([]);
      return;
    }
    let canceled = false;
    browser.bookmarks.search(query).then((nodes) => {
      if (!canceled) {
        setResults(nodes);
      }
    });
    return () => {
      canceled = true;
    };
  }, [query]);

  return results;
}

function faviconUrl(pageUrl: string) {
  const url = new URL(`chrome-extension://${browser.runtime.id}/_favicon/`);
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", "32");
  return url.toString();
}

const FolderIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("size-5 shrink-0 fill-current", className)}
    aria-hidden="true"
  >
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn(
      "size-5 fill-current transition-transform",
      expanded && "rotate-90",
    )}
    aria-hidden="true"
  >
    <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);

type DragAndDrop = ReturnType<typeof useBookmarkDragAndDrop>;

function dropIndicatorClass({
  dropTarget,
  node,
}: {
  dropTarget: DropTarget | null;
  node: BookmarkNode;
}) {
  if (dropTarget?.id !== node.id) {
    return undefined;
  }
  switch (dropTarget.position) {
    case "before":
      return "shadow-[inset_0_2px_0_0_var(--color-blue-500)]";
    case "after":
      return "shadow-[inset_0_-2px_0_0_var(--color-blue-500)]";
    case "into":
      return "bg-blue-100 dark:bg-blue-900/50";
    default:
      throw new Error(
        `Invalid position: ${dropTarget.position satisfies never}`,
      );
  }
}

const FolderTreeItem = ({
  node,
  depth,
  selectedId,
  expandedIds,
  folderHrefs,
  dnd,
  onToggle,
  onOpenFolder,
}: {
  node: BookmarkNode;
  depth: number;
  selectedId: string | undefined;
  expandedIds: ReadonlySet<string>;
  folderHrefs: ReadonlyMap<string, string>;
  dnd: DragAndDrop;
  onToggle: (id: string) => void;
  onOpenFolder: () => void;
}) => {
  const childFolders = (node.children ?? []).filter(isFolder);
  const expanded = expandedIds.has(node.id);
  const selected = node.id === selectedId;

  return (
    <li>
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-r-full pr-3 text-sm",
          selected
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
            : "hover:bg-gray-100 dark:hover:bg-gray-800",
          dropIndicatorClass({ dropTarget: dnd.dropTarget, node }),
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        {...dnd.dragProps(node)}
        {...dnd.dropProps(node, { intoOnly: true })}
      >
        <button
          type="button"
          className={cn(
            "flex size-6 items-center justify-center text-gray-500",
            childFolders.length === 0 && "invisible",
          )}
          onClick={() => onToggle(node.id)}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronIcon expanded={expanded} />
        </button>
        <a
          href={folderHrefs.get(node.id)}
          className="flex min-w-0 flex-1 items-center gap-3"
          onClick={onOpenFolder}
        >
          <FolderIcon
            className={selected ? "text-blue-600" : "text-gray-500"}
          />
          <span className="truncate">{node.title}</span>
        </a>
      </div>
      {expanded && childFolders.length > 0 && (
        <ul>
          {childFolders.map((child) => (
            <FolderTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              folderHrefs={folderHrefs}
              dnd={dnd}
              onToggle={onToggle}
              onOpenFolder={onOpenFolder}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

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

const BookmarkRow = ({
  node,
  folderHrefs,
  dnd,
  onOpenFolder,
  onRemove,
}: {
  node: BookmarkNode;
  folderHrefs: ReadonlyMap<string, string>;
  dnd: DragAndDrop | undefined;
  onOpenFolder: () => void;
  onRemove: (node: BookmarkNode) => void;
}) => {
  return (
    <li
      className={cn(
        "group flex items-center pr-2 hover:bg-gray-100 dark:hover:bg-gray-700",
        dnd && dropIndicatorClass({ dropTarget: dnd.dropTarget, node }),
      )}
      {...dnd?.dragProps(node)}
      {...dnd?.dropProps(node, { intoOnly: false })}
    >
      <BookmarkLink
        node={node}
        folderHrefs={folderHrefs}
        onOpenFolder={onOpenFolder}
      />
      {isEditable(node) && (
        <button
          type="button"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray-500 opacity-40 hover:bg-gray-200 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-gray-600"
          onClick={() => onRemove(node)}
          aria-label="Delete"
          title="Delete"
        >
          <DeleteIcon />
        </button>
      )}
    </li>
  );
};

const UndoToast = ({
  removed,
  onUndo,
  onDismiss,
}: {
  removed: BookmarkNode;
  onUndo: () => void;
  onDismiss: () => void;
}) => (
  <div className="fixed bottom-6 left-6 flex items-center gap-4 rounded bg-gray-800 px-4 py-3 text-sm text-white shadow-lg dark:bg-gray-200 dark:text-gray-900">
    <span className="max-w-80 truncate">Deleted "{removed.title}"</span>
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

export function App() {
  const roots = useBookmarkRoots();
  const path = useHashPath();
  const [query, setQuery] = useState("");
  const searchResults = useSearchResults(query);
  const dnd = useBookmarkDragAndDrop(roots);
  const { removed, remove, undo, dismiss } = useRemoveWithUndo();
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const selectedFolder = useMemo(() => {
    if (!roots) {
      return undefined;
    }
    try {
      return findFolderByPath({ roots, segments: decodeFolderPath(path) });
    } catch {
      // malformed percent-encoding
      return undefined;
    }
  }, [roots, path]);

  // expand ancestors of selected folder
  useEffect(() => {
    if (!roots || !selectedFolder) {
      return;
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      let parentId = selectedFolder.parentId;
      while (parentId) {
        next.add(parentId);
        parentId = findNodeById({ roots, nodeId: parentId })?.parentId;
      }
      return next;
    });
  }, [roots, selectedFolder]);

  useEffect(() => {
    document.title = selectedFolder?.title
      ? `${selectedFolder.title} - Bookmarks`
      : "Bookmarks";
  }, [selectedFolder]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }, []);

  // folders are links so that link gestures (e.g. openLink) work on them
  const folderHrefs = useMemo(() => {
    const hrefs = new Map<string, string>();
    for (const [id, segments] of buildFolderPaths({ roots: roots ?? [] })) {
      hrefs.set(id, `#${encodeFolderPath(segments)}`);
    }
    return hrefs;
  }, [roots]);

  const clearQuery = useCallback(() => setQuery(""), []);

  const listItems = query ? searchResults : (selectedFolder?.children ?? []);

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="flex h-14 shrink-0 items-center gap-4 border-gray-200 border-b bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="w-60 shrink-0 text-xl">Bookmarks</h1>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bookmarks"
          className="h-10 w-full max-w-2xl rounded-full bg-gray-100 px-5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:focus:bg-gray-900"
        />
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="w-64 shrink-0 overflow-y-auto py-2 pr-2">
          <ul>
            {roots?.map((root) => (
              <FolderTreeItem
                key={root.id}
                node={root}
                depth={0}
                selectedId={query ? undefined : selectedFolder?.id}
                expandedIds={expandedIds}
                folderHrefs={folderHrefs}
                dnd={dnd}
                onToggle={toggle}
                onOpenFolder={clearQuery}
              />
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1 overflow-y-auto p-4">
          {roots && !query && !selectedFolder ? (
            <p className="p-5 text-gray-500 text-sm">
              Folder not found: {path}
            </p>
          ) : (
            <ul className="mx-auto max-w-4xl rounded-lg bg-white py-2 shadow dark:bg-gray-800">
              {listItems.map((node) => (
                <BookmarkRow
                  key={node.id}
                  node={node}
                  folderHrefs={folderHrefs}
                  // reordering search results across folders is confusing
                  dnd={query ? undefined : dnd}
                  onOpenFolder={clearQuery}
                  onRemove={remove}
                />
              ))}
              {roots && listItems.length === 0 && (
                <li className="px-5 py-2 text-gray-500 text-sm">
                  {query ? "No search results" : "No bookmarks"}
                </li>
              )}
            </ul>
          )}
        </main>
      </div>
      {removed && (
        <UndoToast removed={removed} onUndo={undo} onDismiss={dismiss} />
      )}
      <ContentApp />
    </div>
  );
}
