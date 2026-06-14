import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGroupData, seedGroupAndUsers } from "@/app/actions";
import Link from "next/link";
import { Receipt, Users, AlertTriangle, Handshake } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  // Ensure flatmates group exists and is seeded
  const seedResult = await seedGroupAndUsers();
  if (!seedResult.success || !seedResult.groupId) {
    return <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">Error loading group data</div>;
  }

  const { group, balances, anomalyLogs, settlements } = await getGroupData(seedResult.groupId) as any;

  if (!group) return <div className="p-4">Group not found</div>;

  const totalExpenses = group.expenses?.length || 0;
  const totalMembers = group.members?.length || 0;
  const totalAnomalies = anomalyLogs?.length || 0;
  const pendingSettlements = settlements?.length || 0;

  const recentExpenses = group.expenses?.slice(-10).reverse() || [];

  return (
    <div className="max-w-[1000px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Welcome back, {session.user.name}
        </h1>
        <p className="text-sm text-[#8B949E]">
          Here is an overview of the {group.name} shared expenses.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Receipt} label="Total Expenses" value={totalExpenses} color="#00E5CC" />
        <StatCard icon={Users} label="Members" value={totalMembers} color="#E6EDF3" />
        <StatCard icon={AlertTriangle} label="Anomalies Found" value={totalAnomalies} color="#F85149" />
        <StatCard icon={Handshake} label="Settlements" value={pendingSettlements} color="#E3B341" />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link href="/dashboard/import" className="px-4 py-2 rounded-lg bg-[#00E5CC] text-[#0D1117] text-sm font-bold hover:bg-[#00D4BD] transition-colors">
          Import CSV
        </Link>
        <Link href="/dashboard/expenses" className="px-4 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-sm font-semibold hover:border-[#8B949E] transition-colors">
          View All Expenses
        </Link>
        <Link href="/dashboard/balances" className="px-4 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-sm font-semibold hover:border-[#8B949E] transition-colors">
          Check Balances
        </Link>
      </div>

      {/* Recent Expenses */}
      <div className="rounded-xl border border-[#30363D] bg-[#161B22] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#30363D] flex items-center justify-between">
          <h2 className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>Recent Expenses</h2>
          <Link href="/dashboard/expenses" className="text-xs text-[#00E5CC] hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0D1117] text-[#8B949E] text-xs font-semibold">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Paid By</th>
                <th className="px-5 py-3 text-right">Amount (Base)</th>
                <th className="px-5 py-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]">
              {recentExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#8B949E] text-sm">
                    No expenses yet. Import a CSV to get started.
                  </td>
                </tr>
              ) : (
                recentExpenses.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-[#0D1117]/50 transition-colors">
                    <td className="px-5 py-3 text-[#8B949E]" style={{ fontFamily: "var(--font-mono)" }}>
                      {new Date(expense.date).toISOString().split('T')[0]}
                    </td>
                    <td className="px-5 py-3 font-medium text-[#E6EDF3]">{expense.description}</td>
                    <td className="px-5 py-3">{expense.paidBy?.name}</td>
                    <td className="px-5 py-3 text-right font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                      ₹{expense.amountInBase.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 rounded-md bg-[#30363D] text-xs text-[#E6EDF3]">
                        {expense.splitType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="p-5 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold leading-none text-[#E6EDF3]" style={{ fontFamily: "var(--font-mono)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}
