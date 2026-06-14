import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGroupData, seedGroupAndUsers } from "@/app/actions";
import { Handshake } from "lucide-react";

export default async function SettlementsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const seedResult = await seedGroupAndUsers();
  if (!seedResult.success || !seedResult.groupId) return <div>Error loading group</div>;

  const { settlements, simplifiedDebts } = await getGroupData(seedResult.groupId) as any;

  return (
    <div className="max-w-[1000px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Settlements
        </h1>
        <p className="text-sm text-[#8B949E]">
          Record of payments made between members to settle balances.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Settlements Table */}
        <div className="md:col-span-2 rounded-xl border border-[#30363D] bg-[#161B22] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#30363D] flex items-center gap-2">
            <Handshake className="w-4 h-4 text-[#00E5CC]" />
            <h2 className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0D1117] text-[#8B949E] text-xs font-semibold">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">From</th>
                  <th className="px-5 py-3">To</th>
                  <th className="px-5 py-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363D]">
                {!settlements || settlements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[#8B949E]">
                      No settlements recorded yet.
                    </td>
                  </tr>
                ) : (
                  settlements.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#0D1117]/50 transition-colors">
                      <td className="px-5 py-3 text-[#8B949E]" style={{ fontFamily: "var(--font-mono)" }}>
                        {new Date(s.date).toISOString().split('T')[0]}
                      </td>
                      <td className="px-5 py-3 font-medium text-[#F85149]">{s.payer.name}</td>
                      <td className="px-5 py-3 font-medium text-[#3FB950]">{s.receiver.name}</td>
                      <td className="px-5 py-3 text-right font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                        ₹{s.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simplified Debts / Recommended Settlements */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#E3B341]/30 bg-[#E3B341]/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E3B341]/20">
              <h2 className="text-sm font-bold text-[#E3B341]" style={{ fontFamily: "var(--font-display)" }}>Suggested Payments</h2>
              <p className="text-xs text-[#E3B341]/70 mt-1">To settle all current balances</p>
            </div>
            <div className="p-4 space-y-3">
              {!simplifiedDebts || simplifiedDebts.length === 0 ? (
                <p className="text-sm text-[#8B949E] text-center">Everyone is settled up!</p>
              ) : (
                simplifiedDebts.map((debt: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0D1117] border border-[#30363D]">
                    <div className="text-sm">
                      <span className="font-semibold text-[#F85149]">{debt.from}</span>
                      <span className="text-[#8B949E] mx-1">owes</span>
                      <span className="font-semibold text-[#3FB950]">{debt.to}</span>
                    </div>
                    <div className="font-bold text-[#E6EDF3]" style={{ fontFamily: "var(--font-mono)" }}>
                      ₹{debt.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
