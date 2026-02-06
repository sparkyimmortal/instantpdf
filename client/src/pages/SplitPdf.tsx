import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, Scissors, FileText, Loader2, Plus, X, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ToolLayout } from "@/components/ToolLayout";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
}

interface SplitRange {
  id: string;
  from: string;
  to: string;
}

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [splitMode, setSplitMode] = useState<"range" | "pages">("range");
  const [rangeMode, setRangeMode] = useState<"custom" | "fixed">("custom");
  const [ranges, setRanges] = useState<SplitRange[]>([{ id: "1", from: "1", to: "" }]);
  const [fixedParts, setFixedParts] = useState("2");
  const [mergeRanges, setMergeRanges] = useState(false);

  const [extractMode, setExtractMode] = useState<"all" | "select">("all");
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<Set<number>>(new Set());
  const [mergeExtracted, setMergeExtracted] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setIsComplete(false);
      setDownloadUrl(null);
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
      setTotalPages(0);
      setSelectedPageNumbers(new Set());
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
            setTotalPages(pagesData.length);
            if (pagesData.length > 0) {
              setRanges([{ id: "1", from: "1", to: String(pagesData.length) }]);
            }
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

  const addRange = () => {
    const newId = String(ranges.length + 1);
    setRanges([...ranges, { id: newId, from: "", to: "" }]);
  };

  const removeRange = (id: string) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((r) => r.id !== id));
    }
  };

  const updateRange = (id: string, field: "from" | "to", value: string) => {
    setRanges(ranges.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPageNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const selectAllPages = () => {
    const allPages = new Set(pages.map(p => p.pageNumber));
    setSelectedPageNumbers(allPages);
  };

  const clearSelection = () => {
    setSelectedPageNumbers(new Set());
  };

  const getSelectedPagesString = () => {
    return Array.from(selectedPageNumbers).sort((a, b) => a - b).join(",");
  };

  const handleSplit = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("originalName", file.name);

      let rangeStr = "";
      let mode = "ranges";

      if (splitMode === "range") {
        if (rangeMode === "custom") {
          rangeStr = ranges
            .filter((r) => r.from)
            .map((r) => (r.to ? `${r.from}-${r.to}` : r.from))
            .join(",");
        } else {
          const parts = parseInt(fixedParts) || 2;
          const pagesPerPart = Math.ceil(totalPages / parts);
          const rangeList = [];
          for (let i = 0; i < parts; i++) {
            const start = i * pagesPerPart + 1;
            const end = Math.min((i + 1) * pagesPerPart, totalPages);
            if (start <= totalPages) {
              rangeList.push(`${start}-${end}`);
            }
          }
          rangeStr = rangeList.join(",");
          mode = "fixed_parts";
        }
      } else if (splitMode === "pages") {
        if (extractMode === "all") {
          rangeStr = Array.from({ length: totalPages }, (_, i) => String(i + 1)).join(",");
        } else {
          rangeStr = getSelectedPagesString();
          if (!rangeStr) {
            toast({
              title: "No pages selected",
              description: "Please click on pages to select them for extraction.",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }
        }
        mode = mergeExtracted ? "extract_merge" : "extract";
      }

      formData.append("mode", mode);
      formData.append("ranges", rangeStr);
      if (mergeRanges && splitMode === "range") {
        formData.append("merge", "true");
      }

      const response = await pdfFetch("/api/pdf/split", {
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
      toast({ title: "Success!", description: "PDF split successfully." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to split PDF",
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
    setTotalPages(0);
    setIsComplete(false);
    setDownloadUrl(null);
    setRanges([{ id: "1", from: "1", to: "" }]);
    setSelectedPageNumbers(new Set());
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="Split PDF"
        description="Separate one page or a whole set for easy conversion into independent PDF files."
      >
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="h-20 w-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
            <Download className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold">Your PDF is ready!</h2>
          <p className="text-muted-foreground max-w-md">The file has been split successfully.</p>
          <div className="flex gap-4">
            <Button
              onClick={handleDownload}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0"
              data-testid="button-download"
            >
              Download Split PDF
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset} data-testid="button-split-another">
              Split Another
            </Button>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Split PDF"
      description="Separate one page or a whole set for easy conversion into independent PDF files."
    >
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer",
            isDragActive ? "border-cyan-500 bg-cyan-500/5" : "border-muted-foreground/25 hover:border-cyan-500/50 hover:bg-muted/50"
          )}
          data-testid="dropzone-split"
        >
          <input {...getInputProps()} data-testid="input-file-split" />
          <div className="bg-cyan-500/10 p-4 rounded-full mb-6">
            <Upload className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select PDF file</h3>
          <p className="text-muted-foreground mb-6">or drop PDF here</p>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-select-file">
            Select PDF file
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 p-6">
          <div className="flex-1 bg-muted/30 rounded-xl p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="font-medium text-foreground" data-testid="text-filename">{file.name}</span>
                <span>({totalPages} pages)</span>
                <button onClick={() => setFile(null)} className="ml-2 text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {splitMode === "pages" && extractMode === "select" && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{selectedPageNumbers.size} selected</span>
                  <Button variant="ghost" size="sm" onClick={selectAllPages} data-testid="button-select-all">Select All</Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection} data-testid="button-clear-selection">Clear</Button>
                </div>
              )}
            </div>

            {loadingPages ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading pages...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {pages.map((page) => {
                  const isSelected = selectedPageNumbers.has(page.pageNumber);
                  const isClickable = splitMode === "pages" && extractMode === "select";
                  
                  return (
                    <div
                      key={page.pageNumber}
                      onClick={() => isClickable && togglePageSelection(page.pageNumber)}
                      className={cn(
                        "relative group",
                        isClickable && "cursor-pointer"
                      )}
                      data-testid={`preview-page-${page.pageNumber}`}
                    >
                      <div className={cn(
                        "aspect-[3/4] bg-muted rounded-lg border-2 overflow-hidden shadow-md transition-all",
                        isSelected 
                          ? "border-cyan-500 ring-2 ring-cyan-500/30" 
                          : "border-border hover:shadow-lg hover:border-cyan-500/50"
                      )}>
                        <img
                          src={page.imageUrl}
                          alt={`Page ${page.pageNumber}`}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-cyan-500 text-white rounded-full p-1">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "text-center text-sm font-medium mt-2",
                        isSelected ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground"
                      )}>
                        {page.pageNumber}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-full lg:w-80 bg-card rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-6">Split options</h2>

            <div className="space-y-6">
              <div className="flex gap-2">
                <Button
                  variant={splitMode === "range" ? "default" : "outline"}
                  className={splitMode === "range" ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-0 flex-1" : "flex-1"}
                  onClick={() => setSplitMode("range")}
                  data-testid="button-mode-range"
                >
                  Range
                </Button>
                <Button
                  variant={splitMode === "pages" ? "default" : "outline"}
                  className={splitMode === "pages" ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-0 flex-1" : "flex-1"}
                  onClick={() => setSplitMode("pages")}
                  data-testid="button-mode-pages"
                >
                  Pages
                </Button>
              </div>

              {splitMode === "range" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={rangeMode === "custom" ? "default" : "outline"}
                      size="sm"
                      className={rangeMode === "custom" ? "bg-secondary text-secondary-foreground flex-1" : "flex-1"}
                      onClick={() => setRangeMode("custom")}
                    >
                      Custom ranges
                    </Button>
                    <Button
                      variant={rangeMode === "fixed" ? "default" : "outline"}
                      size="sm"
                      className={rangeMode === "fixed" ? "bg-secondary text-secondary-foreground flex-1" : "flex-1"}
                      onClick={() => setRangeMode("fixed")}
                    >
                      Fixed parts
                    </Button>
                  </div>

                  {rangeMode === "custom" ? (
                    <>
                      <AnimatePresence>
                        {ranges.map((range, idx) => (
                          <motion.div
                            key={range.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2"
                          >
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                max={totalPages}
                                placeholder="From"
                                value={range.from}
                                onChange={(e) => updateRange(range.id, "from", e.target.value)}
                                className="w-20"
                                data-testid={`input-range-from-${idx}`}
                              />
                              <span className="text-muted-foreground">-</span>
                              <Input
                                type="number"
                                min="1"
                                max={totalPages}
                                placeholder="To"
                                value={range.to}
                                onChange={(e) => updateRange(range.id, "to", e.target.value)}
                                className="w-20"
                                data-testid={`input-range-to-${idx}`}
                              />
                            </div>
                            {ranges.length > 1 && (
                              <button
                                onClick={() => removeRange(range.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addRange}
                        className="w-full"
                        data-testid="button-add-range"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add range
                      </Button>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="merge-ranges"
                          checked={mergeRanges}
                          onCheckedChange={(checked) => setMergeRanges(checked === true)}
                        />
                        <Label htmlFor="merge-ranges" className="text-sm">
                          Merge all ranges into one PDF
                        </Label>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Split into how many parts?</Label>
                      <Input
                        type="number"
                        min="2"
                        max={totalPages}
                        value={fixedParts}
                        onChange={(e) => setFixedParts(e.target.value)}
                        data-testid="input-fixed-parts"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your {totalPages}-page PDF will be split into {fixedParts} equal parts
                        ({Math.ceil(totalPages / (parseInt(fixedParts) || 2))} pages each)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {splitMode === "pages" && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Extract mode:</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="extract-all"
                        name="extractMode"
                        checked={extractMode === "all"}
                        onChange={() => setExtractMode("all")}
                        className="w-4 h-4 accent-cyan-500"
                      />
                      <Label htmlFor="extract-all" className="text-sm">Extract all pages</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="extract-select"
                        name="extractMode"
                        checked={extractMode === "select"}
                        onChange={() => setExtractMode("select")}
                        className="w-4 h-4 accent-cyan-500"
                      />
                      <Label htmlFor="extract-select" className="text-sm">Select pages (click on previews)</Label>
                    </div>
                  </div>

                  {extractMode === "select" && (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                      {selectedPageNumbers.size === 0 
                        ? "Click on page thumbnails to select pages for extraction"
                        : `Selected: ${getSelectedPagesString()}`
                      }
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="merge-extracted"
                      checked={mergeExtracted}
                      onCheckedChange={(checked) => setMergeExtracted(checked === true)}
                    />
                    <Label htmlFor="merge-extracted" className="text-sm">
                      Merge extracted pages into one PDF
                    </Label>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSplit}
                disabled={isProcessing || (splitMode === "pages" && extractMode === "select" && selectedPageNumbers.size === 0)}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12"
                data-testid="button-split"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4 mr-2" />
                    Split PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
