import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { UserNavigation } from "@/components/user-navigation";
import { getSidebarAccess } from "@/lib/access";

async function SidebarServer() {
  const access = await getSidebarAccess();
  return (
    <UserNavigation
      showLeaderPortal={access.isLeader}
      showAdminPortal={access.isAdmin}
    />
  );
}

async function BottomNavServer() {
  const access = await getSidebarAccess();
  const extraItems = [
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/proof-work", label: "Proof of Work" },
    { href: "/uploads", label: "Uploads" },
    { href: "/profile", label: "Profile" },
    ...(access.isLeader ? [{ href: "/leader", label: "Leader portal" }] : []),
    ...(access.isAdmin ? [{ href: "/admin", label: "Admin portal" }] : []),
  ];

  return <BottomNav extraItems={extraItems} />;
}

const sidebarFallback = (
  <aside
    className="hidden lg:block"
    style={{
      width: 232,
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 40,
      background: "rgba(14,20,30,0.88)",
      borderRight: "1px solid rgba(196,172,120,0.09)",
    }}
  />
);

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground lg:h-screen">
      {/* Grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,255,178,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,255,178,0.08) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />

      {/* Sidebar streams in independently — does not block main content */}
      <Suspense fallback={sidebarFallback}>
        <SidebarServer />
      </Suspense>

      {/* Main content — offset by sidebar width only on lg+ */}
      <main
        className="relative z-10 min-h-0 flex-1 overflow-hidden lg:ml-[232px]"
        style={{ willChange: "transform" }}
      >
        <div className="h-full overflow-y-auto p-4 pb-24 md:p-6 md:pb-24 lg:p-8 lg:pb-6">
          {children}
        </div>
      </main>

      <Suspense fallback={null}>
        <BottomNavServer />
      </Suspense>
    </div>
  );
}
