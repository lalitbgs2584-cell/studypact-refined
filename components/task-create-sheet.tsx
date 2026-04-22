"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { MobileSheet } from "@/components/mobile-sheet";
import { Button } from "@/components/ui/button";

export function TaskCreateSheet({
  action,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-[linear-gradient(135deg,#A08840_0%,#C4AC78_55%,#D4C090_100%)] text-[#0D1118] shadow-[0_12px_30px_rgba(196,172,120,0.25)] transition hover:scale-[1.02] md:hidden"
        aria-label="Create task"
      >
        <Plus className="h-6 w-6" />
      </button>

      <MobileSheet
        open={open}
        onOpenChange={setOpen}
        title="Add Task"
        description="Create a task without losing your place in the mobile list."
      >
        <form action={action} className="space-y-5">
          {children}

          <div className="flex justify-end">
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </div>
        </form>
      </MobileSheet>
    </>
  );
}
