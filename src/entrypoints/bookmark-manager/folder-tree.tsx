import { type BookmarkNode, isFolder } from "@/src/feature/bookmark-path";
import { cn } from "@/src/lib/tailwind";
import type { DropTarget, useBookmarkDragAndDrop } from "./edit";
import { ChevronIcon, FolderIcon } from "./icons";

export type DragAndDrop = ReturnType<typeof useBookmarkDragAndDrop>;

export function dropIndicatorClass({
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

export const FolderTreeItem = ({
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
          "flex h-9 items-center rounded-r-full text-sm",
          selected
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
            : "hover:bg-gray-100 dark:hover:bg-gray-800",
          dropIndicatorClass({ dropTarget: dnd.dropTarget, node }),
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        {...dnd.dragProps(node, { single: true })}
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
          // fill the row so that the whole highlighted area is clickable
          className="flex h-full min-w-0 flex-1 items-center gap-3 pr-3 pl-2"
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
