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
  Sun, Moon, Monitor, Zap, TrendingUp, Award, FileText, Sparkles, Crown
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-cyan-950/20">
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-cyan-950/10">
      <Navbar />
      <main className="flex-1 container py-8 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-10 relative">
            <motion.div
              className="relative inline-block mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-1 shadow-2xl shadow-cyan-500/30">
                <div className="w-full h-full rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10"></div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent relative z-10">
                    {getInitials(user.email)}
                  </span>
                </div>
              </div>
              {user.plan === "pro" && (
                <motion.div
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-2 shadow-lg"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Crown className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">{user.email}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge 
                className={`px-3 py-1 ${user.plan === "pro" 
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/30" 
                  : "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-500 border-cyan-500/30"}`}
              >
                {user.plan === "pro" ? <Crown className="h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                      <FileText className="h-6 w-6 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Operations</p>
                      <p className="text-3xl font-bold text-cyan-500" data-testid="text-total-operations">
                        <AnimatedCounter value={stats.total} />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <TrendingUp className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Favorite Tool</p>
                      <p className="text-lg font-bold text-purple-500 capitalize truncate" data-testid="text-favorite-tool">
                        {stats.favorite?.replace(/-/g, " ") || "None yet"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full"></div>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <Award className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Activity Streak</p>
                      <p className="text-3xl font-bold text-amber-500" data-testid="text-activity-streak">
                        <AnimatedCounter value={stats.streak} /> <span className="text-lg">days</span>
                      </p>
                    </div>
                  </div>
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
              <Card className="border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        <Zap className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Daily Usage</h3>
                        <p className="text-sm text-muted-foreground" data-testid="text-usage-info">
                          {usageLimits.used} of {usageLimits.limit} operations used today
                        </p>
                      </div>
                    </div>
                    {user.plan === "free" && (
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                        data-testid="button-upgrade-pro"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                  <Progress 
                    value={usagePercent} 
                    className="h-3 bg-muted"
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{usagePercent.toFixed(0)}% used</span>
                    <span>{usageLimits.limit - usageLimits.used} remaining</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-muted/50 backdrop-blur-sm bg-card/50 hover:bg-card/80 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        <History className="h-5 w-5 text-cyan-500" />
                      </div>
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Your latest PDF operations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingOps ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
                      </div>
                    ) : operations.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">No recent activity</p>
                        <p className="text-sm text-muted-foreground/60">Start using PDF tools to see your history</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {operations.slice(0, 10).map((op, index) => (
                          <motion.div 
                            key={op.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-cyan-500 group-hover:scale-125 transition-transform"></div>
                              <div>
                                <p className="font-medium capitalize">{op.operation.replace(/-/g, " ")}</p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(op.createdAt)}</p>
                              </div>
                            </div>
                            <Badge 
                              variant={op.status === "success" ? "default" : "destructive"}
                              className={op.status === "success" ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}
                            >
                              {op.status === "success" ? <Check className="h-3 w-3 mr-1" /> : null}
                              {op.status}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-muted/50 backdrop-blur-sm bg-card/50 hover:bg-card/80 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        {theme === "dark" ? <Moon className="h-5 w-5 text-purple-500" /> : <Sun className="h-5 w-5 text-amber-500" />}
                      </div>
                      Theme Preference
                    </CardTitle>
                    <CardDescription>Customize your visual experience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "light", icon: Sun, label: "Light", color: "amber" },
                        { value: "dark", icon: Moon, label: "Dark", color: "purple" },
                        { value: "system", icon: Monitor, label: "System", color: "cyan" }
                      ].map(({ value, icon: Icon, label, color }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value as any)}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                            theme === value 
                              ? `border-${color}-500 bg-${color}-500/10 shadow-lg shadow-${color}-500/20` 
                              : "border-muted hover:border-muted-foreground/30 hover:bg-muted/30"
                          }`}
                          data-testid={`button-theme-${value}`}
                        >
                          <Icon className={`h-6 w-6 mx-auto mb-2 ${theme === value ? `text-${color}-500` : "text-muted-foreground"}`} />
                          <p className={`text-sm font-medium ${theme === value ? `text-${color}-500` : "text-muted-foreground"}`}>
                            {label}
                          </p>
                          {theme === value && (
                            <motion.div 
                              layoutId="themeIndicator"
                              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-${color}-500 flex items-center justify-center`}
                            >
                              <Check className="h-3 w-3 text-white" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="border-muted/50 backdrop-blur-sm bg-card/50 hover:bg-card/80 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                        <Mail className="h-5 w-5 text-blue-500" />
                      </div>
                      Account Details
                    </CardTitle>
                    <CardDescription>Your account information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Email Address</p>
                        <p className="font-medium truncate" data-testid="text-user-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Current Plan</p>
                        <p className="font-medium capitalize flex items-center gap-2" data-testid="text-user-plan">
                          {user.plan}
                          {user.plan === "pro" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500">
                              PRO
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Member Since</p>
                        <p className="font-medium" data-testid="text-user-created">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-muted/50 backdrop-blur-sm bg-card/50 hover:bg-card/80 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                        <Lock className="h-5 w-5 text-green-500" />
                      </div>
                      Change Password
                    </CardTitle>
                    <CardDescription>Update your password to keep your account secure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          required
                          className="bg-muted/30 border-muted"
                          data-testid="input-current-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter your new password"
                          required
                          className="bg-muted/30 border-muted"
                          data-testid="input-new-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                          required
                          className="bg-muted/30 border-muted"
                          data-testid="input-confirm-password"
                        />
                      </div>

                      {passwordError && (
                        <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10" data-testid="text-password-error">
                          <AlertCircle className="h-4 w-4" />
                          {passwordError}
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="flex items-center gap-2 text-green-500 text-sm p-3 rounded-lg bg-green-500/10" data-testid="text-password-success">
                          <Check className="h-4 w-4" />
                          {passwordSuccess}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/20"
                        data-testid="button-change-password"
                      >
                        {isChangingPassword ? "Changing Password..." : "Change Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-destructive/30 backdrop-blur-sm bg-destructive/5 hover:bg-destructive/10 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <div className="p-2 rounded-lg bg-destructive/20">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible account actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. All your data will be permanently removed.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteDialog(true)}
                      className="w-full"
                      data-testid="button-delete-account"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete My Account
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
              Please enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deletePassword">Password</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="bg-muted/30"
                data-testid="input-delete-password"
              />
            </div>
            {deleteError && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                {deleteError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
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
