import { UserNavigation } from "@/components/user-navigation";
import { requireSession, getWorkspace } from "@/lib/workspace";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const { memberships, activeGroupId } = await getWorkspace(session.user.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(45,53,64,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(45,53,64,0.55) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-[45vh] w-[80vw] -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 z-0 h-[28rem] w-[28rem] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        <UserNavigation
          userName={session.user.name}
          userEmail={session.user.email}
          userImage={session.user.image}
          memberships={memberships}
          activeGroupId={activeGroupId}
        />

        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
