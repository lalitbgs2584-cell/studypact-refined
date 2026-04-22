"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function TrackerErrorAlert({ message }: { message: string }) {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-3 rounded-[8px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <div className="min-w-0">{message}</div>
      <button
        type="button"
        aria-label="Dismiss error"
        onClick={() => router.replace("/tracker")}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-300/20 bg-red-500/5 text-red-100/80 transition hover:bg-red-500/10 hover:text-red-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
