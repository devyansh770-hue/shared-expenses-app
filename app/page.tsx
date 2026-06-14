import Link from 'next/link';
import { ArrowRight, FileSpreadsheet, ShieldAlert, History, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-[#00f2fe]/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f2fe] to-[#4facfe] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.3)]">
              <Zap className="w-5 h-5 text-[#0B0F19] fill-[#0B0F19]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">SplitSphere</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/dashboard/import" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Import CSV</Link>
            <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Balances</Link>
            <Link href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Docs</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#111827] text-white border border-[#1E293B] hover:bg-[#1E293B] transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 relative flex flex-col items-center justify-center text-center">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00f2fe]/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#9c27b0]/5 rounded-full blur-[100px]" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1E293B] bg-[#111827] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse" />
            <span className="text-sm font-medium text-slate-300">Intelligent Shared Expense Management</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 leading-[1.15] text-white">
            Turn messy spreadsheets into <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe]">
              clear shared balances.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Import expenses, detect anomalies, track member changes, and generate transparent settlements automatically.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#0B0F19] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,242,254,0.3)]"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold bg-[#111827] text-white border border-[#1E293B] hover:bg-[#1E293B] transition-colors flex items-center justify-center"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Mock Product Dashboard Screenshot */}
      <section className="py-12 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[2rem] p-4 bg-[#111827] border border-[#1E293B] shadow-2xl relative overflow-hidden">
             {/* Mock UI Header */}
             <div className="flex items-center gap-2 mb-6 px-4">
               <div className="w-3 h-3 rounded-full bg-[#f43f5e]"></div>
               <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
               <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
             </div>
             
             {/* Mock Dashboard Content */}
             <div className="bg-[#0B0F19] rounded-xl border border-[#1E293B] p-8">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-bold">Import Summary</h3>
                 <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm border border-green-500/20">Processing Complete</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-6 rounded-xl bg-[#111827] border border-[#1E293B]">
                   <p className="text-sm text-slate-400 mb-2">Imported Expenses</p>
                   <p className="text-3xl font-bold text-white">84</p>
                 </div>
                 <div className="p-6 rounded-xl bg-[#111827] border border-red-500/30 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 blur-xl"></div>
                   <p className="text-sm text-slate-400 mb-2">Detected Anomalies</p>
                   <p className="text-3xl font-bold text-red-400">14</p>
                 </div>
                 <div className="p-6 rounded-xl bg-[#111827] border border-[#1E293B]">
                   <p className="text-sm text-slate-400 mb-2">Pending Review</p>
                   <p className="text-3xl font-bold text-yellow-400">3</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">Built for complex splitting</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Advanced algorithms to handle real-world shared expenses scenarios.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#111827] border border-[#1E293B] hover:border-[#00f2fe]/50 transition-colors shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
                <ShieldAlert className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Anomaly Detection</h3>
              <p className="text-slate-400 leading-relaxed text-base">
                Detect duplicate expenses, invalid splits, and settlements mistakenly recorded as expenses. Ensure 100% accurate data.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-[#111827] border border-[#1E293B] hover:border-[#4facfe]/50 transition-colors shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-[#00f2fe]/10 flex items-center justify-center mb-6">
                <FileSpreadsheet className="w-7 h-7 text-[#00f2fe]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Temporal Membership</h3>
              <p className="text-slate-400 leading-relaxed text-base">
                Handle members moving in and out seamlessly. Members only pay for expenses during their active periods in the group.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-[#111827] border border-[#1E293B] hover:border-green-500/50 transition-colors shadow-lg">
              <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
                <History className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Transparent Ledger</h3>
              <p className="text-slate-400 leading-relaxed text-base">
                Every balance calculation is fully traceable. View the exact transaction history and split logic that led to the final settlement.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-[#1E293B] py-10 px-6 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#00f2fe] fill-[#00f2fe]" />
            <span className="font-bold text-xl tracking-tight text-white">SplitSphere</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} SplitSphere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
