"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function AuthForm({ type }: { type: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-700" };
    let score = 0;
    if (pass.length > 7) score++;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (type === "signup" && strength.score < 3) {
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
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm text-center">
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
              className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#00f2fe] focus:border-[#00f2fe] sm:text-sm bg-white/5 text-white"
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
            className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#00f2fe] focus:border-[#00f2fe] sm:text-sm bg-white/5 text-white"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300">Password</label>
        <div className="mt-1">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-white/10 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#00f2fe] focus:border-[#00f2fe] sm:text-sm bg-white/5 text-white"
            placeholder="••••••••"
          />
        </div>
        
        {type === "signup" && password.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Password strength:</span>
              <span className="font-semibold" style={{ color: strength.color.replace('bg-[', '').replace(']', '') }}>
                {strength.label}
              </span>
            </div>
            <div className="flex gap-1 h-1.5 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-slate-700/50'}`} 
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
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:from-[#4facfe] hover:to-[#00f2fe] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f2fe] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Please wait..." : type === "signup" ? "Create Account" : "Sign In"}
        </button>
      </div>
    </form>
  );
}
