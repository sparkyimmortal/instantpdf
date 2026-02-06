import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, EyeOff, Loader2, FileText, Trash2, MousePointer, Square, Eraser, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ToolLayout } from "@/components/ToolLayout";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
}

interface RedactionArea {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function RedactPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [activeTool, setActiveTool] = useState<"drag" | "redact" | "shapes" | "eraser">("redact");
  const [searchText, setSearchText] = useState("");
  const [redactions, setRedactions] = useState<RedactionArea[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setIsComplete(false);
      setDownloadUrl(null);
      setRedactions([]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  useEffect(() => {
    if (!file) {
      setPages([]);
      return;
    }

    async function loadPreview() {
      setLoadingPages(true);
      try {
        const formData = new FormData();
        formData.append("file", file!);

        const response = await pdfFetch("/api/pdf/preview", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.pages) {
            const pagesData = data.pages.map((p: PagePreview) => {
              let url = p.imageUrl;
              if (url.startsWith("http://") || url.startsWith("https://")) {
                const urlObj = new URL(url);
                url = urlObj.pathname;
              }
              return { ...p, imageUrl: url };
            });
            setPages(pagesData);
            setCurrentPage(1);
          }
        }
      } catch (err) {
        console.error("Preview error:", err);
      } finally {
        setLoadingPages(false);
      }
    }

    loadPreview();
  }, [file]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== "redact" || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentRect({
      x: Math.min(drawStart.x, x),
      y: Math.min(drawStart.y, y),
      width: Math.abs(x - drawStart.x),
      height: Math.abs(y - drawStart.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect) return;
    setIsDrawing(false);
    if (currentRect.width > 10 && currentRect.height > 10) {
      const newRedaction: RedactionArea = {
        id: Date.now().toString(),
        page: currentPage,
        ...currentRect,
      };
      setRedactions([...redactions, newRedaction]);
    }
    setCurrentRect(null);
  };

  const removeRedaction = (id: string) => {
    setRedactions(redactions.filter(r => r.id !== id));
  };

  const currentPageRedactions = redactions.filter(r => r.page === currentPage);

  const handleProcess = async () => {
    if (!file || redactions.length === 0) {
      toast({ title: "Error", description: "Please draw at least one redaction area", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // Get the preview image dimensions to convert pixel coordinates to percentages
      // Use the actual image ref for accurate dimensions
      const imgWidth = imgRef.current?.clientWidth || 1;
      const imgHeight = imgRef.current?.clientHeight || 1;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("redactions", JSON.stringify(
        redactions.map(r => ({
          page: r.page,
          // Convert pixel coordinates to percentages (0.0-1.0)
          x: r.x / imgWidth,
          y: r.y / imgHeight,
          width: r.width / imgWidth,
          height: r.height / imgHeight,
        }))
      ));

      const response = await pdfFetch("/api/pdf/redact", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
      setIsComplete(true);
      toast({ title: "Success!", description: "Content redacted." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to redact PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (downloadUrl) {
      try {
        await downloadPdfFile(downloadUrl);
      } catch (err) {
        toast({
          title: "Download failed",
          description: err instanceof Error ? err.message : "Could not download file. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setRedactions([]);
    setIsComplete(false);
    setDownloadUrl(null);
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="Redact PDF"
        description="Permanently remove visible text and graphics from a document."
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your PDF is ready!</h2>
          <p className="text-muted-foreground mb-8">Content has been permanently redacted.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleDownload} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 px-8" data-testid="button-download">
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="button-another">
              Process Another
            </Button>
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Redact PDF"
      description="Permanently remove visible text and graphics from a document."
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {!file ? (
          <div className="p-8">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors",
                isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-cyan-500/50"
              )}
              data-testid="dropzone"
            >
              <input {...getInputProps()} data-testid="input-file" />
              <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-500" />
              <p className="text-xl font-medium text-foreground mb-2">Select PDF file</p>
              <p className="text-muted-foreground mb-6">or drop PDF here</p>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-select-file">Select PDF file</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row">
            <div className="w-24 lg:w-28 bg-muted/30 border-r border-border p-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-[600px]">
              {pages.map((page) => (
                <div
                  key={page.pageNumber}
                  onClick={() => setCurrentPage(page.pageNumber)}
                  className={cn(
                    "shrink-0 cursor-pointer rounded border-2 transition-all",
                    currentPage === page.pageNumber ? "border-cyan-500" : "border-transparent hover:border-border"
                  )}
                  data-testid={`page-thumb-${page.pageNumber}`}
                >
                  <div className="w-16 aspect-[3/4] bg-muted/30 rounded overflow-hidden relative">
                    <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
                    {redactions.filter(r => r.page === page.pageNumber).length > 0 && (
                      <div className="absolute top-0 right-0 bg-cyan-500 text-white text-[10px] px-1 rounded-bl">
                        {redactions.filter(r => r.page === page.pageNumber).length}
                      </div>
                    )}
                  </div>
                  <div className="text-center text-xs text-muted-foreground mt-1">{page.pageNumber}</div>
                </div>
              ))}
            </div>

            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                {[
                  { tool: "drag" as const, icon: MousePointer, label: "Drag" },
                  { tool: "redact" as const, icon: EyeOff, label: "Redact" },
                  { tool: "shapes" as const, icon: Square, label: "Shapes" },
                  { tool: "eraser" as const, icon: Eraser, label: "Eraser" },
                ].map(({ tool, icon: Icon, label }) => (
                  <button
                    key={tool}
                    onClick={() => setActiveTool(tool)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all",
                      activeTool === tool ? "bg-cyan-500/10 text-cyan-500" : "hover:bg-muted/50"
                    )}
                    data-testid={`button-tool-${tool}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>

              <div
                ref={previewRef}
                className="relative bg-muted/30 rounded-lg overflow-hidden cursor-crosshair"
                style={{ minHeight: "500px" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {loadingPages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pages.length > 0 && (
                  <>
                    <img
                      ref={imgRef}
                      src={pages[currentPage - 1]?.imageUrl}
                      alt={`Page ${currentPage}`}
                      className="w-full h-auto"
                      draggable={false}
                    />
                    {currentPageRedactions.map((r) => (
                      <div
                        key={r.id}
                        className="absolute bg-black/80 border-2 border-cyan-500 cursor-pointer group"
                        style={{ left: r.x, top: r.y, width: r.width, height: r.height }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeTool === "eraser") removeRedaction(r.id);
                        }}
                      >
                        {activeTool === "eraser" && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {currentRect && isDrawing && (
                      <div
                        className="absolute bg-cyan-500/30 border-2 border-cyan-500 border-dashed"
                        style={{ left: currentRect.x, top: currentRect.y, width: currentRect.width, height: currentRect.height }}
                      />
                    )}
                  </>
                )}
              </div>

              <div className="text-center text-sm text-muted-foreground mt-2">
                Page {currentPage} of {pages.length} | {redactions.length} area{redactions.length !== 1 ? "s" : ""} marked
              </div>
            </div>

            <div className="w-full lg:w-72 bg-muted/30 border-t lg:border-t-0 lg:border-l border-border p-6">
              <h2 className="text-xl font-bold mb-4">Redact PDF</h2>

              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Search text</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter text to find..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    data-testid="input-search-text"
                  />
                  <Button variant="outline" size="icon">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">Marked for redaction ({redactions.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {redactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Draw rectangles on the page to mark areas for redaction.</p>
                  ) : (
                    redactions.map((r, idx) => (
                      <div key={r.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                        <span>Page {r.page} - Area {idx + 1}</span>
                        <button onClick={() => removeRedaction(r.id)} className="text-destructive" data-testid={`button-remove-redaction-${idx}`}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Warning:</strong> Redaction permanently removes content. This cannot be undone.
                </p>
              </div>

              <Button
                onClick={handleProcess}
                disabled={isProcessing || redactions.length === 0}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12"
                data-testid="button-redact"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Redact PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </ToolLayout>
  );
}
