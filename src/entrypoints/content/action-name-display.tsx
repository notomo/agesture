import type { Point } from "@/src/feature/direction";

export const ActionNameDisplay = ({
  actionName,
  position,
}: {
  actionName: string | null;
  position: Point;
}) => {
  if (!actionName) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-[9999] -translate-x-1/2"
      style={{
        left: position.x,
        top: position.y + 30,
      }}
    >
      <span className="rounded-md border-2 border-gray-700 bg-gray-900/90 p-4 font-sans text-4xl font-bold text-gray-50">
        {actionName}
      </span>
    </div>
  );
};
