import { useState, useEffect } from "react";
import { Loader2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pdfFetch } from "@/lib/pdfApi";

interface PreviewPage {
  pageNumber: number;
  imageUrl: string;
}

interface PdfPreviewProps {
  file: File;
  className?: string;
  showAllPages?: boolean;
  maxPages?: number;
  selectedPage?: number;
  onPageSelect?: (page: number) => void;
}

export function PdfPreview({
  file,
  className,
  showAllPages = false,
  maxPages = 8,
  selectedPage,
  onPageSelect,
}: PdfPreviewProps) {
  const [pages, setPages] = useState<PreviewPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setCurrentPage(0);

    async function loadPreview() {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await pdfFetch("/api/pdf/preview", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to load preview");
        }

        const data = await response.json();
        if (!cancelled && data.pages) {
          const pagesData = data.pages.map((p: PreviewPage) => {
            let url = p.imageUrl;
            if (url.startsWith("http://") || url.startsWith("https://")) {
              const urlObj = new URL(url);
              url = urlObj.pathname;
            }
            return { ...p, imageUrl: url };
          });
          setPages(pagesData.slice(0, showAllPages ? undefined : maxPages));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Preview failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [file, showAllPages, maxPages]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-6 bg-muted/50 rounded-lg", className)} data-testid="preview-loading">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Generating preview...</span>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg", className)} data-testid="preview-error">
        <FileText className="w-10 h-10 text-muted-foreground mb-2" />
        <span className="text-muted-foreground text-sm">Preview not available</span>
      </div>
    );
  }

  if (!showAllPages && pages.length > 0) {
    const page = pages[currentPage];
    return (
      <div className={cn("bg-muted/50 rounded-lg p-4", className)} data-testid="preview-single">
        <div className="relative">
          <img
            src={page.imageUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-auto rounded border border-border shadow-sm"
            data-testid={`preview-image-${page.pageNumber}`}
          />
          {pages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 rounded-full px-3 py-1 shadow">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground" data-testid="text-page-info">
                {currentPage + 1} / {pages.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                disabled={currentPage === pages.length - 1}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", className)} data-testid="preview-grid">
      {pages.map((page) => (
        <div
          key={page.pageNumber}
          className={cn(
            "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:shadow-md",
            selectedPage === page.pageNumber
              ? "border-primary ring-2 ring-primary/30"
              : "border-border hover:border-border/80"
          )}
          onClick={() => onPageSelect?.(page.pageNumber)}
          data-testid={`preview-page-${page.pageNumber}`}
        >
          <img
            src={page.imageUrl}
            alt={`Page ${page.pageNumber}`}
            className="w-full h-auto"
          />
          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
            {page.pageNumber}
          </div>
        </div>
      ))}
      {pages.length < (showAllPages ? Infinity : maxPages) && (
        <div className="text-center text-muted-foreground text-sm col-span-full">
          {pages.length} page{pages.length !== 1 ? "s" : ""} total
        </div>
      )}
    </div>
  );
}
