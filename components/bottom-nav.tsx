"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  PenTool,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Upload,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { MobileSheet } from "@/components/mobile-sheet";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: PenTool },
  { href: "/tracker", label: "Tracker", icon: Target },
  { href: "/groups", label: "Groups", icon: Users },
] as const;

const EXTRA_ICON_MAP: Record<string, LucideIcon> = {
  "/leaderboard": Trophy,
  "/proof-work": ShieldCheck,
  "/uploads": Upload,
  "/profile": User,
  "/leader": ShieldCheck,
  "/admin": Sparkles,
};

type BottomNavProps = {
  extraItems: { href: string; label: string }[];
};

function isRouteActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export function BottomNav({ extraItems }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isSigningOut, startTransition] = useTransition();
  const moreActive = extraItems.some((item) => isRouteActive(pathname, item.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/10 bg-[rgba(13,17,24,0.94)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-screen-sm grid-cols-5 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] pt-2">
          {PRIMARY_NAV.map((item) => {
            const active = isRouteActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSheetOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
                  active ? "bg-primary/10 text-primary" : "text-white/55 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
              moreActive || sheetOpen
                ? "bg-primary/10 text-primary"
                : "text-white/55 hover:bg-white/5 hover:text-white",
            )}
          >
            <MoreHorizontal className="h-4.5 w-4.5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <MobileSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="More"
        description="Everything that doesn’t need a permanent slot in the bottom bar lives here."
      >
        <div className="space-y-3">
          <div className="grid gap-2">
            {extraItems.map((item) => {
              const active = isRouteActive(pathname, item.href);
              const Icon = EXTRA_ICON_MAP[item.href] ?? MoreHorizontal;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-white/8 bg-white/[0.03] text-white/80 hover:border-primary/15 hover:bg-primary/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            disabled={isSigningOut}
            onClick={() =>
              startTransition(async () => {
                await signOut();
                router.replace("/");
                router.refresh();
              })
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </MobileSheet>
    </>
  );
}
