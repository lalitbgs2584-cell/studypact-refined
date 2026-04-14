import { UserNavigation } from "@/components/user-navigation";
import { requireSession } from "@/lib/workspace";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,255,178,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,255,178,0.08) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        <UserNavigation
          userName={session.user.name}
          userEmail={session.user.email}
          userImage={session.user.image}
        />

        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
