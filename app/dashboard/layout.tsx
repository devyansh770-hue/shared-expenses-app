import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, Users, Settings, LogOut, Zap, LayoutDashboard, Receipt } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#121824]/50 hidden md:flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f2fe] to-[#4facfe] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.3)]">
              <Zap className="w-4 h-4 text-black fill-black" />
            </div>
            <span className="font-bold font-heading tracking-tight text-lg">SplitSphere</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 text-[#00f2fe] font-medium border border-white/10">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/dashboard/groups" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium">
            <Users className="w-5 h-5" />
            Groups
          </Link>
          <Link href="/dashboard/activity" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium">
            <Receipt className="w-5 h-5" />
            Recent Activity
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9c27b0] to-[#f43f5e] flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(156,39,176,0.3)]">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
            </div>
          </div>
          
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          
          <form action="/api/auth/signout" method="POST">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors text-sm mt-1">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 md:hidden border-b border-white/5 bg-[#121824]/50 flex items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00f2fe] fill-[#00f2fe]" />
            <span className="font-bold font-heading">SplitSphere</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9c27b0] to-[#f43f5e] flex items-center justify-center text-sm font-bold">
            {session.user.name.charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#0a0d14]">
          <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
