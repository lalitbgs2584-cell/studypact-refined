"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

type GroupTabsProps = {
  groupId: string;
  isLeader: boolean;
};

export function GroupTabs({ groupId, isLeader }: GroupTabsProps) {
  const pathname = usePathname();
  const feedHref = `/groups/${groupId}`;
  const tabs = [
    {
      href: feedHref,
      label: "Feed",
      icon: LayoutDashboard,
      active: pathname === feedHref || pathname.startsWith(`/groups/${groupId}/task`),
    },
  ];

  if (isLeader) {
    tabs.push({
      href: `/groups/${groupId}/settings`,
      label: "Settings",
      icon: Settings,
      active: pathname === `/groups/${groupId}/settings`,
    });
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-[4px] bg-card/80 p-1.5 py-2 backdrop-blur-xl">
      {tabs.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-[4px] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
