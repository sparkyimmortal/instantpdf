import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcessingHistory, type ProcessingHistoryItem } from "@/hooks/use-processing-history";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import {
  Clock,
  Trash2,
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  BarChart3,
  ArrowRight,
  X,
  History as HistoryIcon,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";

type StatusFilter = "all" | "success" | "failed";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function History() {
  const { history, clearHistory, removeFromHistory } = useProcessingHistory();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return history.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (searchQuery && !item.fileName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [history, statusFilter, searchQuery]);

  const successCount = history.filter((i) => i.status === "success").length;
  const failedCount = history.filter((i) => i.status === "failed").length;
  const successRate = history.length > 0 ? Math.round((successCount / history.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main className="container px-4 md:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <HistoryIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
                data-testid="text-history-title"
              >
                Processing History
              </h1>
              <p className="text-sm text-muted-foreground">View all your past PDF operations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 flex items-center gap-4" data-testid="stat-total-operations">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{history.length}</p>
                <p className="text-xs text-muted-foreground">Total Operations</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4" data-testid="stat-success-rate">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate ({successCount} passed)</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4" data-testid="stat-failed-count">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{failedCount}</p>
                <p className="text-xs text-muted-foreground">Failed Operations</p>
              </div>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-history"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "success", "failed"] as StatusFilter[]).map((f) => (
                <Button
                  key={f}
                  variant={statusFilter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(f)}
                  className={
                    statusFilter === f
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 text-white"
                      : ""
                  }
                  data-testid={`button-filter-${f}`}
                >
                  {f === "all" && <Filter className="h-3.5 w-3.5 mr-1.5" />}
                  {f === "success" && <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                  {f === "failed" && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-muted-foreground hover:text-red-500"
                  data-testid="button-clear-all-history"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {history.length === 0 ? (
            <Card className="p-12 text-center" data-testid="empty-state-history">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No history yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Your PDF processing history will appear here once you start using the tools.
              </p>
              <Link href="/">
                <Button
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  data-testid="button-explore-tools"
                >
                  Explore Tools
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center" data-testid="empty-state-filtered">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No matching results</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4" data-testid="text-results-count">
                Showing {filtered.length} of {history.length} operations
              </p>

              <div className="hidden md:block">
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-[1fr_140px_120px_100px_100px_160px_60px] gap-4 px-4 py-3 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>File Name</span>
                    <span>Tool</span>
                    <span>Operation</span>
                    <span>Size</span>
                    <span>Status</span>
                    <span>Date</span>
                    <span></span>
                  </div>
                  <AnimatePresence>
                    {filtered.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        layout
                        className="grid grid-cols-[1fr_140px_120px_100px_100px_160px_60px] gap-4 px-4 py-3 border-b last:border-b-0 items-center hover:bg-muted/30 transition-colors group"
                        data-testid={`history-row-${item.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate" title={item.fileName} data-testid={`text-filename-${item.id}`}>
                            {item.fileName}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground truncate" data-testid={`text-tool-${item.id}`}>
                          {item.toolName}
                        </span>
                        <span className="text-sm text-muted-foreground truncate" data-testid={`text-operation-${item.id}`}>
                          {item.operation}
                        </span>
                        <span className="text-sm text-muted-foreground" data-testid={`text-size-${item.id}`}>
                          {formatFileSize(item.fileSize)}
                        </span>
                        <span data-testid={`text-status-${item.id}`}>
                          {item.status === "success" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                              <XCircle className="h-3 w-3" /> Failed
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground" data-testid={`text-timestamp-${item.id}`}>
                          {format(item.timestamp, "MMM d, yyyy HH:mm")}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() => removeFromHistory(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Card>
              </div>

              <div className="md:hidden grid grid-cols-1 gap-3">
                <AnimatePresence>
                  {filtered.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      layout
                    >
                      <Card
                        className="p-4 group hover:shadow-md transition-shadow"
                        data-testid={`history-card-${item.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              item.status === "success" ? "bg-green-500/10" : "bg-red-500/10"
                            }`}
                          >
                            {item.status === "success" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" title={item.fileName} data-testid={`text-filename-${item.id}`}>
                              {item.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.toolName} · {item.operation}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatFileSize(item.fileSize)} · {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Link href={`/${item.toolId}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                data-testid={`button-redo-${item.id}`}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={() => removeFromHistory(item.id)}
                              data-testid={`button-remove-${item.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
