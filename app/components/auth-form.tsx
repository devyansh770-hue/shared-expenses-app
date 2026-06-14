"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function AuthForm({ type }: { type: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 0:
      case 1: return { score, label: "Weak", color: "bg-[#F85149]" };
      case 2: return { score, label: "Fair", color: "bg-[#E3B341]" };
      case 3: return { score, label: "Good", color: "bg-[#00E5CC]" };
      case 4: return { score, label: "Strong", color: "bg-[#3FB950]" };
      default: return { score: 0, label: "None", color: "bg-slate-700" };
    }
  };

  const strength = getPasswordStrength(password);
  const isStrongPassword = strength.score >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (type === "signup" && !isStrongPassword) {
      setError("Please choose a stronger password (needs minimum 8 chars, uppercase, and numbers/symbols).");
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
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-300">Password</label>
          {type === "signup" && password.length > 0 && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isStrongPassword ? 'text-[#3FB950]' : 'text-slate-500'}`}>
              {isStrongPassword && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isStrongPassword ? 'Strong password' : 'Needs to be stronger'}
            </div>
          )}
        </div>
        
        <div className="mt-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#00E5CC] focus:border-[#00E5CC] sm:text-sm bg-white/5 text-white pr-10 transition-all"
            placeholder="••••••••"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {type === "signup" && password.length > 0 && (
          <div className="mt-2">
            <div className="flex gap-1 h-1 w-full mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-white/10'}`} 
                />
              ))}
            </div>
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
