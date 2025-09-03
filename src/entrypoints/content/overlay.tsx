import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface IframeRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const IframeOverlay = ({
  rect,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: {
  rect: IframeRect;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
}) => {
  return createPortal(
    <button
      type="button"
      // Don't use tailwind styling
      style={{
        position: "fixed",
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9998,
        pointerEvents: "auto",
        display: "block",
        border: "none",
        padding: 0,
        cursor: "default",
      }}
      onMouseDown={(e: React.MouseEvent) => {
        onMouseDown(e.nativeEvent);
      }}
      onMouseMove={(e: React.MouseEvent) => {
        onMouseMove(e.nativeEvent);
      }}
      onMouseUp={(e: React.MouseEvent) => {
        onMouseUp(e.nativeEvent);
      }}
    />,
    document.body,
  );
};

export const Overlay = ({
  isActive,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: {
  isActive: boolean;
  onMouseDown: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
}) => {
  const [iframeRects, setIframeRects] = useState<IframeRect[]>([]);

  useEffect(() => {
    if (!isActive) {
      setIframeRects([]);
      return;
    }

    const iframes = document.querySelectorAll("iframe");
    const rects: IframeRect[] = [];
    iframes.forEach((iframe) => {
      const rect = iframe.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        rects.push({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    });
    setIframeRects(rects);
  }, [isActive]);

  return (
    <>
      {iframeRects.map((rect) => (
        <IframeOverlay
          key={`${rect.top}-${rect.left}-${rect.width}-${rect.height}`}
          rect={rect}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        />
      ))}
    </>
  );
};
