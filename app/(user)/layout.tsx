import { Suspense } from "react";

import { UserNavigation } from "@/components/user-navigation";
import { requirePortalSession } from "@/lib/access";

async function NavigationServer() {
  const { access } = await requirePortalSession();

  return (
    <UserNavigation
      activeGroupId={access.activeGroupId}
      groups={access.memberships.map((membership) => ({
        id: membership.group.id,
        name: membership.group.name,
        role: membership.role,
      }))}
      showLeaderPortal={access.isLeader}
      showAdminPortal={access.isAdmin}
    />
  );
}

const navigationFallback = (
  <aside className="fixed inset-y-0 left-0 hidden w-[280px] border-r border-primary/10 bg-[rgba(11,16,24,0.92)] lg:block" />
);

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,255,178,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,255,178,0.08) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />

      <Suspense fallback={navigationFallback}>
        <NavigationServer />
      </Suspense>

      <main className="relative z-10 min-h-screen lg:ml-[280px]">
        <div className="min-h-screen px-4 pb-10 pt-20 md:px-6 lg:px-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
