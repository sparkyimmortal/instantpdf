import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shield, UserX, UserCheck, ArrowUp, ArrowDown, RefreshCw, Calendar, Activity, Users, FileText, Server, Download, CheckSquare, MessageSquare, Mail, Eye, EyeOff, Reply, Smartphone, Globe, Tag, Send, X } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  plan: string;
  planExpiresAt: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  operations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    byOperation: { operation: string; count: number }[];
  };
  users: {
    total: number;
    pro: number;
    active: number;
    newThisMonth: number;
  };
}

interface ActivityLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  operation: string;
  status: string;
  fileSize: number | null;
  createdAt: string;
}

interface HealthStatus {
  status: string;
  components: {
    database: string;
    pdfBackend: string;
    server: string;
  };
  timestamp: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  source: string;
  category: string;
  status: string;
  isRead: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [upgradeDialog, setUpgradeDialog] = useState<{ open: boolean; userId: string; email: string }>({ open: false, userId: "", email: "" });
  const [validityDays, setValidityDays] = useState<string>("30");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [viewingContact, setViewingContact] = useState<ContactSubmission | null>(null);
  const [replyDialog, setReplyDialog] = useState<{ open: boolean; contact: ContactSubmission | null }>({ open: false, contact: null });
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [contactFilter, setContactFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        setLocation("/");
      } else {
        fetchAll();
      }
    }
  }, [user, authLoading, setLocation]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchStats(), fetchActivity(), fetchHealth(), fetchContacts()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await fetch("/api/admin/activity?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data.operations);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch("/api/admin/health", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error("Failed to fetch health:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/admin/contacts", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setContacts(data.submissions);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    }
  };

  const updateContactStatus = async (contactId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (response.ok) {
        toast({ title: "Success", description: `Contact marked as ${status}` });
        fetchContacts();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update contact", variant: "destructive" });
    }
  };

  const toggleRead = async (contactId: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isRead }),
        credentials: "include",
      });
      if (response.ok) {
        fetchContacts();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update read status", variant: "destructive" });
    }
  };

  const sendReply = async () => {
    if (!replyDialog.contact || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      const response = await fetch(`/api/admin/contacts/${replyDialog.contact.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: replyText }),
        credentials: "include",
      });
      if (response.ok) {
        toast({ title: "Reply sent", description: `Reply sent to ${replyDialog.contact.email}` });
        setReplyDialog({ open: false, contact: null });
        setReplyText("");
        fetchContacts();
      } else {
        const data = await response.json();
        toast({ title: "Error", description: data.error || "Failed to send reply", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    } finally {
      setReplyLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    general: "General",
    billing: "Billing",
    bug: "Bug Report",
    feature: "Feature Request",
  };

  const filteredContacts = contacts.filter(c => {
    if (contactFilter === "all") return true;
    if (contactFilter === "unread") return !c.isRead;
    return c.category === contactFilter;
  });

  const openUpgradeDialog = (userId: string, email: string) => {
    setUpgradeDialog({ open: true, userId, email });
    setValidityDays("30");
  };

  const confirmUpgrade = async () => {
    const { userId } = upgradeDialog;
    setActionLoading(userId);
    setUpgradeDialog({ open: false, userId: "", email: "" });
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: "pro", validityDays }),
        credentials: "include",
      });

      if (response.ok) {
        const durationText = validityDays === "lifetime" ? "lifetime access" : `${validityDays} days`;
        toast({ title: "Success", description: `User upgraded to Pro with ${durationText}` });
        fetchUsers();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error || "Failed to upgrade plan", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upgrade plan", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const downgradePlan = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: "free" }),
        credentials: "include",
      });

      if (response.ok) {
        toast({ title: "Success", description: "User downgraded to Free" });
        fetchUsers();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error || "Failed to downgrade plan", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to downgrade plan", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleUserStatus = async (userId: string, isCurrentlyActive: boolean) => {
    setActionLoading(userId);
    const endpoint = isCurrentlyActive ? "disable" : "enable";
    try {
      const response = await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (response.ok) {
        toast({ title: "Success", description: `User account ${isCurrentlyActive ? "disabled" : "enabled"}` });
        fetchUsers();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error || `Failed to ${endpoint} user`, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: `Failed to ${endpoint} user`, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const exportUsers = async () => {
    try {
      const response = await fetch("/api/admin/export", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users_export.csv";
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Users exported successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export users", variant: "destructive" });
    }
  };

  const bulkAction = async (action: "disable" | "enable") => {
    if (selectedUsers.length === 0) {
      toast({ title: "Error", description: "No users selected", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/admin/bulk-${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: selectedUsers }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: "Success", description: data.message });
        setSelectedUsers([]);
        fetchUsers();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: `Failed to ${action} users`, variant: "destructive" });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === users.filter(u => u.id !== user?.id).length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.filter(u => u.id !== user?.id).map(u => u.id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlanValidityStatus = (u: AdminUser) => {
    if (u.plan === "free") return null;
    if (!u.planExpiresAt) return { text: "Lifetime", color: "text-green-500" };
    
    const expiresAt = new Date(u.planExpiresAt);
    if (isNaN(expiresAt.getTime())) return { text: "Unknown", color: "text-muted-foreground" };
    
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { text: "Expired", color: "text-red-500" };
    if (daysLeft === 0) return { text: "Expires today", color: "text-orange-500" };
    if (daysLeft <= 7) return { text: `${daysLeft}d left`, color: "text-orange-500" };
    return { text: `${daysLeft}d left`, color: "text-green-500" };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </main>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-cyan-500" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <Button onClick={fetchAll} variant="outline" className="gap-2" data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="contacts" data-testid="tab-contacts" className="gap-1">
              <MessageSquare className="h-3 w-3" />
              Contacts
              {contacts.filter(c => c.status === "new").length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {contacts.filter(c => c.status === "new").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
            <TabsTrigger value="system" data-testid="tab-system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
                  <p className="text-xs text-muted-foreground">+{stats?.users.newThisMonth || 0} this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
                  <Shield className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.users.pro || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.users.total ? Math.round((stats.users.pro / stats.users.total) * 100) : 0}% of total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Operations Today</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.operations.today || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.operations.thisWeek || 0} this week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.operations.total || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.operations.thisMonth || 0} this month</p>
                </CardContent>
              </Card>
            </div>

            {stats?.operations.byOperation && stats.operations.byOperation.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Popular Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.operations.byOperation.slice(0, 5).map((op) => (
                      <div key={op.operation} className="flex items-center justify-between">
                        <span className="capitalize">{op.operation.replace(/-/g, " ")}</span>
                        <Badge variant="secondary">{op.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button onClick={exportUsers} variant="outline" className="gap-2" data-testid="button-export">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              {selectedUsers.length > 0 && (
                <>
                  <Button onClick={() => bulkAction("disable")} variant="destructive" className="gap-2" data-testid="button-bulk-disable">
                    <UserX className="h-4 w-4" />
                    Disable Selected ({selectedUsers.length})
                  </Button>
                  <Button onClick={() => bulkAction("enable")} variant="default" className="gap-2 bg-green-600 hover:bg-green-700" data-testid="button-bulk-enable">
                    <UserCheck className="h-4 w-4" />
                    Enable Selected ({selectedUsers.length})
                  </Button>
                </>
              )}
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.filter(u => u.id !== user?.id).length && users.length > 1}
                        onChange={selectAllUsers}
                        className="rounded"
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const validity = getPlanValidityStatus(u);
                    return (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell>
                          {u.id !== user?.id && (
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(u.id)}
                              onChange={() => toggleUserSelection(u.id)}
                              className="rounded"
                              data-testid={`checkbox-user-${u.id}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-email-${u.id}`}>
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.plan === "pro" ? "default" : "secondary"}
                            className={u.plan === "pro" ? "bg-gradient-to-r from-cyan-500 to-blue-500" : ""}
                            data-testid={`badge-plan-${u.id}`}
                          >
                            {u.plan.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-validity-${u.id}`}>
                          {validity ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className={validity.color}>{validity.text}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-role-${u.id}`}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? "default" : "destructive"} data-testid={`badge-status-${u.id}`}>
                            {u.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-created-${u.id}`}>
                          {formatDate(u.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {u.plan === "free" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openUpgradeDialog(u.id, u.email)}
                                disabled={actionLoading === u.id}
                                className="gap-1"
                                data-testid={`button-upgrade-${u.id}`}
                              >
                                <ArrowUp className="h-3 w-3" />
                                Upgrade
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downgradePlan(u.id)}
                                disabled={actionLoading === u.id}
                                className="gap-1"
                                data-testid={`button-downgrade-${u.id}`}
                              >
                                <ArrowDown className="h-3 w-3" />
                                Downgrade
                              </Button>
                            )}
                            {u.id !== user.id && (
                              u.isActive ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => toggleUserStatus(u.id, true)}
                                  disabled={actionLoading === u.id}
                                  className="gap-1"
                                  data-testid={`button-disable-${u.id}`}
                                >
                                  <UserX className="h-3 w-3" />
                                  Disable
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => toggleUserStatus(u.id, false)}
                                  disabled={actionLoading === u.id}
                                  className="gap-1 bg-green-600 hover:bg-green-700"
                                  data-testid={`button-enable-${u.id}`}
                                >
                                  <UserCheck className="h-3 w-3" />
                                  Enable
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="text-sm text-muted-foreground">Total users: {users.length}</div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Contact Messages
                    {contacts.filter(c => !c.isRead).length > 0 && (
                      <Badge variant="default" className="ml-1">{contacts.filter(c => !c.isRead).length} unread</Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Select value={contactFilter} onValueChange={setContactFilter}>
                      <SelectTrigger className="w-[140px] h-8" data-testid="select-contact-filter">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Messages</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="bug">Bug Reports</SelectItem>
                        <SelectItem value="feature">Feature Requests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredContacts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {contactFilter === "all" ? "No contact messages yet." : `No ${contactFilter} messages.`}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-4 rounded-lg border transition-colors ${!contact.isRead ? "border-cyan-500/30 bg-cyan-500/5" : "bg-muted/30"} ${viewingContact?.id === contact.id ? "ring-2 ring-cyan-500/50" : ""}`}
                        data-testid={`contact-${contact.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewingContact(viewingContact?.id === contact.id ? null : contact)}>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {!contact.isRead && <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />}
                              <span className={`font-semibold ${!contact.isRead ? "text-foreground" : "text-muted-foreground"}`}>{contact.name}</span>
                              <Badge variant={contact.status === "new" ? "default" : contact.status === "replied" ? "outline" : "secondary"} className="text-[10px] px-1.5 py-0">
                                {contact.status}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                <Tag className="h-2.5 w-2.5" />
                                {categoryLabels[contact.category] || contact.category}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                {contact.source === "mobile" ? <Smartphone className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                                {contact.source === "mobile" ? "Mobile" : "Web"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <Mail className="h-3 w-3" />
                              <a href={`mailto:${contact.email}`} className="hover:text-cyan-500" onClick={(e) => e.stopPropagation()}>{contact.email}</a>
                              <span>·</span>
                              <span>{formatDateTime(contact.createdAt)}</span>
                            </div>
                            {contact.subject && <p className="font-medium text-sm mb-1">{contact.subject}</p>}
                            {viewingContact?.id !== contact.id && (
                              <p className="text-sm text-muted-foreground truncate">{contact.message}</p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7" title={contact.isRead ? "Mark unread" : "Mark read"} onClick={() => toggleRead(contact.id, !contact.isRead)} data-testid={`button-toggle-read-${contact.id}`}>
                              {contact.isRead ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Reply" onClick={() => { setReplyDialog({ open: true, contact }); setReplyText(""); }} data-testid={`button-reply-${contact.id}`}>
                              <Reply className="h-3.5 w-3.5" />
                            </Button>
                            {contact.status !== "archived" && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Archive" onClick={() => updateContactStatus(contact.id, "archived")} data-testid={`button-archive-${contact.id}`}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {viewingContact?.id === contact.id && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Full Message</p>
                              <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
                            </div>
                            {contact.adminReply && (
                              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                                <p className="text-xs font-medium text-cyan-500 mb-1">Your Reply {contact.repliedAt && `· ${formatDateTime(contact.repliedAt)}`}</p>
                                <p className="text-sm whitespace-pre-wrap">{contact.adminReply}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              {contact.status === "new" && (
                                <Button size="sm" variant="outline" onClick={() => updateContactStatus(contact.id, "read")}>Mark Read</Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => { setReplyDialog({ open: true, contact }); setReplyText(""); }}>
                                <Reply className="h-3 w-3 mr-1" />
                                {contact.adminReply ? "Reply Again" : "Reply"}
                              </Button>
                              {contact.status !== "archived" && (
                                <Button size="sm" variant="ghost" onClick={() => updateContactStatus(contact.id, "archived")}>Archive</Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog open={replyDialog.open} onOpenChange={(open) => { if (!open) { setReplyDialog({ open: false, contact: null }); setReplyText(""); } }}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Reply to {replyDialog.contact?.name}</DialogTitle>
                  <DialogDescription>
                    Your reply will be sent to {replyDialog.contact?.email} via email.
                  </DialogDescription>
                </DialogHeader>
                {replyDialog.contact && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Original Message</p>
                      <p className="text-sm">{replyDialog.contact.message}</p>
                    </div>
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={5}
                      data-testid="textarea-reply"
                    />
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setReplyDialog({ open: false, contact: null }); setReplyText(""); }}>Cancel</Button>
                  <Button onClick={sendReply} disabled={replyLoading || !replyText.trim()} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-send-reply">
                    {replyLoading ? "Sending..." : <><Send className="h-3 w-3 mr-1" /> Send Reply</>}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {activityLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No activity logs yet</p>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                        <div className="space-y-1">
                          <p className="font-medium capitalize">{log.operation.replace(/-/g, " ")}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.userEmail || log.ipAddress || "Anonymous"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={log.status === "success" ? "default" : "destructive"}>
                            {log.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                {health ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${health.status === "healthy" ? "bg-green-500" : "bg-orange-500"}`} />
                      <span className="font-medium capitalize">{health.status}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        Last checked: {formatDateTime(health.timestamp)}
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <span>Database</span>
                        <Badge variant={health.components.database === "healthy" ? "default" : "destructive"}>
                          {health.components.database}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <span>PDF Backend</span>
                        <Badge variant={health.components.pdfBackend === "healthy" ? "default" : "destructive"}>
                          {health.components.pdfBackend}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <span>Server</span>
                        <Badge variant={health.components.server === "healthy" ? "default" : "destructive"}>
                          {health.components.server}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading health status...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={upgradeDialog.open} onOpenChange={(open) => setUpgradeDialog({ ...upgradeDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Pro</DialogTitle>
            <DialogDescription>
              Upgrade {upgradeDialog.email} to Pro plan. Select the validity period.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Plan Duration</label>
            <Select value={validityDays} onValueChange={setValidityDays}>
              <SelectTrigger data-testid="select-validity">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days (1 month)</SelectItem>
                <SelectItem value="90">90 days (3 months)</SelectItem>
                <SelectItem value="180">180 days (6 months)</SelectItem>
                <SelectItem value="365">365 days (1 year)</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialog({ open: false, userId: "", email: "" })}>
              Cancel
            </Button>
            <Button 
              onClick={confirmUpgrade}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
              data-testid="button-confirm-upgrade"
            >
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
