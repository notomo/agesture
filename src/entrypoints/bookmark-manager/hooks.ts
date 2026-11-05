import { useEffect, useState } from "react";
import {
  type BookmarkNode,
  DEFAULT_FOLDER_PATH,
} from "@/src/feature/bookmark-path";

function subscribeBookmarkChanges(listener: () => void) {
  const events = [
    browser.bookmarks.onCreated,
    browser.bookmarks.onRemoved,
    browser.bookmarks.onChanged,
    browser.bookmarks.onMoved,
    browser.bookmarks.onChildrenReordered,
    browser.bookmarks.onImportEnded,
  ];
  for (const event of events) {
    event.addListener(listener);
  }
  return () => {
    for (const event of events) {
      event.removeListener(listener);
    }
  };
}

export function useBookmarkRoots() {
  const [roots, setRoots] = useState<BookmarkNode[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const tree = await browser.bookmarks.getTree();
      setRoots(tree.at(0)?.children ?? []);
    };
    load();
    return subscribeBookmarkChanges(load);
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
    let latestRequest = 0;
    const load = async () => {
      latestRequest += 1;
      const request = latestRequest;
      const nodes = await browser.bookmarks.search(query);
      if (request === latestRequest) {
        setResults(nodes);
      }
    };
    load();
    const unsubscribe = subscribeBookmarkChanges(load);
    return () => {
      latestRequest += 1;
      unsubscribe();
    };
  }, [query]);

  return results;
}
