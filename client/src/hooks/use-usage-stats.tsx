import { useState, useEffect, useCallback } from "react";

export interface UsageStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalFilesProcessed: number;
  totalDataProcessed: number;
  toolUsageCounts: Record<string, number>;
  firstUsed: number | null;
  streakDays: number;
  lastUsedDate: string | null;
}

const STATS_KEY = "instantpdf_usage_stats";

const defaultStats: UsageStats = {
  totalOperations: 0,
  successfulOperations: 0,
  failedOperations: 0,
  totalFilesProcessed: 0,
  totalDataProcessed: 0,
  toolUsageCounts: {},
  firstUsed: null,
  streakDays: 0,
  lastUsedDate: null,
};

export function useUsageStats() {
  const [stats, setStats] = useState<UsageStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    } catch {
      return defaultStats;
    }
  });

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  const recordOperation = useCallback(
    (data: {
      toolId: string;
      fileCount: number;
      totalSize: number;
      success: boolean;
    }) => {
      setStats((prev) => {
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];

        let streakDays = prev.streakDays;
        if (prev.lastUsedDate === yesterday) {
          streakDays += 1;
        } else if (prev.lastUsedDate !== today) {
          streakDays = 1;
        }

        return {
          ...prev,
          totalOperations: prev.totalOperations + 1,
          successfulOperations:
            prev.successfulOperations + (data.success ? 1 : 0),
          failedOperations: prev.failedOperations + (data.success ? 0 : 1),
          totalFilesProcessed: prev.totalFilesProcessed + data.fileCount,
          totalDataProcessed: prev.totalDataProcessed + data.totalSize,
          toolUsageCounts: {
            ...prev.toolUsageCounts,
            [data.toolId]:
              (prev.toolUsageCounts[data.toolId] || 0) + 1,
          },
          firstUsed: prev.firstUsed || Date.now(),
          streakDays,
          lastUsedDate: today,
        };
      });
    },
    []
  );

  const resetStats = useCallback(() => {
    setStats(defaultStats);
  }, []);

  return { stats, recordOperation, resetStats };
}
