"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type ReflectionUnderstandingValue =
  | "UNDERSTOOD"
  | "PARTIALLY_UNDERSTOOD"
  | "NOT_UNDERSTOOD";

const OPTIONS: Array<{
  value: ReflectionUnderstandingValue;
  label: string;
  tone: string;
}> = [
  {
    value: "UNDERSTOOD",
    label: "✅ Understood",
    tone:
      "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.15)]",
  },
  {
    value: "PARTIALLY_UNDERSTOOD",
    label: "⚠️ Partial",
    tone:
      "border-amber-400/30 bg-amber-400/15 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.12)]",
  },
  {
    value: "NOT_UNDERSTOOD",
    label: "❌ Not Understood",
    tone:
      "border-red-400/30 bg-red-500/15 text-red-200 shadow-[0_0_18px_rgba(239,68,68,0.12)]",
  },
];

export function ReflectionUnderstandingControl({
  name = "understanding",
  defaultValue = "PARTIALLY_UNDERSTOOD",
}: {
  name?: string;
  defaultValue?: ReflectionUnderstandingValue;
}) {
  const [selected, setSelected] = useState<ReflectionUnderstandingValue>(defaultValue);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const active = option.value === selected;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-xs font-semibold transition sm:text-sm",
                active
                  ? option.tone
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:border-primary/20 hover:bg-primary/5 hover:text-white",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
