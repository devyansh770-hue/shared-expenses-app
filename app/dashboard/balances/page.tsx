import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGroupData, seedGroupAndUsers } from "@/app/actions";
import { Wallet } from "lucide-react";

export default async function BalancesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const seedResult = await seedGroupAndUsers();
  if (!seedResult.success || !seedResult.groupId) return <div>Error loading group</div>;

  const { balances } = await getGroupData(seedResult.groupId) as any;

  return (
    <div className="max-w-[1000px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Balances
        </h1>
        <p className="text-sm text-[#8B949E]">
          Current balance for each member. Positive means they are owed money, negative means they owe money.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(balances || {}).map(([name, amount]: [string, any]) => {
          const isPositive = amount > 0;
          const isNegative = amount < 0;
          const isZero = amount === 0;

          let colorStr = "#E6EDF3";
          let bgStr = "#161B22";
          let borderStr = "#30363D";
          let label = "Settled Up";

          if (isPositive) {
            colorStr = "#3FB950";
            bgStr = "rgba(63, 185, 80, 0.05)";
            borderStr = "rgba(63, 185, 80, 0.2)";
            label = "Gets Back";
          } else if (isNegative) {
            colorStr = "#F85149";
            bgStr = "rgba(248, 81, 73, 0.05)";
            borderStr = "rgba(248, 81, 73, 0.2)";
            label = "Owes";
          }

          return (
            <div key={name} className="p-5 rounded-xl border flex flex-col" style={{ backgroundColor: bgStr, borderColor: borderStr }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#E6EDF3]">{name}</h3>
                <Wallet className="w-4 h-4" style={{ color: colorStr }} />
              </div>
              <div className="mt-auto">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: colorStr }}>{label}</p>
                <p className="text-2xl font-bold leading-none" style={{ fontFamily: "var(--font-mono)", color: colorStr }}>
                  ₹{Math.abs(amount).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
