import { useState, useEffect, useCallback } from "react";

export interface ProcessingHistoryItem {
  id: string;
  fileName: string;
  toolId: string;
  toolName: string;
  operation: string;
  fileSize: number;
  timestamp: number;
  status: "success" | "failed";
}

const HISTORY_KEY = "instantpdf_processing_history";
const MAX_HISTORY = 50;

export function useProcessingHistory() {
  const [history, setHistory] = useState<ProcessingHistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = useCallback(
    (item: Omit<ProcessingHistoryItem, "id" | "timestamp">) => {
      const newItem: ProcessingHistoryItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newItem, ...prev].slice(0, MAX_HISTORY));
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { history, addToHistory, clearHistory, removeFromHistory };
}
