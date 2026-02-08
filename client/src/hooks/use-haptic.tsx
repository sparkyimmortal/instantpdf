import { useCallback } from "react";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "selection";

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  error: [50, 30, 50],
  selection: 5,
};

export function useHaptic() {
  const vibrate = useCallback((pattern: HapticPattern = "light") => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(patterns[pattern]);
      } catch {}
    }
  }, []);

  return { vibrate };
}

export function hapticFeedback(pattern: HapticPattern = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(patterns[pattern]);
    } catch {}
  }
}
