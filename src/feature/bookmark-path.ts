/**
 * Stable bookmark folder path
 *
 * Bookmark folder ids (including root folders like "Other Bookmarks") can change,
 * so folders are identified by root folderType and folder title segments instead.
 *
 * Path format: "{folderType}[@local]/{title}/{title}..."
 * Each segment is encoded by encodeURIComponent.
 * "@local" is added only when both syncing and local-only roots of the same folderType exist.
 */

export type BookmarkNode = {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  index?: number;
  folderType?: string;
  unmodifiable?: string;
  syncing?: boolean;
  children?: BookmarkNode[];
};

const LOCAL_SUFFIX = "@local";

export const DEFAULT_FOLDER_PATH = "bookmarks-bar";

export function isFolder(node: BookmarkNode): boolean {
  return node.url === undefined;
}

export function encodeFolderPath(segments: string[]): string {
  return segments
    .map((x) => encodeURIComponent(x).replaceAll("%40", "@"))
    .join("/");
}

export function decodeFolderPath(path: string): string[] {
  return path
    .split("/")
    .filter((x) => x !== "")
    .map((x) => decodeURIComponent(x));
}

function rootKey({
  root,
  roots,
}: {
  root: BookmarkNode;
  roots: BookmarkNode[];
}): string {
  const folderType = root.folderType ?? root.id;
  const hasSyncingSibling = roots.some(
    (x) => x !== root && x.folderType === root.folderType && x.syncing,
  );
  if (!root.syncing && hasSyncingSibling) {
    return `${folderType}${LOCAL_SUFFIX}`;
  }
  return folderType;
}

function findRootCandidates({
  key,
  roots,
}: {
  key: string;
  roots: BookmarkNode[];
}): BookmarkNode[] {
  const preferLocal = key.endsWith(LOCAL_SUFFIX);
  const folderType = preferLocal ? key.slice(0, -LOCAL_SUFFIX.length) : key;
  const candidates = roots.filter((x) => (x.folderType ?? x.id) === folderType);
  return candidates.toSorted((a, b) => {
    const score = (x: BookmarkNode) => (!!x.syncing === !preferLocal ? 0 : 1);
    return score(a) - score(b);
  });
}

function findDescendantFolder({
  node,
  titles,
}: {
  node: BookmarkNode;
  titles: string[];
}): BookmarkNode | undefined {
  const [title, ...rest] = titles;
  if (title === undefined) {
    return node;
  }
  const child = node.children?.find((x) => isFolder(x) && x.title === title);
  if (!child) {
    return undefined;
  }
  return findDescendantFolder({ node: child, titles: rest });
}

export function findFolderByPath({
  roots,
  segments,
}: {
  roots: BookmarkNode[];
  segments: string[];
}): BookmarkNode | undefined {
  const [key, ...titles] = segments;
  if (key === undefined) {
    return undefined;
  }
  for (const root of findRootCandidates({ key, roots })) {
    const found = findDescendantFolder({ node: root, titles });
    if (found) {
      return found;
    }
  }
  return undefined;
}

export function buildFolderPaths({
  roots,
}: {
  roots: BookmarkNode[];
}): Map<string, string[]> {
  const paths = new Map<string, string[]>();
  const walk = (node: BookmarkNode, segments: string[]) => {
    paths.set(node.id, segments);
    for (const child of node.children ?? []) {
      if (isFolder(child)) {
        walk(child, [...segments, child.title]);
      }
    }
  };
  for (const root of roots) {
    walk(root, [rootKey({ root, roots })]);
  }
  return paths;
}

export function buildFolderPath({
  roots,
  nodeId,
}: {
  roots: BookmarkNode[];
  nodeId: string;
}): string[] | undefined {
  return buildFolderPaths({ roots }).get(nodeId);
}

export function findNodeById({
  roots,
  nodeId,
}: {
  roots: BookmarkNode[];
  nodeId: string;
}): BookmarkNode | undefined {
  for (const node of roots) {
    if (node.id === nodeId) {
      return node;
    }
    const found = findNodeById({ roots: node.children ?? [], nodeId });
    if (found) {
      return found;
    }
  }
  return undefined;
}

export type BookmarkManagerKind = "agesture" | "chrome";

/**
 * Builds URL to open the folder in bookmark manager.
 * Chrome's bookmark manager needs folder id, so the path is resolved to the current id.
 *
 * @param path encoded folder path (e.g. "other/work")
 * @param managerUrl URL of this extension's bookmark manager page
 */
export function buildBookmarkManagerUrl({
  roots,
  path,
  manager,
  managerUrl,
}: {
  roots: BookmarkNode[];
  path: string;
  manager: BookmarkManagerKind;
  managerUrl: string;
}): string | undefined {
  switch (manager) {
    case "agesture":
      return `${managerUrl}#${path}`;
    case "chrome": {
      const folder = findFolderByPath({
        roots,
        segments: decodeFolderPath(path),
      });
      return folder ? `chrome://bookmarks/?id=${folder.id}` : undefined;
    }
    default:
      throw new Error(`Invalid manager: ${manager satisfies never}`);
  }
}
