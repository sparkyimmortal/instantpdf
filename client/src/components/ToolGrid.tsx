import { useState, useEffect, useMemo } from "react";
import { Search, Star, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { toolCategories, toolTips, useFavorites, type Tool } from "@/hooks/use-tools";

function ToolCard({ tool, isFavorite, onToggleFavorite, index }: { 
  tool: Tool; 
  isFavorite: boolean; 
  onToggleFavorite: () => void;
  index: number;
}) {
  const tip = toolTips[tool.href];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="h-full relative group/card"
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`absolute top-3 right-3 z-10 p-1.5 rounded-full transition-all duration-200 ${
          isFavorite 
            ? "bg-yellow-500/20 text-yellow-400" 
            : "bg-muted/50 text-muted-foreground opacity-0 group-hover/card:opacity-100"
        }`}
        data-testid={`button-favorite-${tool.href.replace(/\//g, '-').slice(1)}`}
      >
        <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={tool.href || "#"} data-testid={`tool-card-${tool.href?.replace(/\//g, '-').slice(1)}`}>
            <Card className="group relative h-full overflow-hidden p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer border-border/50 hover:border-cyan-500/30 flex flex-col bg-card">
              <motion.div 
                className={`mb-3 sm:mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${tool.color} transition-all duration-300`}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <tool.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.div>
              <h3 className="mb-1 sm:mb-2 text-lg sm:text-xl font-bold font-display tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {tool.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                {tool.description}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Card>
          </Link>
        </TooltipTrigger>
        {tip && (
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{tip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </motion.div>
  );
}

const categoryFilters = [
  { id: "all", label: "All Tools" },
  { id: "organize", label: "Organize" },
  { id: "edit", label: "Edit" },
  { id: "convert-to", label: "Convert to PDF" },
  { id: "convert-from", label: "Convert from PDF" },
  { id: "security", label: "Security" },
  { id: "optimize", label: "Optimize" },
];

const categoryMapping: Record<string, string> = {
  "Organize PDF": "organize",
  "Optimize PDF": "optimize",
  "Convert to PDF": "convert-to",
  "Convert from PDF": "convert-from",
  "Edit PDF": "edit",
  "PDF Security": "security",
};

export function ToolGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("tool-search");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allTools = useMemo(() => 
    toolCategories.flatMap(cat => cat.tools),
    []
  );

  const favoriteTools = useMemo(() => 
    allTools.filter(tool => favorites.includes(tool.href)),
    [allTools, favorites]
  );

  const filteredCategories = useMemo(() => {
    let categories = toolCategories;
    
    if (selectedCategory !== "all") {
      categories = categories.filter(cat => categoryMapping[cat.name] === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      categories = categories
        .map(category => ({
          ...category,
          tools: category.tools.filter(tool =>
            tool.title.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query)
          )
        }))
        .filter(category => category.tools.length > 0);
    }
    
    return categories;
  }, [searchQuery, selectedCategory]);

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  return (
    <section id="tools" className="py-12 sm:py-16 lg:py-20 bg-background scroll-mt-4">
      <div className="container px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center space-y-4 text-center mb-10 sm:mb-16"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block rounded-full bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-600 dark:text-cyan-400 font-medium border border-cyan-500/20"
          >
            Complete PDF Solution
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tighter md:text-4xl text-foreground">
            All the tools you need
          </h2>
          <p className="max-w-[700px] text-muted-foreground text-base sm:text-lg md:text-xl px-4">
            Edit, convert, and manage your PDFs with our comprehensive suite of free tools.
          </p>
          
          <div className="relative w-full max-w-md mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="tool-search"
              type="text"
              placeholder="Search tools... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 bg-muted/50 border-border/50 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              data-testid="input-tool-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-clear-search"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categoryFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedCategory(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === filter.id
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                }`}
                data-testid={`filter-${filter.id}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="space-y-10 sm:space-y-16">
          <AnimatePresence>
            {favoriteTools.length > 0 && !searchQuery && selectedCategory === "all" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground/90 border-b border-border/50 pb-2 flex items-center gap-2 flex-1">
                    <span className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    Favorites
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {favoriteTools.map((tool, index) => (
                    <ToolCard
                      key={`fav-${tool.href}`}
                      tool={tool}
                      isFavorite={true}
                      onToggleFavorite={() => toggleFavorite(tool.href)}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredCategories.map((category, catIndex) => {
            const isCollapsed = collapsedCategories.includes(category.name);
            
            return (
              <motion.div 
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: catIndex * 0.1 }}
              >
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full text-left mb-4 sm:mb-6 group"
                  data-testid={`button-toggle-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground/90 border-b border-border/50 pb-2 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                    {category.name}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({category.tools.length})
                    </span>
                    <motion.span
                      animate={{ rotate: isCollapsed ? 0 : 90 }}
                      className="ml-auto text-muted-foreground group-hover:text-foreground transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.span>
                  </h3>
                </button>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {category.tools.map((tool, index) => (
                          <ToolCard
                            key={tool.href}
                            tool={tool}
                            isFavorite={isFavorite(tool.href)}
                            onToggleFavorite={() => toggleFavorite(tool.href)}
                            index={index}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {searchQuery && filteredCategories.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground text-lg">
                No tools found for "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
                data-testid="button-clear-search-results"
              >
                Clear search
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
