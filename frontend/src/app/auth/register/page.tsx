"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.push("/app");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      await register(email, password, fullName || undefined);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f1117] relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Premium Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-indigo-500/30">
                B
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-white font-black tracking-tight text-3xl">DataBrix</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Create account</h1>
          <p className="text-slate-400 text-sm">Start transforming your data today</p>
        </div>

        {/* Premium Register Form */}
        <div className="bg-[#1a1d24] rounded-2xl p-8 border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-14 pl-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 pr-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-600">Must be at least 6 characters</p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-base transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <Link href="/">
              <Button variant="ghost" className="w-full text-slate-500 hover:text-white font-medium">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
