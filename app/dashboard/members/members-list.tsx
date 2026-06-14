"use client";

import { useState, useTransition } from "react";
import { Calendar, Edit2, X, Check, Loader2 } from "lucide-react";
import { updateMemberMembership } from "@/app/actions";

interface MemberListProps {
  initialMembers: any[];
  groupId: string;
}

const YEARS = [2024, 2025, 2026, 2027, 2028];
const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function MembersList({ initialMembers, groupId }: MemberListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Date states as numbers to avoid parsing/timezone issues
  const [joinedYear, setJoinedYear] = useState(2026);
  const [joinedMonth, setJoinedMonth] = useState(2);
  const [joinedDay, setJoinedDay] = useState(1);

  const [leftYear, setLeftYear] = useState(2026);
  const [leftMonth, setLeftMonth] = useState(3);
  const [leftDay, setLeftDay] = useState(31);

  const [stillActive, setStillActive] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const startEditing = (m: any) => {
    setEditingId(m.id);
    const jDate = new Date(m.joinedAt);
    setJoinedYear(jDate.getUTCFullYear());
    setJoinedMonth(jDate.getUTCMonth() + 1);
    setJoinedDay(jDate.getUTCDate());

    if (m.leftAt) {
      const lDate = new Date(m.leftAt);
      setLeftYear(lDate.getUTCFullYear());
      setLeftMonth(lDate.getUTCMonth() + 1);
      setLeftDay(lDate.getUTCDate());
      setStillActive(false);
    } else {
      setLeftYear(2026);
      setLeftMonth(3);
      setLeftDay(31);
      setStillActive(true);
    }
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setError(null);
  };

  const isValidDate = (y: number, m: number, d: number) => {
    const date = new Date(Date.UTC(y, m - 1, d));
    return (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d
    );
  };

  const handleSave = async (userId: string) => {
    setError(null);

    // Validate Join Date
    if (!isValidDate(joinedYear, joinedMonth, joinedDay)) {
      setError(`Invalid Joined Date selected (e.g. check the number of days in that month).`);
      return;
    }

    // Validate Left Date
    if (!stillActive) {
      if (!isValidDate(leftYear, leftMonth, leftDay)) {
        setError(`Invalid Departure Date selected (e.g. check the number of days in that month).`);
        return;
      }

      const joinTime = Date.UTC(joinedYear, joinedMonth - 1, joinedDay);
      const leftTime = Date.UTC(leftYear, leftMonth - 1, leftDay);
      if (leftTime < joinTime) {
        setError("Departure date cannot be before the join date.");
        return;
      }
    }

    const joinedDateStr = `${joinedYear}-${String(joinedMonth).padStart(2, "0")}-${String(
      joinedDay
    ).padStart(2, "0")}`;
    
    const leftDateStr = `${leftYear}-${String(leftMonth).padStart(2, "0")}-${String(
      leftDay
    ).padStart(2, "0")}`;

    startTransition(async () => {
      const result = await updateMemberMembership(
        groupId,
        userId,
        joinedDateStr,
        stillActive ? null : leftDateStr
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
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/35 text-red-500 rounded-lg text-sm transition-all">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialMembers.map((m: any) => {
          const isEditing = editingId === m.id;

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
                  {/* Joined Date Dropdowns */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-widest mb-1.5">
                      Joined Date
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={joinedDay}
                        onChange={(e) => setJoinedDay(Number(e.target.value))}
                        disabled={isPending}
                        className="px-2 py-1.5 text-xs rounded-lg border border-[#30363D] bg-[#0D1117] text-[#E6EDF3] focus:border-[#00E5CC] focus:outline-none transition-colors cursor-pointer"
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <select
                        value={joinedMonth}
                        onChange={(e) => setJoinedMonth(Number(e.target.value))}
                        disabled={isPending}
                        className="px-2 py-1.5 text-xs rounded-lg border border-[#30363D] bg-[#0D1117] text-[#E6EDF3] focus:border-[#00E5CC] focus:outline-none transition-colors cursor-pointer"
                      >
                        {MONTHS.map((mon) => (
                          <option key={mon.value} value={mon.value}>
                            {mon.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={joinedYear}
                        onChange={(e) => setJoinedYear(Number(e.target.value))}
                        disabled={isPending}
                        className="px-2 py-1.5 text-xs rounded-lg border border-[#30363D] bg-[#0D1117] text-[#E6EDF3] focus:border-[#00E5CC] focus:outline-none transition-colors cursor-pointer"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active Toggle & Departure Date */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id={`active-${m.id}`}
                        checked={stillActive}
                        onChange={(e) => setStillActive(e.target.checked)}
                        disabled={isPending}
                        className="rounded border-[#30363D] bg-[#0D1117] text-[#00E5CC] focus:ring-[#00E5CC] h-4 w-4 cursor-pointer"
                      />
                      <label
                        htmlFor={`active-${m.id}`}
                        className="text-[10px] font-bold text-[#8B949E] uppercase tracking-widest cursor-pointer select-none"
                      >
                        Still Active Member
                      </label>
                    </div>

                    {!stillActive && (
                      <div className="animate-fade-in-down">
                        <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-widest mb-1.5">
                          Departure Date
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={leftDay}
                            onChange={(e) => setLeftDay(Number(e.target.value))}
                            disabled={isPending}
                            className="px-2 py-1.5 text-xs rounded-lg border border-[#30363D] bg-[#0D1117] text-[#E6EDF3] focus:border-[#00E5CC] focus:outline-none transition-colors cursor-pointer"
                          >
                            {DAYS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>

                          <select
                            value={leftMonth}
                            onChange={(e) => setLeftMonth(Number(e.target.value))}
                            disabled={isPending}
                            className="px-2 py-1.5 text-xs rounded-lg border border-[#30363D] bg-[#0D1117] text-[#E6EDF3] focus:border-[#00E5CC] focus:outline-none transition-colors cursor-pointer"
                          >
                            {MONTHS.map((mon) => (
                              <option key={mon.value} value={mon.value}>
                                {mon.label}
                              </option>
                            ))}
                          </select>

                          <select
                            value={leftYear}
                            onChange={(e) => setLeftYear(Number(e.target.value))}
                            disabled={isPending}
                            className="px-2 py-1.5 text-xs rounded-lg border border-[#30363D] bg-[#0D1117] text-[#E6EDF3] focus:border-[#00E5CC] focus:outline-none transition-colors cursor-pointer"
                          >
                            {YEARS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
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
