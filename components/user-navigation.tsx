"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  PenTool,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createGroup, joinGroup, removeGroupMember } from "@/lib/actions/group";
import { ACTIVE_GROUP_COOKIE } from "@/lib/constants";

type WorkspaceMembership = {
  groupId: string;
  role: "member" | "admin";
  group: {
    id: string;
    name: string;
    description: string | null;
    inviteCode: string;
    createdBy: { id: string; name: string; image: string | null };
    users: {
      role: "member" | "admin";
      user: { id: string; name: string; image: string | null };
    }[];
    _count: { users: number; tasks: number };
  };
};

type UserNavigationProps = {
  userName: string;
  userEmail: string;
  userImage?: string | null;
  memberships: WorkspaceMembership[];
  activeGroupId: string | null;
};

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
        "flex items-center gap-3 rounded-2xl border-l-2 px-3 py-2.5 text-sm transition-all",
        active
          ? "border-sidebar-primary bg-sidebar-accent text-sidebar-foreground"
          : "border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function UserChip({ name, image }: { name: string; image?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-xs font-bold text-primary">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      <span className="truncate">{name}</span>
    </div>
  );
}

export function UserNavigation({
  userName,
  userEmail,
  userImage,
  memberships,
  activeGroupId,
}: UserNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = activeGroupId ?? memberships[0]?.groupId ?? null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(activeId);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (activeId) setExpandedGroupId(activeId);
  }, [activeId]);

  useEffect(() => {
    if (searchParams.get("join") === "1") {
      setGroupsOpen(true);
      setJoinOpen(true);
    }
    if (searchParams.get("create") === "1") {
      setGroupsOpen(true);
      setCreateOpen(true);
    }
  }, [searchParams]);

  const setActiveGroup = (groupId: string) => {
    document.cookie = `${ACTIVE_GROUP_COOKIE}=${groupId}; path=/; samesite=lax`;
    setExpandedGroupId(groupId);
    router.refresh();
  };

  return (
    <>
      <aside className="hidden w-80 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-2xl md:flex">
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-wider text-sidebar-foreground">
            <Brain className="h-6 w-6 text-primary" />
            <span>STUDYPACT</span>
          </Link>
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_rgba(251,146,60,0.8)]" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 px-2 text-xs font-semibold tracking-[0.3em] text-sidebar-foreground/35">NAVIGATION</div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-sidebar-border bg-sidebar-accent/40 p-4">
            <button
              type="button"
              onClick={() => setGroupsOpen((value) => !value)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <div>
                <div className="text-xs font-semibold tracking-[0.25em] text-primary/80">GROUPS</div>
                <div className="mt-1 text-sm text-sidebar-foreground/60">Switch context, create, or join</div>
              </div>
              {groupsOpen ? <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" /> : <ChevronRight className="h-4 w-4 text-sidebar-foreground/50" />}
            </button>

            <div className={cn("overflow-hidden transition-all duration-300", groupsOpen ? "mt-4 max-h-[2000px] opacity-100" : "max-h-0 opacity-0")}>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setCreateOpen((value) => !value)}>
                  <CirclePlus className="mr-1 h-4 w-4" />
                  Create
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setJoinOpen((value) => !value)}>
                  Join
                </Button>
              </div>

              {createOpen ? (
                <form action={createGroup} className="mt-4 space-y-3 rounded-2xl border border-border bg-background/70 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="sidebar-group-name" className="text-xs text-muted-foreground">
                      Group name
                    </Label>
                    <Input id="sidebar-group-name" name="name" placeholder="Study Sprint" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sidebar-group-desc" className="text-xs text-muted-foreground">
                      Description
                    </Label>
                    <textarea
                      id="sidebar-group-desc"
                      name="description"
                      className="min-h-20 w-full rounded-2xl border border-border bg-background/70 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                      placeholder="What is this group about?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sidebar-focus" className="text-xs text-muted-foreground">
                      Focus
                    </Label>
                    <select
                      id="sidebar-focus"
                      name="focusType"
                      className="w-full rounded-2xl border border-border bg-background/70 p-3 text-sm text-foreground focus:border-ring focus:outline-none"
                    >
                      <option value="GENERAL">General</option>
                      <option value="DEVELOPMENT">Development</option>
                      <option value="DSA">DSA</option>
                      <option value="EXAM_PREP">Exam Prep</option>
                      <option value="MACHINE_LEARNING">Machine Learning</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full">
                    Create Group
                  </Button>
                </form>
              ) : null}

              {joinOpen ? (
                <form action={joinGroup} className="mt-4 space-y-3 rounded-2xl border border-border bg-background/70 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-code" className="text-xs text-muted-foreground">
                      Invite code
                    </Label>
                    <Input id="invite-code" name="inviteCode" placeholder="AB12CD34" className="font-mono uppercase tracking-[0.3em]" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Join Group
                  </Button>
                </form>
              ) : null}

              <div className="mt-4 space-y-3">
                {memberships.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
                    No groups yet. Create one or join by invite code.
                  </div>
                ) : (
                  memberships.map((membership) => {
                    const expanded = expandedGroupId === membership.groupId;
                    const isActive = activeId === membership.groupId;
                    const leader = membership.group.createdBy;

                    return (
                      <div
                        key={membership.groupId}
                        className={cn(
                          "rounded-3xl border p-4 transition-all",
                          isActive
                            ? "border-primary/40 bg-primary/10 shadow-[0_0_30px_-18px_rgba(251,146,60,0.45)]"
                            : "border-border bg-background/60"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => setActiveGroup(membership.groupId)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-bold text-foreground">{membership.group.name}</span>
                              {isActive ? (
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                                  Active
                                </span>
                              ) : null}
                              {membership.role === "admin" ? (
                                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                  Leader
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">{membership.group._count.users} members</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedGroupId(expanded ? null : membership.groupId)}
                            className="mt-1 rounded-full border border-border bg-background/70 p-1 text-muted-foreground"
                            aria-label="Toggle group details"
                          >
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </div>

                        <div className={cn("overflow-hidden transition-all duration-300", expanded ? "mt-4 max-h-[1200px] opacity-100" : "max-h-0 opacity-0")}>
                          <div className="space-y-3 rounded-2xl border border-border bg-background/60 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Leader</div>
                                <div className="mt-2">
                                  <UserChip name={leader.name} image={leader.image} />
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Invite code</div>
                                <div className="mt-2 font-mono text-sm font-bold tracking-[0.3em] text-primary">
                                  {membership.group.inviteCode.toUpperCase()}
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Members</div>
                              <div className="space-y-2">
                                {membership.group.users.map((groupMember) => (
                                  <div key={groupMember.user.id} className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-background/60 px-3 py-2">
                                    <div className="min-w-0">
                                      <UserChip name={groupMember.user.name} image={groupMember.user.image} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={cn(
                                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]",
                                          groupMember.role === "admin" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                                        )}
                                      >
                                        {groupMember.role === "admin" ? "Leader" : "Member"}
                                      </span>
                                      {membership.role === "admin" && groupMember.user.id !== leader.id ? (
                                        <form action={removeGroupMember}>
                                          <input type="hidden" name="groupId" value={membership.groupId} />
                                          <input type="hidden" name="memberId" value={groupMember.user.id} />
                                          <Button type="submit" variant="ghost" size="icon-xs" className="text-red-300 hover:bg-red-500/10 hover:text-red-200">
                                            <LogOut className="h-3.5 w-3.5" />
                                          </Button>
                                        </form>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-sidebar-accent/60 p-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/20 font-bold text-primary">
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userImage} alt={userName} className="h-full w-full object-cover" />
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

      <div className="relative border-b border-sidebar-border bg-sidebar/90 px-4 py-3 backdrop-blur-2xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-wider text-sidebar-foreground">
            <Brain className="h-6 w-6 text-primary" />
            <span>STUDYPACT</span>
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background/70 text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full border-b border-sidebar-border bg-sidebar/95 p-4 backdrop-blur-2xl">
            <div className="max-h-[80vh] overflow-y-auto pr-1">
              <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-3">
                <div className="text-sm font-semibold text-sidebar-foreground">{userName}</div>
                <div className="truncate text-xs text-sidebar-foreground/50">{userEmail}</div>
              </div>

              <div className="mt-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>

              <div className="mt-4 rounded-3xl border border-sidebar-border bg-sidebar-accent/40 p-4">
                <div className="text-xs font-semibold tracking-[0.25em] text-primary/80">GROUPS</div>
                <div className="mt-1 text-sm text-sidebar-foreground/60">Switch context or join a new group</div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setCreateOpen((value) => !value)}>
                    <CirclePlus className="mr-1 h-4 w-4" />
                    Create
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setJoinOpen((value) => !value)}>
                    Join
                  </Button>
                </div>

                {createOpen ? (
                  <form action={createGroup} className="mt-4 space-y-3 rounded-2xl border border-border bg-background/70 p-4">
                    <Input id="mobile-group-name" name="name" placeholder="Study Sprint" required />
                    <textarea
                      name="description"
                      className="min-h-20 w-full rounded-2xl border border-border bg-background/70 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                      placeholder="What is this group about?"
                    />
                    <Button type="submit" className="w-full">
                      Create Group
                    </Button>
                  </form>
                ) : null}

                {joinOpen ? (
                  <form action={joinGroup} className="mt-4 space-y-3 rounded-2xl border border-border bg-background/70 p-4">
                    <Input id="mobile-invite-code" name="inviteCode" placeholder="AB12CD34" className="font-mono uppercase tracking-[0.3em]" required />
                    <Button type="submit" className="w-full">
                      Join Group
                    </Button>
                  </form>
                ) : null}

                <div className="mt-4 space-y-3">
                  {memberships.map((membership) => (
                    <button
                      key={membership.groupId}
                      type="button"
                      onClick={() => {
                        setActiveGroup(membership.groupId);
                        setMobileOpen(false);
                      }}
                      className={cn(
                        "w-full rounded-2xl border px-3 py-3 text-left",
                        activeId === membership.groupId
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border bg-background/60 text-foreground/80"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{membership.group.name}</div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{membership.group._count.users} members</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
