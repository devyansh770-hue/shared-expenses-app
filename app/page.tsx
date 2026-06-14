import Link from 'next/link';
import { ArrowRight, PieChart, Users, Shield, Zap, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white font-sans">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0d14]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f2fe] to-[#4facfe] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.3)]">
              <Zap className="w-5 h-5 text-[#0a0d14] fill-[#0a0d14]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">SplitSphere</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How it Works</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="px-6 py-2.5 rounded-full text-sm font-bold bg-white text-[#0a0d14] hover:bg-slate-200 transition-all shadow-md"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 relative flex flex-col items-center justify-center text-center min-h-[90vh]">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00f2fe]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#9c27b0]/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse" />
            <span className="text-sm font-medium text-slate-300">The smartest way to share expenses</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-tight text-white">
            Split bills with friends, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe]">
              without the headache.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Keep track of shared expenses, calculate exact balances automatically, and settle up with absolute peace of mind.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#0a0d14] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              See how it works
            </Link>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-slate-400 text-sm font-medium">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00f2fe]" /> 100% Free to use</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00f2fe]" /> No credit card required</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#00f2fe]" /> Bank-level security</div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative bg-[#0d1117] border-t border-white/5">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">Everything you need</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Powerful features wrapped in an elegant, easy-to-use interface.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#161b22] border border-white/5 hover:border-white/10 transition-colors shadow-xl">
              <div className="w-14 h-14 rounded-xl bg-[#00f2fe]/10 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-[#00f2fe]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Group Management</h3>
              <p className="text-slate-400 leading-relaxed text-base">
                Create groups for trips, apartments, or events. Add friends instantly and keep everything organized in one single place.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-[#161b22] border border-white/5 hover:border-white/10 transition-colors shadow-xl">
              <div className="w-14 h-14 rounded-xl bg-[#9c27b0]/10 flex items-center justify-center mb-6">
                <PieChart className="w-7 h-7 text-[#9c27b0]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart Splitting</h3>
              <p className="text-slate-400 leading-relaxed text-base">
                Split equally, by exact amounts, or percentages. Our algorithm minimizes the total number of transactions needed to settle up.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-[#161b22] border border-white/5 hover:border-white/10 transition-colors shadow-xl">
              <div className="w-14 h-14 rounded-xl bg-[#10b981]/10 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-[#10b981]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Secure & Private</h3>
              <p className="text-slate-400 leading-relaxed text-base">
                Your financial data is encrypted and completely secure. We prioritize your privacy and never sell your data to third parties.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[#161b22] to-[#0a0d14] border border-white/10 rounded-3xl p-10 md:p-16 shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white">Ready to stop arguing over bills?</h2>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto text-lg">Join thousands of users who are already saving time and avoiding awkward conversations.</p>
          <Link 
            href="/signup" 
            className="inline-flex px-10 py-4 rounded-full text-lg font-bold bg-white text-[#0a0d14] hover:bg-slate-200 transition-colors shadow-lg"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6 bg-[#0a0d14]">
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
