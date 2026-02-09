import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3, FileText, HardDrive, CheckCircle2,
  XCircle, Flame, Calendar, RotateCcw, TrendingUp,
} from "lucide-react";
import { useUsageStats } from "@/hooks/use-usage-stats";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function UsageStatsDashboard() {
  const { stats, resetStats } = useUsageStats();
  const { t } = useLanguage();

  if (stats.totalOperations === 0) return null;

  const successRate = stats.totalOperations > 0
    ? Math.round((stats.successfulOperations / stats.totalOperations) * 100)
    : 0;

  const topTools = Object.entries(stats.toolUsageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const statCards = [
    {
      label: t("stats.totalOps"),
      value: stats.totalOperations.toString(),
      icon: BarChart3,
      color: "from-cyan-500 to-blue-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: t("stats.filesProcessed"),
      value: stats.totalFilesProcessed.toString(),
      icon: FileText,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-500/10",
    },
    {
      label: t("stats.dataProcessed"),
      value: formatBytes(stats.totalDataProcessed),
      icon: HardDrive,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: t("stats.successRate"),
      value: `${successRate}%`,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: t("stats.dayStreak"),
      value: stats.streakDays.toString(),
      icon: Flame,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: t("stats.memberSince"),
      value: stats.firstUsed
        ? formatDistanceToNow(stats.firstUsed, { addSuffix: false })
        : t("stats.today"),
      icon: Calendar,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  return (
    <section className="py-8 sm:py-12" data-testid="usage-stats">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-500" />
            <h2 className="text-xl font-display font-bold">{t("section.yourStats")}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetStats}
            className="text-muted-foreground hover:text-foreground text-xs"
            data-testid="button-reset-stats"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {t("stats.reset")}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 text-center hover:shadow-md transition-shadow" data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor} mb-2`}>
                  <stat.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className={`text-xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {topTools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-4"
          >
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{t("stats.mostUsed")}</h3>
              <div className="space-y-2">
                {topTools.map(([toolId, count], i) => {
                  const maxCount = topTools[0][1] as number;
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={toolId} className="flex items-center gap-3" data-testid={`top-tool-${i}`}>
                      <span className="text-sm font-medium w-32 truncate capitalize">
                        {t(`tool.${toolId}` as any) || toolId.replace(/-/g, " ")}
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card className="p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <div className="text-lg font-bold">{stats.successfulOperations}</div>
              <div className="text-xs text-muted-foreground">{t("stats.successful")}</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <div className="text-lg font-bold">{stats.failedOperations}</div>
              <div className="text-xs text-muted-foreground">{t("stats.failed")}</div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
