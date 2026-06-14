import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGroupData, seedGroupAndUsers } from "@/app/actions";
import Link from "next/link";
import { Receipt } from "lucide-react";

export default async function ExpensesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const seedResult = await seedGroupAndUsers();
  if (!seedResult.success || !seedResult.groupId) return <div>Error loading group</div>;

  const { group } = await getGroupData(seedResult.groupId) as any;
  const expenses = group?.expenses || [];

  return (
    <div className="max-w-[1000px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Expenses
          </h1>
          <p className="text-sm text-[#8B949E]">
            All logged expenses for {group?.name}.
          </p>
        </div>
        <Link href="/dashboard/import" className="px-4 py-2 rounded-lg bg-[#00E5CC] text-[#0D1117] text-sm font-bold hover:bg-[#00D4BD] transition-colors self-start sm:self-auto flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Add Expense (via Import)
        </Link>
      </div>

      <div className="rounded-xl border border-[#30363D] bg-[#161B22] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0D1117] text-[#8B949E] text-xs font-semibold">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Paid By</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Base (INR)</th>
                <th className="px-5 py-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#8B949E]">
                    No expenses found. Import your CSV to get started.
                  </td>
                </tr>
              ) : (
                expenses.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-[#0D1117]/50 transition-colors">
                    <td className="px-5 py-3 text-[#8B949E]" style={{ fontFamily: "var(--font-mono)" }}>
                      {new Date(expense.date).toISOString().split('T')[0]}
                    </td>
                    <td className="px-5 py-3 font-medium text-[#E6EDF3] max-w-[200px] truncate" title={expense.description}>
                      {expense.description}
                    </td>
                    <td className="px-5 py-3">{expense.paidBy?.name}</td>
                    <td className="px-5 py-3 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {expense.currency === 'USD' ? '$' : '₹'}{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                      ₹{expense.amountInBase.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 rounded-md bg-[#30363D] text-[11px] font-medium text-[#E6EDF3] uppercase tracking-wider">
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
