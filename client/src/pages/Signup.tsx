import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, Loader2, CheckCircle, ArrowRight, Eye, EyeOff, Sparkles, Crown, Shield } from "lucide-react";

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { level: 2, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { level: 3, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { level: 4, label: "Strong", color: "bg-green-500" };
  return { level: 5, label: "Very Strong", color: "bg-emerald-500" };
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: "Free",
      icon: Sparkles,
      color: "from-cyan-500 to-blue-500",
      features: ["25+ PDF tools", "25 operations/day", "11MB file limit"],
    },
    {
      name: "Pro",
      icon: Crown,
      color: "from-amber-500 to-orange-500",
      features: ["50+ tools including OCR", "Unlimited operations", "No file size limits"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-[calc(100vh-64px)]">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00aDJ2MmgtMnYtMnptLTQgMHYyaC0ydi0yaDJ6bTIgMGgydjJoLTJ2LTJ6bS0yLTR2MmgtMnYtMmgyem0yIDB2Mmgtdi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">InstantPDF</span>
              </div>

              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                Start free,<br />
                <span className="text-cyan-300">upgrade anytime</span>
              </h2>
              <p className="text-lg text-white/70 mb-10 max-w-md">
                Create your account and get instant access to powerful PDF tools. No credit card required.
              </p>

              <div className="space-y-4">
                {plans.map((plan, i) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.2 }}
                    className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                        <plan.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-white font-bold text-lg">{plan.name}</span>
                    </div>
                    <div className="space-y-2">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                          <span className="text-white/70 text-sm">{f}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[440px]"
          >
            <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">InstantPDF</span>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="text-muted-foreground mt-2">
                Get started with your free account today
              </p>
            </div>

            <div className="lg:hidden mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/5 dark:to-blue-500/5 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">Free plan includes</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {["25+ PDF tools", "25 ops/day", "11MB files", "No watermarks"].map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2"
                >
                  <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold">!</span>
                  </div>
                  {error}
                </motion.div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-muted/30 border-border/60 focus:border-cyan-500 focus:ring-cyan-500/20 transition-colors"
                    required
                    data-testid="input-signup-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 rounded-xl bg-muted/30 border-border/60 focus:border-cyan-500 focus:ring-cyan-500/20 transition-colors"
                    required
                    data-testid="input-signup-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2.5 space-y-1.5" data-testid="password-strength">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.level ? strength.color : "bg-muted-foreground/15"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium transition-colors ${
                      strength.level <= 1 ? "text-red-500" :
                      strength.level <= 2 ? "text-orange-500" :
                      strength.level <= 3 ? "text-yellow-600 dark:text-yellow-400" :
                      strength.level <= 4 ? "text-green-500" :
                      "text-emerald-500"
                    }`}>
                      {strength.label}
                    </p>
                  </div>
                )}
                {!password && <p className="text-xs text-muted-foreground/60 mt-1">Must be at least 6 characters</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-muted/30 border-border/60 focus:border-cyan-500 focus:ring-cyan-500/20 transition-colors"
                    required
                    data-testid="input-signup-confirm-password"
                  />
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 shadow-lg shadow-cyan-500/20 text-base font-semibold transition-all hover:shadow-xl hover:shadow-cyan-500/30"
                disabled={isLoading}
                data-testid="button-signup-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create free account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground/60">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>

            <div className="mt-6 pt-6 border-t border-border/40 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold" data-testid="link-login">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
