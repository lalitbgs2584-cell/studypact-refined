"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brain, LayoutDashboard, Menu, PenTool, ShieldCheck, Sparkles, Upload, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type UserNavigationProps = {
  userName: string;
  userEmail: string;
  userImage?: string | null;
};

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/tasks", label: "Tasks", icon: PenTool },
  { href: "/proof-work", label: "Proof of Work", icon: ShieldCheck },
  { href: "/uploads", label: "Uploads", icon: Upload },
  { href: "/assignments", label: "Assignments", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: Users },
];

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm transition-all",
        active
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-sidebar-foreground/50")} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function UserNavigation({ userName, userEmail, userImage }: UserNavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return (
    <>
      <aside className="hidden w-80 flex-shrink-0 flex-col bg-sidebar/90 backdrop-blur-2xl md:flex">
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-wider text-sidebar-foreground">
            <Brain className="h-6 w-6 text-primary" />
            <span>STUDYPACT</span>
          </Link>
          <div className="h-2 w-2 rounded-[4px] bg-primary shadow-[0_0_18px_rgba(0,255,178,0.7)]" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 px-2 text-xs font-semibold tracking-[0.3em] text-sidebar-foreground/35">NAVIGATION</div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 rounded-[4px] bg-sidebar-accent/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[4px] bg-primary/20 text-sm font-bold text-primary">
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userImage} alt={userName} className="h-full w-full rounded-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">{userName}</div>
              <div className="truncate text-xs text-sidebar-foreground/50">{userEmail}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="bg-sidebar/95 px-4 py-3 backdrop-blur-2xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-wider text-sidebar-foreground">
            <Brain className="h-5 w-5 text-primary" />
            <span>STUDYPACT</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] bg-sidebar-accent/50 text-sidebar-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {mobileOpen ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-[4px] bg-sidebar-accent/40 p-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[4px] bg-primary/20 text-sm font-bold text-primary">
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userImage} alt={userName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-sidebar-foreground">{userName}</div>
                <div className="truncate text-xs text-sidebar-foreground/50">{userEmail}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
