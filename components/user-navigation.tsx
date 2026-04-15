"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, PenTool, ShieldCheck, Sparkles, Trophy, Upload, Users, X, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";

type UserNavigationProps = {
  userName: string;
  userEmail: string;
  userImage?: string | null;
};

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard",  icon: Trophy },
  { href: "/groups",      label: "Groups",        icon: Users },
  { href: "/tasks",       label: "Tasks",         icon: PenTool },
  { href: "/proof-work",  label: "Proof of Work", icon: ShieldCheck },
  { href: "/uploads",     label: "Uploads",       icon: Upload },
  { href: "/assignments", label: "Assignments",   icon: Sparkles },
  { href: "/profile",     label: "Profile",       icon: Users },
];

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 11,
      padding: "9px 12px", borderRadius: 12,
      fontSize: 13.5, fontWeight: active ? 600 : 500,
      color: active ? "#D4C090" : "#A09880",
      background: active ? "rgba(196,172,120,0.08)" : "transparent",
      border: active ? "1px solid rgba(196,172,120,0.18)" : "1px solid transparent",
      boxShadow: active ? "0 4px 20px rgba(196,172,120,0.07), inset 0 1px 0 rgba(196,172,120,0.08)" : "none",
      backdropFilter: active ? "blur(8px)" : "none",
      transition: "all 0.2s ease",
      textDecoration: "none",
      position: "relative",
      whiteSpace: "nowrap",
    }}>
      {active && (
        <span style={{
          position: "absolute", left: 0, top: "18%", height: "64%", width: 2,
          borderRadius: "0 4px 4px 0",
          background: "linear-gradient(180deg, #D4C090, #A08840)",
          boxShadow: "0 0 8px rgba(196,172,120,0.45)",
        }} />
      )}
      <Icon style={{
        width: 17, height: 17, flexShrink: 0,
        color: active ? "#C4AC78" : "#6A7888",
        filter: active ? "drop-shadow(0 0 5px rgba(196,172,120,0.40))" : "none",
      }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
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

  const avatarContent = userImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={userImage} alt={userName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
  ) : (
    userName.charAt(0).toUpperCase()
  );

  const UserFooter = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #1E2D40, #886840)",
        color: "#E8E0CC", fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(196,172,120,0.18), 0 2px 8px rgba(0,0,0,0.50)",
      }}>
        {avatarContent}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#EDE6D6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
        <div style={{ fontSize: 10.5, color: "#C4AC78", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: 232, minWidth: 232, height: "100vh",
        position: "sticky", top: 0,
        display: "flex", flexDirection: "column",
        background: "rgba(14,20,30,0.88)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(196,172,120,0.09)",
        flexShrink: 0, zIndex: 40,
        boxShadow: "2px 0 32px rgba(0,0,0,0.50), inset -1px 0 0 rgba(196,172,120,0.05)",
      }} className="hidden md:flex">
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", height: 62,
          borderBottom: "1px solid rgba(196,172,120,0.09)",
          background: "rgba(196,172,120,0.02)",
        }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <Logo size="sm" />
          </Link>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#C4AC78", boxShadow: "0 0 6px rgba(196,172,120,0.60)",
            animation: "g-pulse-dot 2s ease-in-out infinite",
          }} />
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", color: "rgba(196,172,120,0.35)", textTransform: "uppercase", padding: "4px 12px 8px" }}>
            Navigation
          </div>
          {navItems.map((item) => <NavLink key={item.href} {...item} />)}
        </div>

        {/* User footer */}
        <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(196,172,120,0.09)", background: "rgba(196,172,120,0.02)" }}>
          <UserFooter />
        </div>
      </aside>

      {/* Mobile topbar */}
      <div style={{
        borderBottom: "1px solid rgba(196,172,120,0.09)",
        background: "rgba(13,17,24,0.90)", backdropFilter: "blur(24px)",
        padding: "12px 16px",
      }} className="md:hidden">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(196,172,120,0.06)", border: "1px solid rgba(196,172,120,0.14)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#A09880",
            }}
          >
            {mobileOpen ? <X style={{ width: 16, height: 16 }} /> : <Menu style={{ width: 16, height: 16 }} />}
          </button>
        </div>

        {mobileOpen && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map((item) => <NavLink key={item.href} {...item} />)}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid rgba(196,172,120,0.09)" }}>
              <UserFooter />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
