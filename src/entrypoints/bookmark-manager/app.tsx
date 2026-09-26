import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type BookmarkNode,
  buildFolderPaths,
  decodeFolderPath,
  encodeFolderPath,
  findFolderByPath,
  findNodeById,
} from "@/src/feature/bookmark-path";
import { App as ContentApp } from "../content/app";
import { BookmarkRow, UndoToast } from "./bookmark-list";
import { useBookmarkDragAndDrop, useRemoveWithUndo } from "./edit";
import { EditDialog, type EditTarget } from "./edit-dialog";
import { FolderTreeItem } from "./folder-tree";
import { useBookmarkRoots, useHashPath, useSearchResults } from "./hooks";
import { AddIcon } from "./icons";
import { SelectionRect, useRectSelection } from "./selection";

function isTextInput(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.matches("input, textarea, select") ||
      !!target.closest("dialog"))
  );
}

function useKeyboardShortcuts({
  searchRef,
  onClearSearch,
  onSelectAll,
  onClearSelection,
  onRemoveSelected,
  onUndo,
}: {
  searchRef: React.RefObject<HTMLInputElement | null>;
  onClearSearch: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRemoveSelected: () => void;
  onUndo: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target === searchRef.current && e.key === "Escape") {
        onClearSearch();
        searchRef.current?.blur();
        return;
      }
      if (isTextInput(e.target) || e.altKey) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (!ctrl && e.key === "Delete") {
        onRemoveSelected();
      } else if (!ctrl && e.key === "Escape") {
        onClearSelection();
      } else if (ctrl && e.key === "a") {
        e.preventDefault();
        onSelectAll();
      } else if (ctrl && e.key === "z") {
        onUndo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    searchRef,
    onClearSearch,
    onSelectAll,
    onClearSelection,
    onRemoveSelected,
    onUndo,
  ]);
}

const EMPTY_SELECTION: ReadonlySet<string> = new Set();

export function App() {
  const roots = useBookmarkRoots();
  const path = useHashPath();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchResults = useSearchResults(query);
  const { removed, remove, undo, dismiss } = useRemoveWithUndo();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [selectedIds, setSelectedIds] =
    useState<ReadonlySet<string>>(EMPTY_SELECTION);
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

  const listItems = useMemo(
    () => (query ? searchResults : (selectedFolder?.children ?? [])),
    [query, searchResults, selectedFolder],
  );

  // clear selection when the list is switched
  // biome-ignore lint/correctness/useExhaustiveDependencies: triggered by list switch
  useEffect(() => {
    setSelectedIds(EMPTY_SELECTION);
  }, [query, selectedFolder?.id]);

  // show shallow folders by default
  const expandedRootsRef = useRef(false);
  useEffect(() => {
    if (!roots || expandedRootsRef.current) {
      return;
    }
    expandedRootsRef.current = true;
    setExpandedIds((prev) => new Set([...prev, ...roots.map((x) => x.id)]));
  }, [roots]);

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

  const selectedNodes = useMemo(
    () => listItems.filter((x) => selectedIds.has(x.id)),
    [listItems, selectedIds],
  );

  const getDragIds = useCallback(
    (node: BookmarkNode) =>
      selectedIds.has(node.id) ? selectedNodes.map((x) => x.id) : [node.id],
    [selectedIds, selectedNodes],
  );
  const dnd = useBookmarkDragAndDrop({ roots, getDragIds });

  const rectSelection = useRectSelection({ selectedIds, setSelectedIds });

  const removeOne = useCallback(
    (node: BookmarkNode) => remove([node]),
    [remove],
  );
  const openEdit = useCallback(
    (node: BookmarkNode) => setEditTarget({ type: "edit", node }),
    [],
  );

  useKeyboardShortcuts({
    searchRef,
    onClearSearch: clearQuery,
    onSelectAll: useCallback(
      () => setSelectedIds(new Set(listItems.map((x) => x.id))),
      [listItems],
    ),
    onClearSelection: useCallback(() => setSelectedIds(EMPTY_SELECTION), []),
    onRemoveSelected: useCallback(() => {
      if (selectedNodes.length > 0) {
        setSelectedIds(EMPTY_SELECTION);
        remove(selectedNodes);
      }
    }, [selectedNodes, remove]),
    onUndo: undo,
  });

  const canAdd =
    !query && selectedFolder && selectedFolder.unmodifiable === undefined;

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="flex h-14 shrink-0 items-center border-gray-200 border-b bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* same width as nav so that search box is centered on the list */}
        <h1 className="w-64 shrink-0 px-4 text-xl">Bookmarks</h1>
        <div className="min-w-0 flex-1 px-4">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookmarks  ( / )"
            className="mx-auto block h-10 w-full max-w-2xl rounded-full bg-gray-100 px-5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:focus:bg-gray-900"
          />
        </div>
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
        {/* both-edges gutter keeps the list centered same as search box even with scrollbar */}
        <main
          className="min-w-0 flex-1 select-none overflow-y-auto p-4 [scrollbar-gutter:stable_both-edges]"
          onMouseDown={rectSelection.onMouseDown}
        >
          {roots && !query && !selectedFolder ? (
            <p className="p-5 text-gray-500 text-sm">
              Folder not found: {path}
            </p>
          ) : (
            <div className="mx-auto max-w-4xl">
              <div className="flex h-10 items-center gap-2 px-1">
                <h2 className="min-w-0 flex-1 truncate text-gray-600 text-sm dark:text-gray-400">
                  {query
                    ? `Search results for "${query}"`
                    : selectedFolder?.title}
                </h2>
                {canAdd && (
                  <>
                    <AddButton
                      label="Add bookmark"
                      onClick={() =>
                        setEditTarget({
                          type: "addBookmark",
                          parentId: selectedFolder.id,
                        })
                      }
                    />
                    <AddButton
                      label="Add folder"
                      onClick={() =>
                        setEditTarget({
                          type: "addFolder",
                          parentId: selectedFolder.id,
                        })
                      }
                    />
                  </>
                )}
              </div>
              <ul className="rounded-lg bg-white py-2 shadow dark:bg-gray-800">
                {listItems.map((node) => (
                  <BookmarkRow
                    key={node.id}
                    node={node}
                    selected={selectedIds.has(node.id)}
                    folderHrefs={folderHrefs}
                    // reordering search results across folders is confusing
                    dnd={query ? undefined : dnd}
                    onOpenFolder={clearQuery}
                    onEdit={openEdit}
                    onRemove={removeOne}
                  />
                ))}
                {roots && listItems.length === 0 && (
                  <li className="px-5 py-2 text-gray-500 text-sm">
                    {query ? "No search results" : "No bookmarks"}
                  </li>
                )}
              </ul>
            </div>
          )}
        </main>
      </div>
      {rectSelection.rect && <SelectionRect rect={rectSelection.rect} />}
      {editTarget && (
        <EditDialog target={editTarget} onClose={() => setEditTarget(null)} />
      )}
      {removed.length > 0 && (
        <UndoToast removed={removed} onUndo={undo} onDismiss={dismiss} />
      )}
      <ContentApp />
    </div>
  );
}

const AddButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-1 rounded-full px-3 py-1 text-blue-600 text-sm hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-800"
  >
    <AddIcon />
    {label}
  </button>
);
