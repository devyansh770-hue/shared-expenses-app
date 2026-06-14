import Link from 'next/link';
import { ArrowRight, FileSpreadsheet, ShieldAlert, History, Zap, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans">
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#0B0F19]/80 backdrop-blur-lg border-b border-[#1E293B]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#00f2fe] to-[#4facfe] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0B0F19] fill-[#0B0F19]" />
            </div>
            <span className="text-xl font-bold tracking-tight">SplitSphere</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Import CSV</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Balances</Link>
          </div>

          <Link 
            href="/login" 
            className="px-5 py-2 rounded-lg text-[13px] font-semibold bg-[#111827] text-slate-200 border border-[#1E293B] hover:border-[#334155] hover:text-white transition-all"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-56 pb-20 px-6">
        {/* Subtle background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-[#00f2fe]/[0.04] rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#1E293B] bg-[#111827] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse" />
            <span className="text-xs font-medium text-slate-400">Intelligent Shared Expense Management</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
            Turn messy spreadsheets into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe]">
              clear shared balances.
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-base md:text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Import expenses, detect anomalies, track member changes, and generate transparent settlements — automatically.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              href="/signup" 
              className="px-7 py-3 rounded-lg text-sm font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#0B0F19] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-[0_0_24px_rgba(0,242,254,0.25)]"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/dashboard" 
              className="px-7 py-3 rounded-lg text-sm font-bold bg-[#111827] text-slate-200 border border-[#1E293B] hover:border-[#334155] transition-colors flex items-center"
            >
              View Dashboard
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-slate-500 text-xs font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00f2fe]" /> Free to use</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00f2fe]" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#00f2fe]" /> Bank-level security</span>
          </div>
        </div>
      </section>

      {/* ── Product Preview ── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-[#111827] border border-[#1E293B] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-[#1E293B]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]/70" />
              <span className="ml-3 text-[11px] text-slate-500 font-medium">SplitSphere — Import Summary</span>
            </div>
            
            {/* Dashboard mockup */}
            <div className="p-6 md:p-8">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-bold mb-1">Import Summary</h3>
                  <p className="text-sm text-slate-500">Last import: expenses_june_2026.csv</p>
                </div>
                <span className="self-start px-3 py-1 rounded-md bg-[#10b981]/10 text-[#10b981] text-xs font-semibold border border-[#10b981]/20">
                  ✓ Processing Complete
                </span>
              </div>
              
              {/* Stats grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-[#0B0F19] border border-[#1E293B]">
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Imported</p>
                  <p className="text-3xl font-bold text-white">84</p>
                  <p className="text-xs text-slate-500 mt-1">expenses</p>
                </div>
                <div className="p-5 rounded-xl bg-[#0B0F19] border border-red-500/20 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-500/5 blur-xl" />
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Anomalies</p>
                  <p className="text-3xl font-bold text-red-400">14</p>
                  <p className="text-xs text-red-400/60 mt-1">need attention</p>
                </div>
                <div className="p-5 rounded-xl bg-[#0B0F19] border border-yellow-500/20 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-500/5 blur-xl" />
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Pending</p>
                  <p className="text-3xl font-bold text-yellow-400">3</p>
                  <p className="text-xs text-yellow-400/60 mt-1">awaiting review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-24 px-6 border-t border-[#1E293B]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Built for complex splitting</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">Advanced algorithms to handle real-world shared expense scenarios.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-7 rounded-2xl bg-[#111827] border border-[#1E293B] hover:border-red-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-5 group-hover:bg-red-500/15 transition-colors">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-base font-bold mb-2">Anomaly Detection</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Detect duplicate expenses, invalid splits, and settlements mistakenly recorded as expenses.
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="p-7 rounded-2xl bg-[#111827] border border-[#1E293B] hover:border-[#00f2fe]/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-[#00f2fe]/10 flex items-center justify-center mb-5 group-hover:bg-[#00f2fe]/15 transition-colors">
                <FileSpreadsheet className="w-6 h-6 text-[#00f2fe]" />
              </div>
              <h3 className="text-base font-bold mb-2">Temporal Membership</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Members only pay for expenses during their active periods. Handle joins and departures seamlessly.
              </p>
            </div>
            
            {/* Card 3 */}
            <div className="p-7 rounded-2xl bg-[#111827] border border-[#1E293B] hover:border-green-500/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-5 group-hover:bg-green-500/15 transition-colors">
                <History className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-base font-bold mb-2">Transparent Ledger</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every balance is fully traceable. View the exact transaction history and split logic behind every settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1E293B] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00f2fe] fill-[#00f2fe]" />
            <span className="font-bold text-base tracking-tight">SplitSphere</span>
          </div>
          <p className="text-slate-600 text-xs">© {new Date().getFullYear()} SplitSphere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
