import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const label = theme === "system" ? "System" : resolvedTheme === "dark" ? "Dark" : "Light";

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      onClick={cycleTheme}
      data-testid="button-theme-toggle"
      className="relative gap-2"
    >
      <AnimatePresence mode="wait">
        {theme === "system" ? (
          <motion.div key="system" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <Monitor className="h-4 w-4" />
          </motion.div>
        ) : resolvedTheme === "dark" ? (
          <motion.div key="dark" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <Moon className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div key="light" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <Sun className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
      {showLabel && <span className="text-xs">{label}</span>}
      {!showLabel && <span className="sr-only">Toggle theme ({label})</span>}
    </Button>
  );
}
