import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getGroupData, seedGroupAndUsers } from "@/app/actions";
import MembersList from "./members-list";

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

      <MembersList initialMembers={members} groupId={seedResult.groupId} />
    </div>
  );
}
