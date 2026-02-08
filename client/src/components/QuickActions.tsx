import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Zap, ArrowRight, Clock, TrendingUp, Sparkles,
  FilePlus, Scissors, Minimize2, RotateCw, Lock, Image, FileText,
  Layers, LayoutGrid
} from "lucide-react";
import { useRecentTools, getToolByHref, type Tool } from "@/hooks/use-tools";
import { useUsageStats } from "@/hooks/use-usage-stats";
import { formatDistanceToNow } from "date-fns";

const popularTools = [
  { href: "/merge-pdf", icon: FilePlus, label: "Merge", color: "from-red-500 to-rose-600" },
  { href: "/split-pdf", icon: Scissors, label: "Split", color: "from-orange-500 to-amber-600" },
  { href: "/compress-pdf", icon: Minimize2, label: "Compress", color: "from-green-500 to-emerald-600" },
  { href: "/rotate-pdf", icon: RotateCw, label: "Rotate", color: "from-purple-500 to-violet-600" },
  { href: "/protect-pdf", icon: Lock, label: "Protect", color: "from-slate-500 to-gray-600" },
  { href: "/jpg-to-pdf", icon: Image, label: "JPG to PDF", color: "from-yellow-500 to-orange-600" },
  { href: "/pdf-to-jpg", icon: Image, label: "PDF to JPG", color: "from-amber-500 to-yellow-600" },
  { href: "/batch-process", icon: Layers, label: "Batch", color: "from-orange-500 to-red-600" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function QuickActions() {
  const { getRecentTools } = useRecentTools();
  const { stats } = useUsageStats();
  const recentTools = getRecentTools();

  const topToolEntries = Object.entries(stats.toolUsageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const topTools = topToolEntries
    .map(([href]) => getToolByHref(href))
    .filter(Boolean) as Tool[];

  const hasActivity = stats.totalOperations > 0 || recentTools.length > 0;

  return (
    <section className="py-8 sm:py-10 border-b border-border/30" data-testid="quick-actions">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold" data-testid="text-greeting">
                {getGreeting()}
              </h2>
              <p className="text-sm text-muted-foreground">
                {hasActivity
                  ? `${stats.totalOperations} operations completed`
                  : "Pick a tool to get started"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
            {popularTools.map((tool, i) => (
              <motion.div
                key={tool.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={tool.href}>
                  <Card
                    className="p-3 text-center cursor-pointer hover:shadow-lg hover:scale-105 transition-all group border-border/50"
                    data-testid={`quick-action-${tool.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className={`h-10 w-10 mx-auto rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-2 group-hover:shadow-lg transition-shadow`}>
                      <tool.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-foreground/80 block truncate">
                      {tool.label}
                    </span>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {(topTools.length > 0 || recentTools.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topTools.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="p-4" data-testid="card-top-tools">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-cyan-500" />
                      <h3 className="text-sm font-semibold">Your Top Tools</h3>
                    </div>
                    <div className="space-y-2">
                      {topTools.map((tool) => (
                        <Link key={tool.href} href={tool.href}>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group" data-testid={`top-tool-link-${tool.href.slice(1)}`}>
                            <div className={`h-8 w-8 rounded-lg ${tool.color} flex items-center justify-center`}>
                              <tool.icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium flex-1">{tool.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {stats.toolUsageCounts[tool.href]}x
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {recentTools.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-4" data-testid="card-recent-tools">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Recently Used</h3>
                    </div>
                    <div className="space-y-2">
                      {recentTools.slice(0, 4).map((tool) => (
                        <Link key={tool.href} href={tool.href}>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group" data-testid={`recent-tool-link-${tool.href.slice(1)}`}>
                            <div className={`h-8 w-8 rounded-lg ${tool.color} flex items-center justify-center`}>
                              <tool.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium block">{tool.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(tool.lastUsed, { addSuffix: true })}
                              </span>
                            </div>
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
