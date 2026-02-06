import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, GitCompare, Loader2, FileText, Trash2, Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ToolLayout } from "@/components/ToolLayout";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
}

export default function ComparePdf() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [pages1, setPages1] = useState<PagePreview[]>([]);
  const [pages2, setPages2] = useState<PagePreview[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [currentPage1, setCurrentPage1] = useState(0);
  const [currentPage2, setCurrentPage2] = useState(0);
  const [syncScroll, setSyncScroll] = useState(true);
  const [viewMode, setViewMode] = useState<"semantic" | "overlay">("semantic");
  const scroll1Ref = useRef<HTMLDivElement>(null);
  const scroll2Ref = useRef<HTMLDivElement>(null);

  const onDrop1 = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile1(acceptedFiles[0]);
      setIsComplete(false);
    }
  }, []);

  const onDrop2 = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile2(acceptedFiles[0]);
      setIsComplete(false);
    }
  }, []);

  const dropzone1 = useDropzone({
    onDrop: onDrop1,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const dropzone2 = useDropzone({
    onDrop: onDrop2,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  useEffect(() => {
    if (!file1) {
      setPages1([]);
      return;
    }

    async function loadPreview() {
      setLoadingPages(true);
      try {
        const formData = new FormData();
        formData.append("file", file1!);
        const response = await pdfFetch("/api/pdf/preview", { method: "POST", body: formData });
        if (response.ok) {
          const data = await response.json();
          if (data.pages) {
            const pagesData = data.pages.map((p: PagePreview) => {
              let url = p.imageUrl;
              if (url.startsWith("http://") || url.startsWith("https://")) {
                url = new URL(url).pathname;
              }
              return { ...p, imageUrl: url };
            });
            setPages1(pagesData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPages(false);
      }
    }
    loadPreview();
  }, [file1]);

  useEffect(() => {
    if (!file2) {
      setPages2([]);
      return;
    }

    async function loadPreview() {
      setLoadingPages(true);
      try {
        const formData = new FormData();
        formData.append("file", file2!);
        const response = await pdfFetch("/api/pdf/preview", { method: "POST", body: formData });
        if (response.ok) {
          const data = await response.json();
          if (data.pages) {
            const pagesData = data.pages.map((p: PagePreview) => {
              let url = p.imageUrl;
              if (url.startsWith("http://") || url.startsWith("https://")) {
                url = new URL(url).pathname;
              }
              return { ...p, imageUrl: url };
            });
            setPages2(pagesData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPages(false);
      }
    }
    loadPreview();
  }, [file2]);

  const handleScroll1 = () => {
    if (syncScroll && scroll1Ref.current && scroll2Ref.current) {
      scroll2Ref.current.scrollTop = scroll1Ref.current.scrollTop;
    }
  };

  const handleScroll2 = () => {
    if (syncScroll && scroll1Ref.current && scroll2Ref.current) {
      scroll1Ref.current.scrollTop = scroll2Ref.current.scrollTop;
    }
  };

  const handleProcess = async () => {
    if (!file1 || !file2) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file1", file1);
      formData.append("file2", file2);

      const response = await pdfFetch("/api/pdf/compare", {
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
      toast({ title: "Success!", description: "PDFs compared." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to compare PDFs",
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
    setFile1(null);
    setFile2(null);
    setPages1([]);
    setPages2([]);
    setIsComplete(false);
    setDownloadUrl(null);
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="Compare PDF"
        description="Show a side-by-side comparison of two similar PDF files to easily spot changes."
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Comparison Complete!</h2>
          <p className="text-muted-foreground mb-8">Your comparison report is ready for download.</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 px-8"
              data-testid="button-download"
            >
              Download Report
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="button-another">
              Compare Again
            </Button>
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  const hasFiles = file1 && file2;

  return (
    <ToolLayout
      title="Compare PDF"
      description="Show a side-by-side comparison of two similar PDF files to easily spot changes."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {!hasFiles ? (
          <div className="p-8 grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Original Document</p>
              {!file1 ? (
                <div
                  {...dropzone1.getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer",
                    dropzone1.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-cyan-500/50"
                  )}
                  data-testid="dropzone-file1"
                >
                  <input {...dropzone1.getInputProps()} data-testid="input-file1" />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-cyan-500" />
                  <p className="font-medium">Select first PDF</p>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-xl p-6 border border-border relative">
                  <button onClick={() => setFile1(null)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" data-testid="button-remove-file1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <FileText className="w-12 h-12 mx-auto text-cyan-500 mb-2" />
                  <p className="text-sm text-center font-medium truncate">{file1.name}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Modified Document</p>
              {!file2 ? (
                <div
                  {...dropzone2.getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer",
                    dropzone2.isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-cyan-500/50"
                  )}
                  data-testid="dropzone-file2"
                >
                  <input {...dropzone2.getInputProps()} data-testid="input-file2" />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-cyan-500" />
                  <p className="font-medium">Select second PDF</p>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-xl p-6 border border-border relative">
                  <button onClick={() => setFile2(null)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" data-testid="button-remove-file2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <FileText className="w-12 h-12 mx-auto text-cyan-500 mb-2" />
                  <p className="text-sm text-center font-medium truncate">{file2.name}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("semantic")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    viewMode === "semantic" ? "bg-cyan-500 text-white" : "bg-muted/50 text-foreground"
                  )}
                  data-testid="button-semantic"
                >
                  <GitCompare className="w-4 h-4 inline mr-1" />
                  Semantic
                </button>
                <button
                  onClick={() => setViewMode("overlay")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    viewMode === "overlay" ? "bg-cyan-500 text-white" : "bg-muted/50 text-foreground"
                  )}
                  data-testid="button-overlay"
                >
                  Overlay
                </button>
              </div>
              <button
                onClick={() => setSyncScroll(!syncScroll)}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded-lg text-sm",
                  syncScroll ? "bg-green-500/20 text-green-400" : "bg-muted/50 text-muted-foreground"
                )}
                data-testid="button-sync-scroll"
              >
                {syncScroll ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                Sync scroll
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/30 p-3 border-b border-border flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-cyan-500" />
                  <span className="truncate font-medium">{file1?.name}</span>
                </div>
                <div
                  ref={scroll1Ref}
                  onScroll={handleScroll1}
                  className="overflow-y-auto h-[500px] p-4"
                >
                  {loadingPages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pages1.map((page) => (
                        <div key={page.pageNumber} className="border border-border rounded-lg overflow-hidden">
                          <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/30 p-3 border-b border-border flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="truncate font-medium">{file2?.name}</span>
                </div>
                <div
                  ref={scroll2Ref}
                  onScroll={handleScroll2}
                  className="overflow-y-auto h-[500px] p-4"
                >
                  {loadingPages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pages2.map((page) => (
                        <div key={page.pageNumber} className="border border-border rounded-lg overflow-hidden">
                          <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 px-8"
                data-testid="button-compare"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    Compare PDFs
                    <GitCompare className="w-5 h-5 ml-2" />
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
