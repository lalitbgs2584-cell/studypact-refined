import { Suspense } from "react";
import { UserNavigation } from "@/components/user-navigation";
import { requirePortalSession } from "@/lib/access";

async function SidebarServer() {
  const { access } = await requirePortalSession();
  return (
    <UserNavigation
      showLeaderPortal={access.isLeader}
      showAdminPortal={access.isAdmin}
    />
  );
}

const sidebarFallback = (
  <aside
    className="hidden md:block"
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
    <div className="h-screen overflow-hidden bg-background text-foreground">
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

      {/* Main content — renders immediately, offset by sidebar width on md+ */}
      <main
        className="relative z-10 h-full overflow-hidden md:ml-[232px]"
        style={{ willChange: "transform" }}
      >
        <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
