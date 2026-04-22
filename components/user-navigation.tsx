"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState, useTransition } from "react";
import {
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
import { signOut, useSession } from "@/lib/auth-client";

const baseNavItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/tasks", label: "Tasks", icon: PenTool },
  { href: "/tracker", label: "Tracker", icon: Target },
  { href: "/proof-work", label: "Proof of Work", icon: ShieldCheck },
  { href: "/uploads", label: "Uploads", icon: Upload },
  { href: "/profile", label: "Profile", icon: User },
];

/* ──────────────────────────── Nav link ──────────────────────────── */

const NavLink = memo(function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 14px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        color: active ? "#D4C090" : "#A09880",
        background: active ? "rgba(196,172,120,0.10)" : "transparent",
        border: active ? "1px solid rgba(196,172,120,0.20)" : "1px solid transparent",
        boxShadow: active
          ? "0 4px 20px rgba(196,172,120,0.08), inset 0 1px 0 rgba(196,172,120,0.10)"
          : "none",
        transition: "all 0.18s ease",
        textDecoration: "none",
        position: "relative",
        whiteSpace: "nowrap",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "18%",
            height: "64%",
            width: 2.5,
            borderRadius: "0 4px 4px 0",
            background: "linear-gradient(180deg, #D4C090, #A08840)",
            boxShadow: "0 0 8px rgba(196,172,120,0.50)",
          }}
        />
      )}
      <Icon
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          color: active ? "#C4AC78" : "#6A7888",
          filter: active ? "drop-shadow(0 0 5px rgba(196,172,120,0.40))" : "none",
        }}
      />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </Link>
  );
});

/* ──────────────────────────── User footer ──────────────────────── */

type SessionData = ReturnType<typeof useSession>["data"];

const UserFooter = memo(function UserFooter({
  session,
  isLoading,
  onSignOut,
}: {
  session: SessionData;
  isLoading: boolean;
  onSignOut: () => Promise<void>;
}) {
  const userName = session?.user.name ?? (isLoading ? "Loading..." : "Account");
  const userEmail = session?.user.email ?? (isLoading ? "Checking auth..." : "Signed out");
  const userImage = session?.user.image;

  const avatarContent = userImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={userImage}
      alt={userName}
      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
    />
  ) : isLoading ? (
    "…"
  ) : (
    userName.charAt(0).toUpperCase()
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(196,172,120,0.04)",
          border: "1px solid rgba(196,172,120,0.08)",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            flexShrink: 0,
            background: "linear-gradient(135deg, #1E2D40, #886840)",
            color: "#E8E0CC",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(196,172,120,0.20), 0 2px 8px rgba(0,0,0,0.50)",
          }}
        >
          {avatarContent}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#EDE6D6",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {userName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#C4AC78",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {userEmail}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        disabled={isLoading || !session}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          fontWeight: 600,
          color: "#EDE6D6",
          background: "rgba(160,104,104,0.08)",
          border: "1px solid rgba(160,104,104,0.18)",
          borderRadius: 10,
          padding: "10px 12px",
          cursor: isLoading || !session ? "not-allowed" : "pointer",
          opacity: isLoading || !session ? 0.55 : 1,
          transition: "all 0.15s ease",
        }}
      >
        <LogOut style={{ width: 14, height: 14, color: "#C08888" }} />
        Sign out
      </button>
    </div>
  );
});

/* ──────────────────────────── Shared sidebar body ──────────────── */

function SidebarBody({
  navItems,
  isActive,
  session,
  isLoadingSession,
  onSignOut,
  onNavClick,
}: {
  navItems: { href: string; label: string; icon: LucideIcon }[];
  isActive: (href: string) => boolean;
  session: SessionData;
  isLoadingSession: boolean;
  onSignOut: () => Promise<void>;
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* Nav list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.32em",
            color: "rgba(196,172,120,0.30)",
            textTransform: "uppercase",
            padding: "0 14px 10px",
          }}
        >
          Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
            onClick={onNavClick}
          />
        ))}
      </div>

      {/* User footer */}
      <div
        style={{
          padding: "12px 10px 16px",
          borderTop: "1px solid rgba(196,172,120,0.09)",
          background: "rgba(196,172,120,0.02)",
        }}
      >
        <UserFooter session={session} isLoading={isLoadingSession} onSignOut={onSignOut} />
      </div>
    </>
  );
}

/* ──────────────────────────── Main component ───────────────────── */

export function UserNavigation({
  showLeaderPortal = false,
  showAdminPortal = false,
}: {
  showLeaderPortal?: boolean;
  showAdminPortal?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { data: session, isPending } = useSession();
  const isLoadingSession = isPending && !session;

  // Mobile sidebar open state
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Build nav items
  const navItems = baseNavItems.slice();
  if (showLeaderPortal) {
    navItems.splice(1, 0, { href: "/leader", label: "Leader Hub", icon: ShieldCheck });
  }
  if (showAdminPortal) {
    navItems.splice(1, 0, { href: "/admin", label: "Admin Panel", icon: Sparkles });
  }

  const handleSignOut = useCallback(async () => {
    await signOut();
    startTransition(() => {
      router.replace("/");
      router.refresh();
    });
  }, [router, startTransition]);

  const isActive = useCallback(
    (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href)),
    [pathname],
  );

  const activeItem = navItems.find((item) => isActive(item.href));

  /* ── sidebar header (shared between desktop and mobile slide-in) ─ */
  const sidebarHeader = (showClose: boolean) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        height: 62,
        flexShrink: 0,
        borderBottom: "1px solid rgba(196,172,120,0.09)",
        background: "rgba(196,172,120,0.02)",
      }}
    >
      <Link
        href="/dashboard"
        style={{ textDecoration: "none" }}
        onClick={showClose ? () => setOpen(false) : undefined}
      >
        <Logo size="sm" />
      </Link>

      {showClose ? (
        /* Mobile: X close button */
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 9,
            border: "1px solid rgba(196,172,120,0.16)",
            background: "rgba(196,172,120,0.06)",
            color: "#C4AC78",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      ) : (
        /* Desktop: pulse dot */
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#C4AC78",
            boxShadow: "0 0 6px rgba(196,172,120,0.60)",
            animation: "g-pulse-dot 2s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );

  return (
    <>
      {/* ════════════════════════════════════════════════
          DESKTOP SIDEBAR  (lg and above = 1024px+)
          Fixed, always visible, 232px wide
      ════════════════════════════════════════════════ */}
      <aside
        style={{
          width: 232,
          minWidth: 232,
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          display: "flex",
          flexDirection: "column",
          background: "rgba(14,20,30,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(196,172,120,0.09)",
          zIndex: 40,
          boxShadow: "2px 0 32px rgba(0,0,0,0.50), inset -1px 0 0 rgba(196,172,120,0.05)",
        }}
        className="hidden lg:flex lg:flex-col"
      >
        {sidebarHeader(false)}
        <SidebarBody
          navItems={navItems}
          isActive={isActive}
          session={session}
          isLoadingSession={isLoadingSession}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ════════════════════════════════════════════════
          MOBILE / TABLET TOPBAR  (below lg = <1024px)
          Sticky top bar with Logo + page name + hamburger
      ════════════════════════════════════════════════ */}
      <div
        style={{
          borderBottom: "1px solid rgba(196,172,120,0.09)",
          background: "rgba(13,17,24,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "0 16px",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
        className="lg:hidden"
      >
        <Link href="/dashboard" style={{ textDecoration: "none", flexShrink: 0 }}>
          <Logo size="sm" />
        </Link>

        <span
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: "rgba(196,172,120,0.55)",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {activeItem?.label ?? "Workspace"}
        </span>

        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "1px solid rgba(196,172,120,0.18)",
            background: "rgba(196,172,120,0.07)",
            color: "#C4AC78",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
        >
          <Menu style={{ width: 19, height: 19 }} />
        </button>
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE SLIDE-IN SIDEBAR OVERLAY
      ════════════════════════════════════════════════ */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200 }}
          className="lg:hidden"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.70)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "none",
              cursor: "pointer",
              width: "100%",
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "min(300px, 85vw)",
              display: "flex",
              flexDirection: "column",
              background: "rgba(13,18,28,0.98)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderRight: "1px solid rgba(196,172,120,0.14)",
              boxShadow: "8px 0 48px rgba(0,0,0,0.70)",
              animation: "g-slide-in-left 0.22s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {sidebarHeader(true)}
            <SidebarBody
              navItems={navItems}
              isActive={isActive}
              session={session}
              isLoadingSession={isLoadingSession}
              onSignOut={handleSignOut}
              onNavClick={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
