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
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: position.x,
        top: position.y + 30,
        transform: "translate(-50%, 0)",
      }}
    >
      <span className="rounded-md bg-black/70 px-4 py-2 font-bold font-sans text-2xl text-white">
        {actionName}
      </span>
    </div>
  );
};
