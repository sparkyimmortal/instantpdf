import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, FileText, CheckCircle2, XCircle, ArrowRight, X } from "lucide-react";
import { Link } from "wouter";
import { useProcessingHistory, type ProcessingHistoryItem } from "@/hooks/use-processing-history";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

export function ProcessingHistory() {
  const { history, clearHistory, removeFromHistory } = useProcessingHistory();
  const { t } = useLanguage();

  if (history.length === 0) return null;

  return (
    <section className="py-8 bg-muted/20" data-testid="processing-history">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-display font-bold">{t("section.processingHistory")}</h2>
            <span className="text-sm text-muted-foreground">({history.length})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-clear-history"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("section.clearAll")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {history.slice(0, 8).map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onRemove={() => removeFromHistory(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function HistoryCard({
  item,
  onRemove,
}: {
  item: ProcessingHistoryItem;
  onRemove: () => void;
}) {
  const timeAgo = formatDistanceToNow(item.timestamp, { addSuffix: true });
  const sizeFormatted =
    item.fileSize < 1024 * 1024
      ? `${(item.fileSize / 1024).toFixed(1)} KB`
      : `${(item.fileSize / 1024 / 1024).toFixed(2)} MB`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <Card
        className="p-4 group hover:shadow-md transition-shadow"
        data-testid={`history-item-${item.id}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              item.status === "success"
                ? "bg-green-500/10"
                : "bg-red-500/10"
            }`}
          >
            {item.status === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={item.fileName}>
              {item.fileName}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.toolName} · {sizeFormatted}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/${item.toolId}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`button-redo-${item.id}`}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-500"
              onClick={onRemove}
              data-testid={`button-remove-history-${item.id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
