import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { 
  Mail, Calendar, Shield, Lock, Check, AlertCircle, Clock, History, Trash2, 
  Sun, Moon, Monitor, Zap, TrendingUp, Award, FileText, Sparkles, Crown,
  ChevronRight, LogOut, Eye, EyeOff
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Operation {
  id: string;
  operation: string;
  status: string;
  createdAt: string;
}

interface UsageLimits {
  used: number;
  limit: number;
  plan: string;
}

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

export default function Profile() {
  const { user, token, isLoading, changePassword, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loadingOps, setLoadingOps] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  useEffect(() => {
    if (user && token) {
      fetchOperations();
      fetchUsageLimits();
    }
  }, [user, token]);

  const fetchOperations = async () => {
    setLoadingOps(true);
    try {
      const response = await fetch("/api/auth/my-operations", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOperations(data.operations || []);
      }
    } catch (error) {
      console.error("Failed to fetch operations:", error);
    } finally {
      setLoadingOps(false);
    }
  };

  const fetchUsageLimits = async () => {
    try {
      const response = await fetch("/api/auth/limits", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsageLimits(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage limits:", error);
    }
  };

  const stats = useMemo(() => {
    if (!operations.length) return { total: 0, favorite: null, streak: 0 };

    const opCounts: Record<string, number> = {};
    operations.forEach(op => {
      opCounts[op.operation] = (opCounts[op.operation] || 0) + 1;
    });

    const favorite = Object.entries(opCounts).sort((a, b) => b[1] - a[1])[0];
    
    let streak = 0;
    if (operations.length > 0) {
      const today = new Date();
      const lastOp = new Date(operations[0].createdAt);
      const daysSinceLastOp = differenceInDays(today, lastOp);
      if (daysSinceLastOp <= 1) {
        streak = Math.min(operations.length, 7);
      }
    }

    return {
      total: operations.length,
      favorite: favorite ? favorite[0] : null,
      streak
    };
  }, [operations]);

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");

    if (!deletePassword) {
      setDeleteError("Please enter your password");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
        credentials: "include",
      });

      if (response.ok) {
        logout();
        setLocation("/");
      } else {
        const data = await response.json();
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch (error) {
      setDeleteError("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return "Unknown";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, h:mm a");
    } catch {
      return "Unknown";
    }
  };

  const getPlanValidity = () => {
    if (user.plan === "free") return null;
    if (!user.planExpiresAt) return { text: "Lifetime access", color: "text-green-500", status: "active" };
    
    const expiresAt = new Date(user.planExpiresAt);
    if (isNaN(expiresAt.getTime())) return null;
    
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { text: "Expired", color: "text-red-500", status: "expired" };
    if (daysLeft === 0) return { text: "Expires today", color: "text-orange-500", status: "expiring" };
    if (daysLeft === 1) return { text: "1 day remaining", color: "text-orange-500", status: "expiring" };
    if (daysLeft <= 7) return { text: `${daysLeft} days remaining`, color: "text-orange-500", status: "expiring" };
    return { text: `${daysLeft} days remaining`, color: "text-green-500", status: "active" };
  };

  const planValidity = getPlanValidity();
  const usagePercent = usageLimits ? Math.min((usageLimits.used / usageLimits.limit) * 100, 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-blue-500/5 to-purple-500/8 dark:from-cyan-500/15 dark:via-blue-500/10 dark:to-purple-500/15" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-400/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-purple-400/10 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative container px-4 md:px-6 py-10 md:py-14">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center md:items-start gap-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-[3px] shadow-xl shadow-cyan-500/20">
                  <div className="w-full h-full rounded-[13px] bg-background flex items-center justify-center">
                    <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent">
                      {getInitials(user.email)}
                    </span>
                  </div>
                </div>
                {user.plan === "pro" && (
                  <motion.div
                    className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl p-1.5 shadow-lg shadow-amber-500/30"
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Crown className="h-4 w-4 text-white" />
                  </motion.div>
                )}
              </motion.div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {user.email.split('@')[0]}
                </h1>
                <p className="text-muted-foreground mb-3">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                  <Badge 
                    className={`px-3 py-1 text-xs font-semibold ${user.plan === "pro" 
                      ? "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" 
                      : "bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"}`}
                  >
                    {user.plan === "pro" ? <Crown className="h-3 w-3 mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                    {user.plan.toUpperCase()} PLAN
                  </Badge>
                  {planValidity && (
                    <Badge variant="outline" className={planValidity.color}>
                      <Clock className="h-3 w-3 mr-1" />
                      {planValidity.text}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2 md:mt-0">
                {user.plan === "free" && (
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 text-white border-0"
                    data-testid="button-upgrade-pro"
                  >
                    <Crown className="h-4 w-4 mr-1.5" />
                    Upgrade to Pro
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  className="border-border/60"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Sign out
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="flex-1 container py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-cyan-50/80 to-white dark:from-cyan-500/5 dark:to-transparent hover:shadow-md transition-all">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200/60 dark:from-cyan-500/20 dark:to-cyan-500/10 flex items-center justify-center mb-3">
                    <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-cyan-600 dark:text-cyan-500" data-testid="text-total-operations">
                    <AnimatedCounter value={stats.total} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Operations</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-500/5 dark:to-transparent hover:shadow-md transition-all">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200/60 dark:from-purple-500/20 dark:to-purple-500/10 flex items-center justify-center mb-3">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                  </div>
                  <p className="text-sm md:text-base font-bold text-purple-600 dark:text-purple-500 capitalize truncate" data-testid="text-favorite-tool">
                    {stats.favorite?.replace(/-/g, " ") || "None yet"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Favorite Tool</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-500/5 dark:to-transparent hover:shadow-md transition-all">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/60 dark:from-amber-500/20 dark:to-amber-500/10 flex items-center justify-center mb-3">
                    <Award className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-500" data-testid="text-activity-streak">
                    <AnimatedCounter value={stats.streak} /><span className="text-base"> days</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Streak</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {usageLimits && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <Card className="border-border/50 bg-gradient-to-r from-cyan-50/50 via-white to-blue-50/50 dark:from-cyan-500/5 dark:via-transparent dark:to-blue-500/5">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-500/20 dark:to-blue-500/20 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">Daily Usage</h3>
                        <p className="text-xs text-muted-foreground" data-testid="text-usage-info">
                          {usageLimits.used} of {usageLimits.limit} operations
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-cyan-600 dark:text-cyan-500">
                      {usageLimits.limit - usageLimits.used} left
                    </span>
                  </div>
                  <Progress 
                    value={usagePercent} 
                    className="h-2.5 bg-muted/50"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-500/20 dark:to-cyan-500/20 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                      </div>
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {[
                      { icon: Mail, label: "Email", value: user.email, testId: "text-user-email" },
                      { icon: Shield, label: "Plan", value: user.plan.charAt(0).toUpperCase() + user.plan.slice(1), testId: "text-user-plan", badge: user.plan === "pro" },
                      { icon: Calendar, label: "Member since", value: formatDate(user.createdAt), testId: "text-user-created" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-muted-foreground/60" />
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate max-w-[200px]" data-testid={item.testId}>{item.value}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 font-bold">
                              PRO
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-500/20 dark:to-pink-500/20 flex items-center justify-center">
                        {theme === "dark" ? <Moon className="h-4 w-4 text-purple-600 dark:text-purple-500" /> : <Sun className="h-4 w-4 text-amber-600 dark:text-amber-500" />}
                      </div>
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { value: "light", icon: Sun, label: "Light" },
                        { value: "dark", icon: Moon, label: "Dark" },
                        { value: "system", icon: Monitor, label: "System" }
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value as any)}
                          className={`relative p-3.5 rounded-xl border-2 transition-all duration-200 ${
                            theme === value 
                              ? "border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/10 shadow-sm" 
                              : "border-border/50 hover:border-border hover:bg-muted/30"
                          }`}
                          data-testid={`button-theme-${value}`}
                        >
                          <Icon className={`h-5 w-5 mx-auto mb-1.5 ${theme === value ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground"}`} />
                          <p className={`text-xs font-medium ${theme === value ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground"}`}>
                            {label}
                          </p>
                          {theme === value && (
                            <motion.div 
                              layoutId="themeIndicator"
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center"
                            >
                              <Check className="h-2.5 w-2.5 text-white" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-500/20 dark:to-blue-500/20 flex items-center justify-center">
                          <History className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                        </div>
                        Recent Activity
                      </CardTitle>
                      {operations.length > 0 && (
                        <Badge variant="outline" className="text-xs">{operations.length} total</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingOps ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
                      </div>
                    ) : operations.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <FileText className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Use any PDF tool to see your history here</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-72 overflow-y-auto">
                        {operations.slice(0, 10).map((op, index) => (
                          <motion.div 
                            key={op.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${op.status === "success" ? "bg-green-500" : "bg-red-400"}`} />
                              <div>
                                <p className="text-sm font-medium capitalize">{op.operation.replace(/-/g, " ")}</p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(op.createdAt)}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-500/20 dark:to-emerald-500/20 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-green-600 dark:text-green-500" />
                      </div>
                      Change Password
                    </CardTitle>
                    <CardDescription className="text-xs">Keep your account secure with a strong password</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="currentPassword" className="text-xs font-medium">Current password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPw ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            required
                            className="h-11 rounded-xl bg-muted/30 border-border/60 pr-10"
                            data-testid="input-current-password"
                          />
                          <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
                            {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="newPassword" className="text-xs font-medium">New password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            className="h-11 rounded-xl bg-muted/30 border-border/60 pr-10"
                            data-testid="input-new-password"
                          />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
                            {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm new password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            className="h-11 rounded-xl bg-muted/30 border-border/60"
                            data-testid="input-confirm-password"
                          />
                          {confirmPassword && newPassword === confirmPassword && (
                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>

                      {passwordError && (
                        <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-xl bg-destructive/10 border border-destructive/20" data-testid="text-password-error">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {passwordError}
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm p-3 rounded-xl bg-green-500/10 border border-green-500/20" data-testid="text-password-success">
                          <Check className="h-4 w-4 shrink-0" />
                          {passwordSuccess}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md shadow-cyan-500/15 border-0"
                        data-testid="button-change-password"
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Updating...
                          </>
                        ) : "Update Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-red-200/60 dark:border-red-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2.5 text-red-600 dark:text-red-400">
                      <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </div>
                      Danger Zone
                    </CardTitle>
                    <CardDescription className="text-xs">Permanent and irreversible actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Deleting your account will permanently remove all your data and operation history. This cannot be undone.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialog(true)}
                      className="w-full border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300"
                      data-testid="button-delete-account"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data will be permanently removed. Enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deletePassword" className="text-sm font-medium">Password</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="h-11 rounded-xl bg-muted/30 border-border/60"
                data-testid="input-delete-password"
              />
            </div>
            {deleteError && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {deleteError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="rounded-xl"
              data-testid="button-confirm-delete"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
