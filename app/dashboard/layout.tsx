import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, LayoutDashboard, Upload, Receipt, Wallet, Handshake, Users, LogOut } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Import CSV", href: "/dashboard/import", icon: Upload },
    { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    { name: "Balances", href: "/dashboard/balances", icon: Wallet },
    { name: "Settlements", href: "/dashboard/settlements", icon: Handshake },
    { name: "Members", href: "/dashboard/members", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3] flex flex-col md:flex-row font-sans selection:bg-[#00E5CC]/30">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#161B22] border-r border-[#30363D] flex-shrink-0 z-10 sticky top-0 md:h-screen flex flex-col">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-[#30363D]">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-md bg-[#00E5CC] flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,229,204,0.4)] transition-all">
              <Zap className="w-4 h-4 text-[#0D1117] fill-[#0D1117]" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              SplitSphere
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#30363D]/50 transition-colors group"
            >
              <item.icon className="w-4 h-4 group-hover:text-[#00E5CC] transition-colors" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Area */}
        <div className="p-4 border-t border-[#30363D]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[#30363D] flex items-center justify-center text-sm font-bold text-[#00E5CC]">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#E6EDF3] truncate">{session.user.name}</p>
              <p className="text-xs text-[#8B949E] truncate">{session.user.email}</p>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
             <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#F85149] hover:bg-[#F85149]/10 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
