/* Shared shimmer skeleton component — import wherever needed */
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl bg-white/[0.04]", className)}
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(196,172,120,0.06) 50%, rgba(255,255,255,0.03) 75%)",
        backgroundSize: "200% 100%",
        animation: "g-shimmer 1.6s ease-in-out infinite",
      }}
    />
  );
}

export function PageLoadingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {children}
    </div>
  );
}
