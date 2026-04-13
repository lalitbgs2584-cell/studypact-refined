import Link from "next/link";
import { Brain, LayoutDashboard, Users, Settings, LogOut } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2 text-white font-bold tracking-wider">
            <Brain className="w-6 h-6 text-primary" />
            <span>STUDYPACT</span>
          </Link>
        </div>
        
        <div className="p-4 flex-1">
          <div className="text-xs font-semibold text-white/40 tracking-wider mb-4 mt-4 px-2">MENU</div>
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/groups" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all">
              <Users className="w-5 h-5" />
              <span className="font-medium">My Pacts</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <div className="text-sm font-medium text-white">{session.user.name}</div>
              <div className="text-xs text-white/50 truncate">{session.user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm z-10 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 text-white font-bold tracking-wider">
            <Brain className="w-6 h-6 text-primary" />
            <span>STUDYPACT</span>
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto p-6 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
