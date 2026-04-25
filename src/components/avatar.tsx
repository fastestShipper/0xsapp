import { cn } from "@/lib/cn";

export function Avatar({
  name,
  accent,
  online,
  size = 40,
  className,
}: {
  name: string;
  accent: string;
  online?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div
        className={cn(
          "h-full w-full rounded-full bg-gradient-to-br text-white font-medium flex items-center justify-center shadow-sm ring-1 ring-black/5",
          accent
        )}
        style={{ fontSize: size * 0.42 }}
      >
        {name.slice(0, 1)}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute right-0 bottom-0 rounded-full ring-2 ring-background",
            online ? "bg-emerald-500" : "bg-neutral-400"
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
