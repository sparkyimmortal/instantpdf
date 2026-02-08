import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Link } from "wouter";
import { useFavorites, type Tool } from "@/hooks/use-tools";
import { hapticFeedback } from "@/hooks/use-haptic";

export function FavoritesBar() {
  const { getFavoriteTools } = useFavorites();
  const favoriteTools = getFavoriteTools();

  if (favoriteTools.length === 0) return null;

  return (
    <section className="py-6 border-b border-border/30" data-testid="favorites-bar">
      <div className="container px-4 md:px-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <h2 className="text-lg font-display font-bold">Your Favorites</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          <AnimatePresence>
            {favoriteTools.map((tool: Tool, i: number) => (
              <motion.div
                key={tool.href}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0"
              >
                <Link href={tool.href} onClick={() => hapticFeedback("selection")}>
                  <Card
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:shadow-md transition-all hover:border-cyan-500/30 cursor-pointer min-w-0"
                    data-testid={`favorite-tool-${tool.href.replace(/\//g, '-').slice(1)}`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tool.color} flex-shrink-0`}>
                      <tool.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">{tool.title}</span>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
