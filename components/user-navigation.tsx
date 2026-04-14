"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
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
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createGroup, joinGroup, removeGroupMember, setActiveGroup as persistActiveGroup } from "@/lib/actions/group";

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
        "flex items-center gap-3 rounded-[4px] border-l-2 px-3 py-2.5 text-sm transition-all",
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
  const [, startTransition] = useTransition();

  const searchParams = useSearchParams();

  useEffect(() => {
    const timeout = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  useEffect(() => {
    if (!activeId) return;
    const timeout = window.setTimeout(() => setExpandedGroupId(activeId), 0);
    return () => window.clearTimeout(timeout);
  }, [activeId]);

  useEffect(() => {
    if (searchParams.get("join") === "1") {
      const timeout = window.setTimeout(() => {
        setGroupsOpen(true);
        setJoinOpen(true);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
    if (searchParams.get("create") === "1") {
      const timeout = window.setTimeout(() => {
        setGroupsOpen(true);
        setCreateOpen(true);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [searchParams]);

  const setActiveGroup = (groupId: string) => {
    startTransition(() => {
      persistActiveGroup(groupId)
        .then(() => {
          setExpandedGroupId(groupId);
          router.refresh();
        })
        .catch(console.error);
    });
  };

  return (
    <>
      <aside className="hidden w-80 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-2xl md:flex">
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-wider text-sidebar-foreground">
            <Brain className="h-6 w-6 text-primary" />
            <span>STUDYPACT</span>
          </Link>
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_rgba(0,255,178,0.7)]" />
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
                            ? "border-primary/40 bg-primary/10 shadow-[0_0_30px_-18px_rgba(0,255,178,0.35)]"
                            : "border-border bg-background/60"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveGroup(membership.groupId)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-bold text-foreground">{membership.group.name}</span>
                            {isActive ? <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Active</span> : null}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {membership.group._count.users} members - {membership.group._count.tasks} tasks
                          </div>
                        </button>

                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>Created by {leader.name}</span>
                          <button type="button" onClick={() => setExpandedGroupId(expanded ? null : membership.groupId)} className="text-primary hover:underline">
                            {expanded ? "Hide" : "Details"}
                          </button>
                        </div>

                        {expanded ? (
                          <div className="mt-4 space-y-3">
                            {membership.group.description ? <p className="text-sm text-muted-foreground">{membership.group.description}</p> : null}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setActiveGroup(membership.groupId);
                                  setMobileOpen(false);
                                }}
                              >
                                Use this group
                              </Button>
                              <Link href={`/groups/${membership.groupId}`}>
                                <Button variant="ghost" size="sm">
                                  Open group
                                </Button>
                              </Link>
                            </div>
                            <div className="space-y-2 border-t border-border pt-3">
                              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Members</div>
                              <div className="flex flex-wrap gap-2">
                                {membership.group.users.map((member) => (
                                  <UserChip key={member.user.id} name={member.user.name} image={member.user.image} />
                                ))}
                              </div>
                            </div>
                            <form action={removeGroupMember} className="space-y-3 border-t border-border pt-3">
                              <input type="hidden" name="groupId" value={membership.groupId} />
                              <input type="hidden" name="memberId" value={leader.id} />
                              <Button type="submit" variant="outline" size="sm" className="w-full text-accent">
                                <LogOut className="mr-2 h-4 w-4" />
                                Remove leader
                              </Button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-3xl border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-sm font-bold text-primary">
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

      <div className="border-b border-sidebar-border bg-sidebar/95 px-4 py-3 backdrop-blur-2xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-wider text-sidebar-foreground">
            <Brain className="h-5 w-5 text-primary" />
            <span>STUDYPACT</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground"
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

            <div className="rounded-3xl border border-sidebar-border bg-sidebar-accent/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold tracking-[0.25em] text-primary/80">GROUPS</div>
                  <div className="mt-1 text-sm text-sidebar-foreground/60">Switch context or create one</div>
                </div>
                {groupsOpen ? <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" /> : <ChevronRight className="h-4 w-4 text-sidebar-foreground/50" />}
              </div>

              <div className={cn("overflow-hidden transition-all duration-300", groupsOpen ? "mt-3 max-h-[1800px] opacity-100" : "max-h-0 opacity-0")}>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setCreateOpen((v) => !v)}>
                    <CirclePlus className="mr-1 h-4 w-4" />
                    Create
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setJoinOpen((v) => !v)}>
                    Join
                  </Button>
                </div>

                {createOpen ? (
                  <form action={createGroup} className="mt-4 space-y-3 rounded-2xl border border-border bg-background/70 p-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile-group-name" className="text-xs text-muted-foreground">
                        Group name
                      </Label>
                      <Input id="mobile-group-name" name="name" placeholder="Study Sprint" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile-group-desc" className="text-xs text-muted-foreground">
                        Description
                      </Label>
                      <textarea
                        id="mobile-group-desc"
                        name="description"
                        className="min-h-20 w-full rounded-2xl border border-border bg-background/70 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        placeholder="What is this group about?"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Group
                    </Button>
                  </form>
                ) : null}

                {joinOpen ? (
                  <form action={joinGroup} className="mt-4 space-y-3 rounded-2xl border border-border bg-background/70 p-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile-invite-code" className="text-xs text-muted-foreground">
                        Invite code
                      </Label>
                      <Input id="mobile-invite-code" name="inviteCode" placeholder="AB12CD34" className="font-mono uppercase tracking-[0.3em]" required />
                    </div>
                    <Button type="submit" className="w-full">
                      Join Group
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-3xl border border-sidebar-border bg-sidebar-accent/40 p-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-sm font-bold text-primary">
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
        ) : null}
      </div>
    </>
  );
}
