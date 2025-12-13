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
      className="-translate-x-1/2 pointer-events-none fixed z-[9999]"
      style={{
        left: position.x,
        top: position.y + 30,
      }}
    >
      <span className="rounded-md border-2 border-gray-700 bg-gray-900/90 p-4 font-bold font-sans text-4xl text-gray-50">
        {actionName}
      </span>
    </div>
  );
};
