import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Point } from "@/src/feature/direction";
import { cn } from "@/src/lib/tailwind";

const MENU_CLASS =
  "z-10 w-40 rounded bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10";

/**
 * Closes the menu by mousedown outside of it or Escape.
 */
export function useMenuDismiss({
  ref,
  open,
  onClose,
}: {
  ref: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // not to clear selection
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("blur", onClose);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown, {
        capture: true,
      });
      window.removeEventListener("blur", onClose);
    };
  }, [ref, open, onClose]);
}

export const MenuItem = ({
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

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
  <div role="menu" className={cn("absolute top-full right-0", MENU_CLASS)}>
    {children}
  </div>
);

export const ContextMenu = ({
  position,
  onClose,
  children,
}: {
  position: Point;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [adjusted, setAdjusted] = useState(position);

  // keep the menu inside the viewport
  useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setAdjusted({
      x: Math.max(0, Math.min(position.x, window.innerWidth - rect.width)),
      y: Math.max(0, Math.min(position.y, window.innerHeight - rect.height)),
    });
  }, [position]);

  useMenuDismiss({ ref, open: true, onClose });

  return (
    <div
      ref={ref}
      role="menu"
      className={cn("fixed", MENU_CLASS)}
      style={{ left: adjusted.x, top: adjusted.y }}
    >
      {children}
    </div>
  );
};
