"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  PenTool,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Upload,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { setActiveGroup } from "@/lib/actions/group";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type GroupWorkspaceItem = {
  id: string;
  name: string;
  role: "member" | "admin";
};

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const baseNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "/tasks", icon: PenTool, label: "Tasks" },
  { href: "/tracker", icon: Target, label: "Tracker" },
  { href: "/proof-work", icon: ShieldCheck, label: "Proof of Work" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/uploads", icon: Upload, label: "Uploads" },
  { href: "/profile", icon: User, label: "Profile" },
];

function isRouteActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

function NavLink({
  active,
  href,
  icon: Icon,
  label,
  onNavigate,
}: NavItem & {
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
        active
          ? "border-primary/25 bg-primary/10 text-primary shadow-[0_14px_34px_rgba(196,172,120,0.08)]"
          : "border-transparent text-white/70 hover:border-white/8 hover:bg-white/[0.03] hover:text-white",
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-white/45")} />
      <span className="flex-1 truncate">{label}</span>
      {active ? <ChevronRight className="h-4 w-4 text-primary/80" /> : null}
    </Link>
  );
}

function GroupSwitcher({
  activeGroupId,
  groups,
  onNavigate,
}: {
  activeGroupId: string | null;
  groups: GroupWorkspaceItem[];
  onNavigate?: () => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/45">
        Join a group to unlock the shared workspace.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const active = group.id === activeGroupId;

        return (
          <form key={group.id} action={setActiveGroup}>
            <input type="hidden" name="groupId" value={group.id} />
            <button
              type="submit"
              onClick={onNavigate}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition",
                active
                  ? "border-primary/25 bg-primary/10 text-white"
                  : "border-white/8 bg-white/[0.03] text-white/70 hover:border-primary/15 hover:bg-primary/5 hover:text-white",
              )}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{group.name}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/35">
                  {group.role === "admin" ? "Leader access" : "Member"}
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                  active
                    ? "bg-primary/20 text-primary"
                    : "bg-white/[0.04] text-white/35",
                )}
              >
                {active ? "Active" : "Switch"}
              </span>
            </button>
          </form>
        );
      })}
    </div>
  );
}

function SessionCard({
  isLoading,
  onSignOut,
  session,
}: {
  isLoading: boolean;
  onSignOut: () => Promise<void>;
  session: ReturnType<typeof useSession>["data"];
}) {
  const userName = session?.user.name ?? (isLoading ? "Loading..." : "Account");
  const userEmail = session?.user.email ?? (isLoading ? "Checking session..." : "Signed out");

  return (
    <div className="space-y-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#1E2D40,#886840)] text-sm font-bold text-[#EDE6D6] shadow-[0_0_0_1px_rgba(196,172,120,0.18),0_10px_26px_rgba(0,0,0,0.24)]">
          {session?.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={userName}
              className="h-full w-full object-cover"
            />
          ) : (
            userName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{userName}</div>
          <div className="truncate text-xs text-white/45">{userEmail}</div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2 text-white/75"
        disabled={isLoading || !session}
        onClick={onSignOut}
      >
        <LogOut className="h-4 w-4" />
        {isLoading ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  );
}

export function UserNavigation({
  activeGroupId,
  groups,
  showAdminPortal = false,
  showLeaderPortal = false,
}: {
  activeGroupId: string | null;
  groups: GroupWorkspaceItem[];
  showAdminPortal?: boolean;
  showLeaderPortal?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const { data: session, isPending } = useSession();
  const isLoadingSession = isPending && !session;

  const portalItems: NavItem[] = [];
  if (showLeaderPortal) {
    portalItems.push({ href: "/leader", icon: ShieldCheck, label: "Leader Portal" });
  }
  if (showAdminPortal) {
    portalItems.push(
      { href: "/admin", icon: Sparkles, label: "Admin Portal" },
      { href: "/admin/dsa", icon: BarChart3, label: "DSA Vault" },
    );
  }

  const allItems = [...baseNavItems, ...portalItems];
  const activeItem = allItems.find((item) => isRouteActive(pathname, item.href));

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function handleSignOut() {
    await signOut();
    startTransition(() => {
      router.replace("/");
      router.refresh();
    });
  }

  const navigationBody = (
    <div className="flex h-full flex-col">
      <div className="border-b border-primary/10 px-5 pb-5 pt-4">
        <Link href="/dashboard" onClick={() => setOpen(false)} className="inline-flex">
          <Logo size="sm" />
        </Link>
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Active Workspace
          </div>
          <div className="mt-2">
            <GroupSwitcher
              activeGroupId={activeGroupId}
              groups={groups}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Navigation
        </div>
        <div className="mt-3 space-y-2">
          {baseNavItems.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isRouteActive(pathname, item.href)}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </div>

        {portalItems.length > 0 ? (
          <>
            <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Portals
            </div>
            <div className="mt-3 space-y-2">
              {portalItems.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  active={isRouteActive(pathname, item.href)}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="border-t border-primary/10 px-4 py-4">
        <SessionCard session={session} isLoading={isLoadingSession} onSignOut={handleSignOut} />
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-primary/10 bg-[rgba(11,16,24,0.94)] backdrop-blur-2xl lg:block">
        {navigationBody}
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 border-b border-primary/10 bg-[rgba(11,16,24,0.92)] backdrop-blur-2xl lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <Link href="/dashboard" className="inline-flex">
            <Logo size="sm" />
          </Link>

          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
              {activeItem?.label ?? "Workspace"}
            </div>
          </div>

          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary transition hover:bg-primary/10"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="absolute inset-y-0 left-0 w-[min(88vw,320px)] border-r border-primary/12 bg-[rgba(11,16,24,0.98)] shadow-[16px_0_48px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-end px-4 pt-4">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {navigationBody}
          </div>
        </div>
      ) : null}
    </>
  );
}
