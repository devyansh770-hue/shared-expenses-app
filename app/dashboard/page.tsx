import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ArrowUpRight, ArrowDownRight, Wallet, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Welcome back, {session.user.name.split(' ')[0]}!</h1>
        <p className="text-slate-400">Here's a summary of your shared expenses and balances.</p>
      </div>

      {/* Balances Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121824]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#00f2fe]/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#00f2fe]" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Balance</p>
              <h2 className="text-2xl font-bold font-heading">₹ 0.00</h2>
            </div>
          </div>
          <div className="text-sm text-slate-500">You are completely settled up.</div>
        </div>

        <div className="bg-[#121824]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl group-hover:bg-[#10b981]/10 transition-colors" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-[#10b981]" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">You are owed</p>
              <h2 className="text-2xl font-bold font-heading text-[#34d399]">₹ 0.00</h2>
            </div>
          </div>
        </div>

        <div className="bg-[#121824]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f43f5e]/5 rounded-full blur-2xl group-hover:bg-[#f43f5e]/10 transition-colors" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#f43f5e]/10 flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-[#f43f5e]" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">You owe</p>
              <h2 className="text-2xl font-bold font-heading text-[#f87171]">₹ 0.00</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#121824]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#9c27b0]" />
            Recent Activity
          </h2>
        </div>
        
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <Activity className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No activity yet</h3>
          <p className="text-slate-400 max-w-sm">
            Join a group or add an expense to get started. Your recent activity will show up here.
          </p>
        </div>
      </div>
    </div>
  );
}
