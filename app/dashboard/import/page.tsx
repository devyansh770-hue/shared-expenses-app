"use client";

import { useState, useCallback } from "react";
import { processCSV, type ParseResult, type Anomaly, type ParsedExpense } from "@/lib/csv-parser";
import { importResolvedData, seedGroupAndUsers, readWorkspaceCSV } from "@/app/actions";
import { useRouter } from "next/navigation";

/* ──────────────────────────────────────────────────
   Import Wizard — 4 Steps
   1. Upload CSV
   2. Review Anomalies
   3. Confirm Data
   4. Import Report
   ────────────────────────────────────────────────── */

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [error, setError] = useState("");
  const [usdRate, setUsdRate] = useState(83);

  // ── Step 1: File Upload ──
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  }, []);

  const handleLoadFromServer = useCallback(async () => {
    const result = await readWorkspaceCSV();
    if (result.success && result.content) {
      setCsvText(result.content);
      setFileName("expenses export.csv (from server)");
    } else {
      setError("Could not load CSV from server.");
    }
  }, []);

  const handleParseCSV = useCallback(() => {
    if (!csvText) return;
    setError("");
    try {
      const result = processCSV(csvText, usdRate);
      setParseResult(result);
      setStep(2);
    } catch (err: any) {
      setError(`Parse error: ${err.message}`);
    }
  }, [csvText, usdRate]);

  // ── Step 3: Import ──
  const handleImport = useCallback(async () => {
    if (!parseResult) return;
    setImporting(true);
    setError("");

    try {
      const seedResult = await seedGroupAndUsers();
      if (!seedResult.success || !seedResult.groupId) {
        throw new Error("Failed to seed group: " + seedResult.error);
      }
      const groupId = seedResult.groupId;

      const resolvedExpenses = parseResult.expenses
        .filter(e => !e.skipped)
        .map(e => ({
          description: e.description,
          paidBy: e.paidBy,
          amount: e.amount,
          currency: e.currency,
          exchangeRate: e.exchangeRate,
          amountInBase: e.amountInBase,
          splitType: e.splitType,
          date: e.date,
          notes: e.notes,
          splits: e.splits,
        }));

      const resolvedSettlements = parseResult.settlements.map(s => ({
        payer: s.payer,
        receiver: s.receiver,
        amount: s.amount,
        date: s.date,
        notes: s.notes,
      }));

      const anomalyLogs = parseResult.anomalies.map(a => ({
        row: a.row,
        type: a.type,
        description: a.description,
        actionTaken: a.actionTaken,
        severity: a.severity,
      }));

      const importResult = await importResolvedData(groupId, resolvedExpenses, resolvedSettlements, anomalyLogs);
      if (!importResult.success) {
        throw new Error(importResult.error || "Import failed");
      }

      setImportDone(true);
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }, [parseResult]);

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Import CSV
        </h1>
        <p className="text-sm text-[#8B949E]">
          Upload your expenses CSV file. The importer will detect anomalies and let you review before importing.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { num: 1, label: "Upload" },
          { num: 2, label: "Review Anomalies" },
          { num: 3, label: "Confirm" },
          { num: 4, label: "Report" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
              step >= s.num
                ? "bg-[#00E5CC] text-[#0D1117] border-[#00E5CC]"
                : "bg-[#161B22] text-[#8B949E] border-[#30363D]"
            }`} style={{ fontFamily: "var(--font-mono)" }}>
              {step > s.num ? "✓" : s.num}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${
              step >= s.num ? "text-[#E6EDF3]" : "text-[#8B949E]"
            }`}>{s.label}</span>
            {i < 3 && <div className={`w-8 h-px ${step > s.num ? "bg-[#00E5CC]" : "bg-[#30363D]"}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-[#F85149]/10 border border-[#F85149]/30 text-[#F85149] text-sm">
          {error}
        </div>
      )}

      {/* ═══ STEP 1: Upload ═══ */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="p-8 rounded-xl bg-[#161B22] border border-[#30363D] border-dashed text-center">
            <div className="mb-4">
              <svg className="mx-auto text-[#8B949E] mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
              </svg>
              <p className="text-sm text-[#E6EDF3] font-medium mb-1">
                {fileName || "Drop your CSV file here or click to browse"}
              </p>
              <p className="text-xs text-[#8B949E]">Supports .csv files</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-[#8B949E] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-[#30363D] file:text-sm file:font-semibold file:bg-[#161B22] file:text-[#E6EDF3] hover:file:bg-[#30363D] file:cursor-pointer cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#30363D]" />
            <span className="text-xs text-[#8B949E]">or</span>
            <div className="h-px flex-1 bg-[#30363D]" />
          </div>

          <button
            onClick={handleLoadFromServer}
            className="w-full p-4 rounded-xl bg-[#161B22] border border-[#30363D] hover:border-[#00E5CC]/40 transition-colors text-left"
          >
            <p className="text-sm font-semibold text-[#E6EDF3] mb-1">Load from server</p>
            <p className="text-xs text-[#8B949E]">Import the bundled expenses export.csv file directly</p>
          </button>

          {/* USD Rate */}
          <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
            <label className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider block mb-2">
              USD → INR Exchange Rate
            </label>
            <input
              type="number"
              value={usdRate}
              onChange={e => setUsdRate(Number(e.target.value))}
              className="w-32 px-3 py-2 rounded-md bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] text-sm focus:outline-none focus:border-[#00E5CC]"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>

          {csvText && (
            <div>
              <p className="text-xs text-[#3FB950] mb-3">✓ File loaded: {fileName}</p>
              <button
                onClick={handleParseCSV}
                className="px-6 py-3 rounded-lg text-sm font-bold bg-[#00E5CC] text-[#0D1117] hover:bg-[#00D4BD] transition-colors shadow-[0_0_16px_rgba(0,229,204,0.2)]"
              >
                Parse & Detect Anomalies →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 2: Anomaly Review ═══ */}
      {step === 2 && parseResult && (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Rows" value={parseResult.totalRows} color="#E6EDF3" />
            <StatCard label="Will Import" value={parseResult.importedCount} color="#3FB950" />
            <StatCard label="Skipped" value={parseResult.skippedCount} color="#E3B341" />
            <StatCard label="Anomalies" value={parseResult.anomalyCount} color="#F85149" />
          </div>

          {/* Anomaly list */}
          <div className="rounded-xl bg-[#161B22] border border-[#30363D] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#30363D] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#E6EDF3]" style={{ fontFamily: "var(--font-display)" }}>
                Detected Anomalies ({parseResult.anomalies.length})
              </h2>
              <div className="flex gap-2 text-[10px] font-semibold">
                <span className="px-2 py-0.5 rounded bg-[#F85149]/10 text-[#F85149] border border-[#F85149]/20">
                  {parseResult.anomalies.filter(a => a.severity === 'HIGH').length} High
                </span>
                <span className="px-2 py-0.5 rounded bg-[#E3B341]/10 text-[#E3B341] border border-[#E3B341]/20">
                  {parseResult.anomalies.filter(a => a.severity === 'MEDIUM').length} Medium
                </span>
                <span className="px-2 py-0.5 rounded bg-[#3FB950]/10 text-[#3FB950] border border-[#3FB950]/20">
                  {parseResult.anomalies.filter(a => a.severity === 'LOW').length} Low
                </span>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-[#30363D]">
              {parseResult.anomalies.map((anomaly, i) => (
                <AnomalyRow key={i} anomaly={anomaly} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#8B949E] border border-[#30363D] hover:bg-[#161B22] transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#00E5CC] text-[#0D1117] hover:bg-[#00D4BD] transition-colors"
            >
              Continue to Confirm →
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Confirm ═══ */}
      {step === 3 && parseResult && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[#161B22] border border-[#30363D]">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Confirm Import
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[#30363D]">
                <span className="text-[#8B949E]">Expenses to import</span>
                <span className="font-bold text-[#3FB950]" style={{ fontFamily: "var(--font-mono)" }}>
                  {parseResult.importedCount}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#30363D]">
                <span className="text-[#8B949E]">Settlements detected</span>
                <span className="font-bold text-[#00E5CC]" style={{ fontFamily: "var(--font-mono)" }}>
                  {parseResult.settlements.length}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#30363D]">
                <span className="text-[#8B949E]">Rows skipped</span>
                <span className="font-bold text-[#E3B341]" style={{ fontFamily: "var(--font-mono)" }}>
                  {parseResult.skippedCount}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8B949E]">Anomalies logged</span>
                <span className="font-bold text-[#F85149]" style={{ fontFamily: "var(--font-mono)" }}>
                  {parseResult.anomalyCount}
                </span>
              </div>
            </div>
          </div>

          {/* Preview table */}
          <div className="rounded-xl bg-[#161B22] border border-[#30363D] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#30363D]">
              <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Expenses Preview
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#0D1117] sticky top-0">
                  <tr className="text-left text-[#8B949E]">
                    <th className="px-4 py-3 font-semibold">Row</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Paid By</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold">Split</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363D]">
                  {parseResult.expenses.map((exp, i) => (
                    <tr key={i} className={exp.skipped ? "opacity-40" : ""}>
                      <td className="px-4 py-2.5" style={{ fontFamily: "var(--font-mono)" }}>{exp.rowNum}</td>
                      <td className="px-4 py-2.5" style={{ fontFamily: "var(--font-mono)" }}>{exp.date}</td>
                      <td className="px-4 py-2.5 text-[#E6EDF3] max-w-[200px] truncate">{exp.description}</td>
                      <td className="px-4 py-2.5">{exp.paidBy}</td>
                      <td className="px-4 py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                        {exp.currency === 'USD' ? '$' : '₹'}{exp.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">{exp.splitType}</td>
                      <td className="px-4 py-2.5">
                        {exp.skipped ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E3B341]/10 text-[#E3B341] border border-[#E3B341]/20">
                            {exp.isSettlement ? "Settlement" : "Skipped"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#3FB950]/10 text-[#3FB950] border border-[#3FB950]/20">
                            Import
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#8B949E] border border-[#30363D] hover:bg-[#161B22] transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#00E5CC] text-[#0D1117] hover:bg-[#00D4BD] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {importing ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0D1117] border-t-transparent rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                "Confirm & Import"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 4: Import Report ═══ */}
      {step === 4 && parseResult && (
        <div className="space-y-6">
          <div className="p-8 rounded-xl bg-[#161B22] border border-[#3FB950]/30 text-center">
            <div className="w-16 h-16 rounded-full bg-[#3FB950]/10 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3FB950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Import Complete
            </h2>
            <p className="text-sm text-[#8B949E]">
              All data has been processed and saved to the database.
            </p>
          </div>

          {/* Report summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Imported" value={parseResult.importedCount} color="#3FB950" />
            <StatCard label="Settlements" value={parseResult.settlements.length} color="#00E5CC" />
            <StatCard label="Skipped" value={parseResult.skippedCount} color="#E3B341" />
            <StatCard label="Anomalies" value={parseResult.anomalyCount} color="#F85149" />
          </div>

          {/* Full anomaly report */}
          <div className="rounded-xl bg-[#161B22] border border-[#30363D] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#30363D]">
              <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Import Report — Anomaly Log
              </h3>
              <p className="text-xs text-[#8B949E] mt-1">
                Every anomaly detected and the action taken
              </p>
            </div>
            <div className="divide-y divide-[#30363D] max-h-[500px] overflow-y-auto">
              {parseResult.anomalies.map((anomaly, i) => (
                <AnomalyRow key={i} anomaly={anomaly} />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 rounded-lg text-sm font-bold bg-[#00E5CC] text-[#0D1117] hover:bg-[#00D4BD] transition-colors"
            >
              Go to Dashboard →
            </button>
            <button
              onClick={() => { setStep(1); setParseResult(null); setCsvText(""); setFileName(""); setImportDone(false); }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#8B949E] border border-[#30363D] hover:bg-[#161B22] transition-colors"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reusable Components ──────────────────────────── */

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-lg bg-[#0D1117] border border-[#30363D]">
      <p className="text-[10px] font-semibold text-[#8B949E] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold leading-none" style={{ fontFamily: "var(--font-mono)", color }}>
        {value}
      </p>
    </div>
  );
}

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  const severityColors = {
    HIGH: { bg: "bg-[#F85149]/10", text: "text-[#F85149]", border: "border-[#F85149]/20", dot: "#F85149" },
    MEDIUM: { bg: "bg-[#E3B341]/10", text: "text-[#E3B341]", border: "border-[#E3B341]/20", dot: "#E3B341" },
    LOW: { bg: "bg-[#3FB950]/10", text: "text-[#3FB950]", border: "border-[#3FB950]/20", dot: "#3FB950" },
  };
  const s = severityColors[anomaly.severity];

  return (
    <div className="px-5 py-3 hover:bg-[#0D1117]/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.dot }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold text-[#8B949E]" style={{ fontFamily: "var(--font-mono)" }}>
              Row {anomaly.row}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.bg} ${s.text} border ${s.border}`}>
              {anomaly.severity}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#30363D]/50 text-[#8B949E]">
              {anomaly.type}
            </span>
          </div>
          <p className="text-xs text-[#E6EDF3] mb-1">{anomaly.description}</p>
          <p className="text-[11px] text-[#8B949E]">
            <span className="text-[#00E5CC] font-medium">Action:</span> {anomaly.actionTaken}
          </p>
        </div>
      </div>
    </div>
  );
}
