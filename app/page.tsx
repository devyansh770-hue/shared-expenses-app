"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/* ──────────────────────────────────────────────────
   CountUp — animates a number from 0 to `end`
   ────────────────────────────────────────────────── */
function CountUp({ end, duration = 1800 }: { end: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            start = Math.floor(eased * end);
            el.textContent = String(start);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>0</span>;
}

/* ──────────────────────────────────────────────────
   Landing Page
   ────────────────────────────────────────────────── */
export default function LandingPage() {
  /* Intersection Observer for reveal-on-scroll */
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Navbar scroll effect */
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    const handler = () => {
      if (window.scrollY > 40) {
        navbar.style.backgroundColor = "rgba(13, 17, 23, 0.92)";
        navbar.style.borderBottomColor = "#30363D";
      } else {
        navbar.style.backgroundColor = "rgba(13, 17, 23, 0.6)";
        navbar.style.borderBottomColor = "transparent";
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav
        id="navbar"
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-colors duration-300"
        style={{ borderBottom: "1px solid transparent" }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="SplitSphere Home">
            <div className="w-8 h-8 rounded-lg bg-[#00E5CC] flex items-center justify-center shadow-[0_0_12px_rgba(0,229,204,0.4)] group-hover:shadow-[0_0_20px_rgba(0,229,204,0.6)] transition-shadow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D1117" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              SplitSphere
            </span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-[13px] font-medium text-[#8B949E] hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard" className="text-[13px] font-medium text-[#8B949E] hover:text-white transition-colors">
              Import CSV
            </Link>
            <Link href="/dashboard" className="text-[13px] font-medium text-[#8B949E] hover:text-white transition-colors">
              Balances
            </Link>
          </div>

          {/* CTA */}
          <Link
            href="/login"
            className="px-5 py-[7px] rounded-md text-[13px] font-semibold text-white border border-[#30363D] hover:border-[#8B949E] hover:bg-white/5 transition-all"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative px-6 pt-[200px] pb-8" aria-labelledby="hero-heading">
        {/* Background radial glow */}
        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-[#00E5CC]/[0.04] blur-[100px] pointer-events-none" aria-hidden="true" />

        <div className="max-w-[720px] mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-[6px] rounded-full border border-[#30363D] bg-[#161B22] mb-8">
            <span className="w-[6px] h-[6px] rounded-full bg-[#00E5CC] animate-pulse" aria-hidden="true" />
            <span className="text-xs font-medium text-[#8B949E] tracking-wide">
              Expense Management, Simplified
            </span>
          </div>

          {/* Heading */}
          <h1
            id="hero-heading"
            className="text-[32px] sm:text-[40px] md:text-[48px] font-bold leading-[1.15] tracking-tight mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Turn messy spreadsheets into
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5CC] to-[#00B4D8]">
              clear shared balances.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-[15px] sm:text-[17px] text-[#8B949E] leading-relaxed mb-10 max-w-[540px] mx-auto">
            Import expenses, detect anomalies, track member changes, and generate transparent settlements — automatically.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link
              href="/signup"
              className="px-7 py-3 rounded-lg text-[14px] font-bold bg-[#00E5CC] text-[#0D1117] hover:bg-[#00D4BD] transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,204,0.3)] hover:shadow-[0_0_32px_rgba(0,229,204,0.45)]"
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
            <Link
              href="/dashboard"
              className="px-7 py-3 rounded-lg text-[14px] font-semibold text-[#E6EDF3] hover:text-white hover:bg-white/5 transition-colors"
            >
              View Dashboard
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-medium text-[#8B949E]">
            <span className="flex items-center gap-1.5">
              <svg className="text-[#00E5CC]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="text-[#00E5CC]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="text-[#00E5CC]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              Bank-level security
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════ APP MOCKUP WINDOW ═══════════ */}
      <section className="px-6 pt-12 pb-24 relative z-10" aria-label="Product preview">
        <div className="max-w-[800px] mx-auto animate-float">
          <div
            className="rounded-xl overflow-hidden border border-[#30363D] shadow-[0_8px_40px_-8px_rgba(0,229,204,0.15),0_2px_16px_-4px_rgba(0,0,0,0.6)]"
            style={{ background: "#161B22" }}
          >
            {/* macOS window chrome */}
            <div className="flex items-center gap-[6px] px-4 py-3 border-b border-[#30363D]">
              <span className="w-[10px] h-[10px] rounded-full bg-[#F85149]/70" aria-hidden="true" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#E3B341]/70" aria-hidden="true" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#3FB950]/70" aria-hidden="true" />
              <span className="ml-3 text-[11px] text-[#8B949E] font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                SplitSphere — Import Summary
              </span>
            </div>

            {/* Dashboard content */}
            <div className="p-6 sm:p-8">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-[18px] font-bold text-[#E6EDF3] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    Import Summary
                  </h3>
                  <p className="text-[12px] text-[#8B949E]" style={{ fontFamily: "var(--font-mono)" }}>
                    Last import: expenses_june_2026.csv
                  </p>
                </div>
                <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#3FB950]/10 text-[#3FB950] text-[11px] font-semibold border border-[#3FB950]/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  Processing Complete
                </span>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Imported */}
                <div className="p-4 rounded-lg bg-[#0D1117] border border-[#30363D]">
                  <p className="text-[10px] font-semibold text-[#8B949E] uppercase tracking-widest mb-2">Imported</p>
                  <p className="text-[28px] font-bold text-[#E6EDF3] leading-none" style={{ fontFamily: "var(--font-mono)" }}>
                    <CountUp end={84} />
                  </p>
                  <p className="text-[11px] text-[#8B949E] mt-1">expenses</p>
                </div>

                {/* Anomalies */}
                <div className="p-4 rounded-lg bg-[#0D1117] border border-[#F85149]/25 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#F85149]/5 blur-2xl" aria-hidden="true" />
                  <p className="text-[10px] font-semibold text-[#8B949E] uppercase tracking-widest mb-2">Anomalies</p>
                  <p className="text-[28px] font-bold text-[#F85149] leading-none relative z-10" style={{ fontFamily: "var(--font-mono)" }}>
                    <CountUp end={14} />
                  </p>
                  <p className="text-[11px] text-[#F85149]/60 mt-1">need attention</p>
                </div>

                {/* Pending */}
                <div className="p-4 rounded-lg bg-[#0D1117] border border-[#E3B341]/25 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#E3B341]/5 blur-2xl" aria-hidden="true" />
                  <p className="text-[10px] font-semibold text-[#8B949E] uppercase tracking-widest mb-2">Pending</p>
                  <p className="text-[28px] font-bold text-[#E3B341] leading-none relative z-10" style={{ fontFamily: "var(--font-mono)" }}>
                    <CountUp end={3} />
                  </p>
                  <p className="text-[11px] text-[#E3B341]/60 mt-1">awaiting review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="px-6 py-24 border-t border-[#161B22]" aria-labelledby="features-heading">
        <div className="max-w-[960px] mx-auto">
          {/* Section heading */}
          <div className="text-center mb-16 reveal">
            <h2
              id="features-heading"
              className="text-[24px] sm:text-[32px] font-bold tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Built for complex splitting
            </h2>
            <p className="text-[15px] text-[#8B949E] max-w-[480px] mx-auto">
              Advanced algorithms to handle real-world shared expense scenarios.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Card 1 — Anomaly Detection */}
            <div className="reveal reveal-delay-1 p-6 rounded-xl bg-[#161B22] border border-[#30363D] hover:border-[#F85149]/40 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(248,81,73,0.15)]">
              <div className="w-10 h-10 rounded-lg bg-[#F85149]/10 flex items-center justify-center mb-5 group-hover:bg-[#F85149]/15 transition-colors">
                <svg className="text-[#F85149]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9.5 12 2 2 4-4"/>
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-[#E6EDF3] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Anomaly Detection
              </h3>
              <p className="text-[13px] text-[#8B949E] leading-relaxed">
                Detect duplicate expenses, invalid splits, and settlements mistakenly recorded as expenses.
              </p>
            </div>

            {/* Card 2 — Temporal Membership */}
            <div className="reveal reveal-delay-2 p-6 rounded-xl bg-[#161B22] border border-[#30363D] hover:border-[#00E5CC]/40 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(0,229,204,0.15)]">
              <div className="w-10 h-10 rounded-lg bg-[#00E5CC]/10 flex items-center justify-center mb-5 group-hover:bg-[#00E5CC]/15 transition-colors">
                <svg className="text-[#00E5CC]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-[#E6EDF3] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Temporal Membership
              </h3>
              <p className="text-[13px] text-[#8B949E] leading-relaxed">
                Members only pay for expenses during their active periods. Handle joins and departures seamlessly.
              </p>
            </div>

            {/* Card 3 — Transparent Ledger */}
            <div className="reveal reveal-delay-3 p-6 rounded-xl bg-[#161B22] border border-[#30363D] hover:border-[#3FB950]/40 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(63,185,80,0.15)]">
              <div className="w-10 h-10 rounded-lg bg-[#3FB950]/10 flex items-center justify-center mb-5 group-hover:bg-[#3FB950]/15 transition-colors">
                <svg className="text-[#3FB950]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-[#E6EDF3] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Transparent Ledger
              </h3>
              <p className="text-[13px] text-[#8B949E] leading-relaxed">
                Every balance is fully traceable. View the exact transaction history and split logic behind every settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-[#161B22] py-8 px-6" role="contentinfo">
        <div className="max-w-[960px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg className="text-[#00E5CC]" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="text-[14px] font-bold text-[#E6EDF3] tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              SplitSphere
            </span>
          </div>
          <p className="text-[12px] text-[#8B949E]">
            © 2026 SplitSphere. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
