"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";

export default function AuthForm({ type }: { type: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Password rules
  const rules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "One number (0-9)", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$%)", met: /[!@#$%^&*]/.test(password) },
  ];

  const isStrongPassword = rules.every(r => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (type === "signup" && !isStrongPassword) {
      setError("Please ensure your password meets all requirements.");
      setLoading(false);
      return;
    }

    try {
      if (type === "signup") {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (error) throw new Error(error.message);
        router.push("/dashboard");
      } else {
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) throw new Error(error.message);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm text-center animate-fade-in-up">
          {error}
        </div>
      )}
      
      {type === "signup" && (
        <div>
          <label className="block text-sm font-medium text-slate-300">Name</label>
          <div className="mt-1">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#00E5CC] focus:border-[#00E5CC] sm:text-sm bg-white/5 text-white transition-all"
              placeholder="John Doe"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300">Email address</label>
        <div className="mt-1">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#00E5CC] focus:border-[#00E5CC] sm:text-sm bg-white/5 text-white transition-all"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300">Password</label>
        <div className="mt-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#00E5CC] focus:border-[#00E5CC] sm:text-sm bg-white/5 text-white pr-10 transition-all"
            placeholder="••••••••"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors z-10 cursor-pointer"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevents input from losing focus
              setShowPassword(!showPassword);
            }}
            onClick={(e) => {
              e.preventDefault();
            }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {type === "signup" && (isFocused || password.length > 0) && (
          <div className="mt-3 space-y-2 p-3 bg-[#0D1117]/50 rounded-md border border-white/5">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs transition-colors duration-300">
                {rule.met ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00E5CC] transition-transform duration-300 scale-110" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
                <span className={rule.met ? "text-[#00E5CC]" : "text-slate-500"}>
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-[0_0_12px_rgba(0,229,204,0.3)] text-sm font-bold text-[#0D1117] bg-[#00E5CC] hover:bg-[#00D4BD] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5CC] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
        >
          {loading ? (
             <span className="w-5 h-5 border-2 border-[#0D1117] border-t-transparent rounded-full animate-spin" />
          ) : type === "signup" ? (
            "Create Account"
          ) : (
            "Sign In"
          )}
        </button>
      </div>
    </form>
  );
}
