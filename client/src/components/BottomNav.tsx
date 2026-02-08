import { useLocation } from "wouter";
import { Home, LayoutDashboard, FilePlus, Scissors, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { hapticFeedback } from "@/hooks/use-haptic";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/merge-pdf", label: "Merge", icon: FilePlus },
  { href: "/split-pdf", label: "Split", icon: Scissors },
  { href: "/compress-pdf", label: "Compress", icon: FileDown },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border/50 safe-area-bottom" data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1" data-testid={`bottomnav-${item.label.toLowerCase()}`} onClick={() => hapticFeedback("selection")}>
              <motion.div
                className="flex flex-col items-center justify-center gap-0.5 py-1 relative"
                whileTap={{ scale: 0.85 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? "text-cyan-500" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-cyan-500" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
