import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import {
  Star, Clock, Pin, X, ArrowRight, Trash2, Search, Zap, ChevronRight
} from "lucide-react";
import { useFavorites, useRecentTools, allTools, toolCategories, type Tool } from "@/hooks/use-tools";
import { Input } from "@/components/ui/input";

function DashboardToolCard({ tool, isPinned, onTogglePin, showUnpin }: {
  tool: Tool & { lastUsed?: number };
  isPinned: boolean;
  onTogglePin: () => void;
  showUnpin?: boolean;
}) {
  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="relative group/card"
      layout
    >
      <Link href={tool.href} data-testid={`dashboard-tool-${tool.href.replace(/\//g, '-').slice(1)}`}>
        <Card className="h-full overflow-hidden p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer border-border/50 hover:border-cyan-500/30 bg-card">
          <div className="flex items-start gap-3">
            <motion.div
              className={`shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl ${tool.color} transition-all duration-300`}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <tool.icon className="h-5 w-5" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold font-display tracking-tight group-hover/card:text-cyan-600 dark:group-hover/card:text-cyan-400 transition-colors truncate">
                {tool.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 mt-0.5">
                {tool.description}
              </p>
              {tool.lastUsed && (
                <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(tool.lastUsed)}
                </p>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-300 origin-left" />
        </Card>
      </Link>
      {showUnpin && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin();
          }}
          className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-200 ${
            isPinned
              ? "bg-yellow-500/20 text-yellow-500 dark:text-yellow-400"
              : "bg-muted/50 text-muted-foreground opacity-0 group-hover/card:opacity-100"
          }`}
          data-testid={`button-unpin-${tool.href.replace(/\//g, '-').slice(1)}`}
        >
          {isPinned ? <Star className="h-3.5 w-3.5 fill-current" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
      )}
    </motion.div>
  );
}

function AddToolModal({ onClose, favorites, onToggle }: {
  onClose: () => void;
  favorites: string[];
  onToggle: (href: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? allTools.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      )
    : allTools;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-lg">Pin Tools to Dashboard</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" data-testid="button-close-add-tool">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-muted/50"
              data-testid="input-pin-search"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {toolCategories.map(cat => {
            const catTools = filtered.filter(t => cat.tools.some(ct => ct.href === t.href));
            if (catTools.length === 0) return null;
            return (
              <div key={cat.name}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.name}</h4>
                <div className="space-y-1">
                  {catTools.map(tool => {
                    const pinned = favorites.includes(tool.href);
                    return (
                      <button
                        key={tool.href}
                        onClick={() => onToggle(tool.href)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                          pinned ? "bg-yellow-500/10 border border-yellow-500/20" : "hover:bg-muted border border-transparent"
                        }`}
                        data-testid={`button-toggle-pin-${tool.href.replace(/\//g, '-').slice(1)}`}
                      >
                        <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${tool.color}`}>
                          <tool.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium block truncate">{tool.title}</span>
                          <span className="text-xs text-muted-foreground block truncate">{tool.description}</span>
                        </div>
                        <Star className={`h-4 w-4 shrink-0 transition-colors ${pinned ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/40"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No tools found</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { favorites, toggleFavorite, getFavoriteTools } = useFavorites();
  const { getRecentTools, clearRecent } = useRecentTools();
  const [showAddModal, setShowAddModal] = useState(false);

  const pinnedTools = getFavoriteTools();
  const recentTools = getRecentTools();

  const suggestedTools = allTools
    .filter(t => !favorites.includes(t.href))
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container px-4 md:px-6 py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground" data-testid="text-dashboard-title">
                My Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Your personalized PDF workspace</p>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-all-tools">
                All Tools
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-lg sm:text-xl font-display font-bold text-foreground" data-testid="text-pinned-title">
                    Pinned Tools
                  </h2>
                  <span className="text-sm text-muted-foreground">({pinnedTools.length})</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="gap-1.5"
                  data-testid="button-add-pin"
                >
                  <Pin className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Tools</span>
                </Button>
              </div>

              {pinnedTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {pinnedTools.map(tool => (
                      <DashboardToolCard
                        key={tool.href}
                        tool={tool}
                        isPinned={true}
                        onTogglePin={() => toggleFavorite(tool.href)}
                        showUnpin={true}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed border-2 border-border/50 bg-card/50">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Star className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">No pinned tools yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pin your most-used tools for quick access
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddModal(true)}
                      className="mt-2 gap-1.5"
                      data-testid="button-add-first-pin"
                    >
                      <Pin className="h-4 w-4" />
                      Pin Your First Tool
                    </Button>
                  </div>
                </Card>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                  <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-lg sm:text-xl font-display font-bold text-foreground" data-testid="text-recent-title">
                    Recently Used
                  </h2>
                  {recentTools.length > 0 && (
                    <span className="text-sm text-muted-foreground">({recentTools.length})</span>
                  )}
                </div>
                {recentTools.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecent}
                    className="gap-1.5 text-muted-foreground hover:text-destructive"
                    data-testid="button-clear-recent"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                )}
              </div>

              {recentTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {recentTools.map(tool => (
                      <DashboardToolCard
                        key={tool.href}
                        tool={tool}
                        isPinned={favorites.includes(tool.href)}
                        onTogglePin={() => toggleFavorite(tool.href)}
                        showUnpin={false}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed border-2 border-border/50 bg-card/50">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">No recent activity</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tools you use will appear here for quick access
                      </p>
                    </div>
                    <Link href="/">
                      <Button variant="outline" size="sm" className="mt-2 gap-1.5" data-testid="button-browse-tools">
                        <Search className="h-4 w-4" />
                        Browse Tools
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </section>

            {suggestedTools.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full" />
                  <Zap className="h-5 w-5 text-violet-500" />
                  <h2 className="text-lg sm:text-xl font-display font-bold text-foreground" data-testid="text-suggested-title">
                    Suggested for You
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestedTools.map(tool => (
                    <DashboardToolCard
                      key={tool.href}
                      tool={tool}
                      isPinned={false}
                      onTogglePin={() => toggleFavorite(tool.href)}
                      showUnpin={false}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {showAddModal && (
          <AddToolModal
            onClose={() => setShowAddModal(false)}
            favorites={favorites}
            onToggle={toggleFavorite}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
