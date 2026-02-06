import { useState, useEffect, useCallback } from "react";

export interface RecentFile {
  id: string;
  name: string;
  tool: string;
  toolName: string;
  timestamp: number;
  size: number;
}

const RECENT_FILES_KEY = "instantpdf_recent_files";
const MAX_RECENT_FILES = 10;

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(RECENT_FILES_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles));
  }, [recentFiles]);

  const addRecentFile = useCallback((file: Omit<RecentFile, "id" | "timestamp">) => {
    const newFile: RecentFile = {
      ...file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.name !== file.name || f.tool !== file.tool);
      return [newFile, ...filtered].slice(0, MAX_RECENT_FILES);
    });
  }, []);

  const clearRecentFiles = useCallback(() => {
    setRecentFiles([]);
  }, []);

  const removeRecentFile = useCallback((id: string) => {
    setRecentFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  return { recentFiles, addRecentFile, clearRecentFiles, removeRecentFile };
}
