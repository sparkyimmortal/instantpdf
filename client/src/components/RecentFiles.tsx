import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, X, Trash2, FileText, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useRecentFiles, RecentFile } from "@/hooks/use-recent-files";
import { formatDistanceToNow } from "date-fns";

export function RecentFiles() {
  const { recentFiles, clearRecentFiles, removeRecentFile } = useRecentFiles();

  if (recentFiles.length === 0) return null;

  return (
    <section className="py-8 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-display font-bold">Recent Files</h2>
            <span className="text-sm text-muted-foreground">({recentFiles.length})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRecentFiles}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-clear-recent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {recentFiles.map((file) => (
              <RecentFileCard
                key={file.id}
                file={file}
                onRemove={() => removeRecentFile(file.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function RecentFileCard({ file, onRemove }: { file: RecentFile; onRemove: () => void }) {
  const timeAgo = formatDistanceToNow(file.timestamp, { addSuffix: true });
  const sizeFormatted = file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(1)} KB`
    : `${(file.size / 1024 / 1024).toFixed(2)} MB`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <Card className="p-4 group hover:shadow-md transition-shadow" data-testid={`recent-file-${file.id}`}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-cyan-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {file.toolName} · {sizeFormatted}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {timeAgo}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={file.tool}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`button-reopen-${file.id}`}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-500"
              onClick={onRemove}
              data-testid={`button-remove-recent-${file.id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
