"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Flag,
  Gavel,
  LayoutDashboard,
  ListChecks,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

type PortalKind = "admin" | "leader";

const portalItems = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/groups", label: "Groups", icon: Shield },
    { href: "/admin/proofs", label: "Proofs", icon: ListChecks },
    { href: "/admin/disputes", label: "Disputes", icon: Gavel },
    { href: "/admin/reports", label: "Reports", icon: Flag },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  leader: [
    { href: "/leader", label: "Overview", icon: LayoutDashboard },
    { href: "/leader/members", label: "Members", icon: Users },
    { href: "/leader/proofs", label: "Proofs", icon: ListChecks },
    { href: "/leader/disputes", label: "Disputes", icon: Gavel },
    { href: "/leader/tasks", label: "Tasks", icon: Shield },
    { href: "/leader/alerts", label: "Alerts", icon: AlertTriangle },
  ],
} as const;

export function PortalTabs({ kind }: { kind: PortalKind }) {
  const pathname = usePathname();
  const items = portalItems[kind];

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-[4px] border border-border bg-card/80 p-1.5 py-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== `/${kind}` && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-[4px] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors",
              active
                ? "border border-primary/20 bg-primary/10 text-primary"
                : "border border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
