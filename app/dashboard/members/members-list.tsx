"use client";

import { useState, useTransition } from "react";
import { Calendar, Edit2, X, Check, Loader2 } from "lucide-react";
import { updateMemberMembership } from "@/app/actions";

interface MemberListProps {
  initialMembers: any[];
  groupId: string;
}

export default function MembersList({ initialMembers, groupId }: MemberListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState("");
  const [leftAt, setLeftAt] = useState("");
  const [stillActive, setStillActive] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const startEditing = (m: any) => {
    setEditingId(m.id);
    setJoinedAt(new Date(m.joinedAt).toISOString().split("T")[0]);
    if (m.leftAt) {
      setLeftAt(new Date(m.leftAt).toISOString().split("T")[0]);
      setStillActive(false);
    } else {
      setLeftAt("");
      setStillActive(true);
    }
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setError(null);
  };

  const handleSave = async (userId: string) => {
    setError(null);
    if (!joinedAt) {
      setError("Joined date is required.");
      return;
    }
    if (!stillActive && !leftAt) {
      setError("Departure date is required if not active.");
      return;
    }
    if (!stillActive && new Date(leftAt) < new Date(joinedAt)) {
      setError("Departure date cannot be before join date.");
      return;
    }

    startTransition(async () => {
      const result = await updateMemberMembership(
        groupId,
        userId,
        joinedAt,
        stillActive ? null : leftAt
      );

      if (result.success) {
        setEditingId(null);
      } else {
        setError(result.error || "Failed to update membership dates.");
      }
    });
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialMembers.map((m: any) => {
          const isEditing = editingId === m.id;
          const isActive = !m.leftAt;

          return (
            <div
              key={m.id}
              className={`p-5 rounded-xl border transition-all ${
                isEditing
                  ? "border-[#00E5CC] bg-[#161B22] shadow-[0_0_15px_rgba(0,229,204,0.15)]"
                  : "bg-[#161B22] border-[#30363D]"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#30363D] flex items-center justify-center text-[#E6EDF3] font-bold">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#E6EDF3]">{m.user.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          m.leftAt ? "bg-[#8B949E]" : "bg-[#3FB950]"
                        }`}
                      ></span>
                      <span className="text-[11px] font-medium text-[#8B949E] uppercase tracking-wider">
                        {m.leftAt ? "Departed" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => startEditing(m)}
                    className="p-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-[#00E5CC] hover:border-[#00E5CC] transition-all cursor-pointer"
                    title="Edit active dates"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4 border-t border-[#30363D] pt-4 mt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-1.5">
                      Joined Date
                    </label>
                    <input
                      type="date"
                      value={joinedAt}
                      onChange={(e) => setJoinedAt(e.target.value)}
                      disabled={isPending}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-[#30363D] bg-[#0D1117] text-[#E6EDF3] focus:border-[#00E5CC] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id={`active-${m.id}`}
                        checked={stillActive}
                        onChange={(e) => setStillActive(e.target.checked)}
                        disabled={isPending}
                        className="rounded border-[#30363D] bg-[#0D1117] text-[#00E5CC] focus:ring-[#00E5CC] h-4 w-4"
                      />
                      <label
                        htmlFor={`active-${m.id}`}
                        className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider cursor-pointer"
                      >
                        Still Active Member
                      </label>
                    </div>

                    {!stillActive && (
                      <div className="animate-fade-in-down">
                        <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-1.5">
                          Departure Date
                        </label>
                        <input
                          type="date"
                          value={leftAt}
                          onChange={(e) => setLeftAt(e.target.value)}
                          disabled={isPending}
                          className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-[#30363D] bg-[#0D1117] text-[#E6EDF3] focus:border-[#00E5CC] focus:outline-none transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-[#30363D]">
                    <button
                      onClick={cancelEditing}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg border border-[#30363D] text-xs font-semibold text-[#8B949E] hover:text-[#E6EDF3] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(m.userId)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg bg-[#00E5CC] text-[#0D1117] text-xs font-bold hover:bg-[#00D4BD] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 border-t border-[#30363D] pt-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined:{" "}
                      <span
                        className="text-[#E6EDF3]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {new Date(m.joinedAt).toISOString().split("T")[0]}
                      </span>
                    </span>
                  </div>
                  {m.leftAt && (
                    <div className="flex items-center gap-2 text-sm text-[#8B949E]">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Left:{" "}
                        <span
                          className="text-[#E6EDF3]"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {new Date(m.leftAt).toISOString().split("T")[0]}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
