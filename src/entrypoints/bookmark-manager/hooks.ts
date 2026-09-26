import { useEffect, useState } from "react";
import {
  type BookmarkNode,
  DEFAULT_FOLDER_PATH,
} from "@/src/feature/bookmark-path";

export function useBookmarkRoots() {
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
  return window.location.hash.slice(1) || DEFAULT_FOLDER_PATH;
}

export function useHashPath() {
  const [path, setPath] = useState(getHashPath);

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return path;
}

export function useSearchResults(query: string) {
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
