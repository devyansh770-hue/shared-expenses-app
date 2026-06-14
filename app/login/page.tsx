import Link from "next/link";
import { Zap } from "lucide-react";
import AuthForm from "../components/auth-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#00f2fe]/30">
      <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00f2fe]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#9c27b0]/10 rounded-full blur-[120px]" />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <Link href="/">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#4facfe] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold font-heading tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{" "}
          <Link href="/signup" className="font-medium text-[#00f2fe] hover:text-[#4facfe] transition-colors">
            start a new group for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#121824]/80 backdrop-blur-xl py-8 px-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] border border-white/10 sm:rounded-2xl sm:px-10">
          <AuthForm type="login" />
        </div>
      </div>
    </div>
  );
}
