"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type MobileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: MobileSheetProps) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] md:hidden">
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-[28px] border border-primary/15 bg-[rgba(13,17,24,0.96)] shadow-[0_-20px_60px_rgba(0,0,0,0.45)]",
          className,
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-white/15" />

        <div className="flex items-start justify-between gap-4 border-b border-primary/10 px-5 pb-4 pt-5">
          <div className="min-w-0">
            <div className="text-base font-semibold text-white">{title}</div>
            {description ? <p className="mt-1 text-sm text-white/55">{description}</p> : null}
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-white/70 transition hover:bg-primary/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-92px)] overflow-y-auto px-5 pb-6 pt-4">{children}</div>
      </div>
    </div>
  );
}
