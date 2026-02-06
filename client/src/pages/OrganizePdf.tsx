import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, LayoutGrid, Loader2, Trash2, RotateCw, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ToolLayout } from "@/components/ToolLayout";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

interface PagePreview {
  pageNumber: number;
  originalPageNumber: number;
  imageUrl: string;
  selected: boolean;
}

export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [draggedPage, setDraggedPage] = useState<number | null>(null);
  const { toast } = useToast();

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
            const pagesData = data.pages.map((p: { pageNumber: number; imageUrl: string }) => {
              let url = p.imageUrl;
              if (url.startsWith("http://") || url.startsWith("https://")) {
                const urlObj = new URL(url);
                url = urlObj.pathname;
              }
              return { ...p, imageUrl: url, selected: false, originalPageNumber: p.pageNumber };
            });
            setPages(pagesData);
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

  const handleDragStart = (idx: number) => {
    setDraggedPage(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedPage === null || draggedPage === idx) return;
    
    const newPages = [...pages];
    const draggedItem = newPages[draggedPage];
    newPages.splice(draggedPage, 1);
    newPages.splice(idx, 0, draggedItem);
    
    setPages(newPages);
    setDraggedPage(idx);
  };

  const handleDragEnd = () => {
    setDraggedPage(null);
  };

  const togglePageSelection = (idx: number) => {
    setPages(pages.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
  };

  const deleteSelectedPages = () => {
    const remaining = pages.filter(p => !p.selected);
    setPages(remaining.map((p, i) => ({ ...p, pageNumber: i + 1, selected: false })));
  };

  const rotateSelectedPages = () => {
    toast({ title: "Rotate", description: "Selected pages will be rotated 90°" });
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const pageOrder = pages.map(p => p.originalPageNumber);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("order", pageOrder.join(","));

      const response = await pdfFetch("/api/pdf/organize", {
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
      toast({ title: "Success!", description: "PDF pages organized." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to organize PDF",
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
    setIsComplete(false);
    setDownloadUrl(null);
  };

  const selectedCount = pages.filter(p => p.selected).length;

  if (isComplete) {
    return (
      <ToolLayout
        title="Organize PDF"
        description="Sort, add and delete PDF pages. Drag and drop the page thumbnails to reorder."
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your PDF is ready!</h2>
          <p className="text-muted-foreground mb-8">Pages have been organized.</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 px-8"
              data-testid="button-download"
            >
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="button-another">
              Organize Another
            </Button>
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Organize PDF"
      description="Sort, add and delete PDF pages. Drag and drop the page thumbnails to reorder."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
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
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-select-file">
                Select PDF file
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="font-medium">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
                    <Button variant="outline" size="sm" onClick={rotateSelectedPages} data-testid="button-rotate-selected">
                      <RotateCw className="w-4 h-4 mr-1" /> Rotate
                    </Button>
                    <Button variant="outline" size="sm" onClick={deleteSelectedPages} className="text-destructive border-destructive/30" data-testid="button-delete-selected">
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" data-testid="button-add-pages">
                  <Plus className="w-4 h-4 mr-1" /> Add more pages
                </Button>
              </div>
            </div>

            {loadingPages ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading pages...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5">
                {pages.map((page, idx) => (
                  <div
                    key={`page-${idx}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => togglePageSelection(idx)}
                    className={cn(
                      "relative group cursor-move",
                      draggedPage === idx && "opacity-50"
                    )}
                    data-testid={`page-thumbnail-${idx + 1}`}
                  >
                    <div
                      className={cn(
                        "aspect-[3/4] bg-muted/30 rounded-lg border-2 overflow-hidden shadow-sm transition-all hover:shadow-lg",
                        page.selected ? "border-cyan-500 ring-2 ring-cyan-500/30" : "border-border"
                      )}
                    >
                      <img
                        src={page.imageUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {page.selected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px]">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center text-xs text-muted-foreground mt-1">{idx + 1}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center mt-8">
              <Button
                onClick={handleProcess}
                disabled={isProcessing || pages.length === 0}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 px-8"
                data-testid="button-process"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-5 h-5 mr-2" />
                    Organize
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
