import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGroupData, seedGroupAndUsers } from "@/app/actions";
import { Users, Calendar } from "lucide-react";

export default async function MembersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const seedResult = await seedGroupAndUsers();
  if (!seedResult.success || !seedResult.groupId) return <div>Error loading group</div>;

  const { group } = await getGroupData(seedResult.groupId) as any;
  const members = group?.members || [];

  return (
    <div className="max-w-[1000px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Members
        </h1>
        <p className="text-sm text-[#8B949E]">
          People in the {group?.name} group and their active periods.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m: any) => {
          const isActive = !m.leftAt;
          
          return (
            <div key={m.id} className="p-5 rounded-xl bg-[#161B22] border border-[#30363D]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#30363D] flex items-center justify-center text-[#E6EDF3] font-bold">
                  {m.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#E6EDF3]">{m.user.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#3FB950]' : 'bg-[#8B949E]'}`}></span>
                    <span className="text-[11px] font-medium text-[#8B949E] uppercase tracking-wider">
                      {isActive ? 'Active' : 'Departed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-[#30363D] pt-4 mt-2">
                <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                  <Calendar className="w-4 h-4" />
                  <span>Joined: <span className="text-[#E6EDF3]" style={{ fontFamily: "var(--font-mono)" }}>{new Date(m.joinedAt).toISOString().split('T')[0]}</span></span>
                </div>
                {m.leftAt && (
                  <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                    <Calendar className="w-4 h-4" />
                    <span>Left: <span className="text-[#E6EDF3]" style={{ fontFamily: "var(--font-mono)" }}>{new Date(m.leftAt).toISOString().split('T')[0]}</span></span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
