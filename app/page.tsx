import Link from 'next/link';
import { ArrowRight, PieChart, Users, Shield, Zap, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white selection:bg-[#00f2fe]/30 font-sans">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#0a0d14]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f2fe] to-[#4facfe] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.4)]">
              <Zap className="w-5 h-5 text-[#0a0d14] fill-[#0a0d14]" />
            </div>
            <span className="text-2xl font-bold font-heading tracking-tight text-white">SplitSphere</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How it Works</Link>
            <Link href="#testimonials" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Testimonials</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link 
              href="/login" 
              className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="px-6 py-2.5 rounded-full text-sm font-bold bg-white text-[#0a0d14] hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-52 lg:pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#00f2fe]/20 to-[#9c27b0]/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse shadow-[0_0_8px_#00f2fe]" />
            <span className="text-sm font-semibold text-slate-200">The smartest way to share expenses</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-heading tracking-tight mb-8 leading-[1.05] text-white">
            Split bills with friends, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] via-[#4facfe] to-[#00f2fe] animate-gradient-x">
              without the headache.
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Keep track of shared expenses, calculate exact balances automatically, and settle up with absolute peace of mind.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-10 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#0a0d14] shadow-[0_0_30px_rgba(0,242,254,0.4)] hover:shadow-[0_0_50px_rgba(0,242,254,0.6)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#features" 
              className="w-full sm:w-auto px-10 py-4 rounded-full text-lg font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
            >
              See how it works
            </Link>
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap justify-center gap-8 text-slate-400 text-sm font-medium">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#00f2fe]" /> 100% Free to use</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#00f2fe]" /> No credit card required</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#00f2fe]" /> Bank-level security</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative bg-[#0a0d14]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-heading tracking-tight mb-6 text-white">Everything you need</h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto font-light">Powerful features wrapped in an elegant, lightning-fast interface.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-[#00f2fe]" />}
              title="Group Management"
              description="Create groups for trips, apartments, or events. Add friends instantly and keep everything organized in one single place."
              glowColor="rgba(0, 242, 254, 0.15)"
            />
            <FeatureCard 
              icon={<PieChart className="w-8 h-8 text-[#9c27b0]" />}
              title="Smart Splitting"
              description="Split equally, by exact amounts, or percentages. Our algorithm minimizes the total number of transactions needed to settle up."
              glowColor="rgba(156, 39, 176, 0.15)"
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-[#10b981]" />}
              title="Secure & Private"
              description="Your financial data is encrypted and completely secure. We prioritize your privacy and never sell your data to third parties."
              glowColor="rgba(16, 185, 129, 0.15)"
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d14] to-[#00f2fe]/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 bg-[#121824]/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-12 md:p-20 shadow-[0_20px_50px_-12px_rgba(0,242,254,0.2)]">
          <h2 className="text-4xl md:text-6xl font-bold font-heading tracking-tight mb-8 text-white">Ready to stop arguing over bills?</h2>
          <Link 
            href="/signup" 
            className="inline-flex px-12 py-5 rounded-full text-xl font-bold bg-white text-[#0a0d14] hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-[#0a0d14]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00f2fe] to-[#4facfe] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0a0d14] fill-[#0a0d14]" />
            </div>
            <span className="font-bold font-heading text-2xl tracking-tight text-white">SplitSphere</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} SplitSphere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, glowColor }: { icon: React.ReactNode, title: string, description: string, glowColor: string }) {
  return (
    <div 
      className="p-10 rounded-[2.5rem] bg-[#121824]/60 backdrop-blur-sm border border-white/5 hover:border-white/20 transition-all duration-300 group hover:-translate-y-2"
      style={{ boxShadow: `0 10px 40px -10px ${glowColor}` }}
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 font-heading text-white">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-lg font-light">{description}</p>
    </div>
  );
}
