import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, Crop, Loader2, FileText, Trash2 } from "lucide-react";
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

export default function CropPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [marginLeft, setMarginLeft] = useState("20");
  const [marginRight, setMarginRight] = useState("20");
  const [marginTop, setMarginTop] = useState("20");
  const [marginBottom, setMarginBottom] = useState("20");

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
            const pagesData = data.pages.map((p: PagePreview) => {
              let url = p.imageUrl;
              if (url.startsWith("http://") || url.startsWith("https://")) {
                const urlObj = new URL(url);
                url = urlObj.pathname;
              }
              return { ...p, imageUrl: url };
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

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("marginLeft", marginLeft);
      formData.append("marginRight", marginRight);
      formData.append("marginTop", marginTop);
      formData.append("marginBottom", marginBottom);
      formData.append("unit", "po");

      const response = await pdfFetch("/api/pdf/crop", {
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
      toast({ title: "Success!", description: "PDF cropped successfully." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to crop PDF",
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

  if (isComplete) {
    return (
      <ToolLayout
        title="Crop PDF"
        description="Remove margins from your PDF pages."
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your PDF is ready!</h2>
          <p className="text-muted-foreground mb-8">PDF has been cropped successfully.</p>
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
      title="Crop PDF"
      description="Remove margins from your PDF pages."
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
            <div className="flex-1 p-6 min-h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium" data-testid="text-filename">{file.name}</span>
                  <button onClick={() => setFile(null)} className="ml-2 text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {loadingPages ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading pages...</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {pages.map((page) => (
                    <div key={page.pageNumber} className="relative group" data-testid={`preview-page-${page.pageNumber}`}>
                      <div className="aspect-[3/4] bg-muted/30 rounded border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center text-xs text-muted-foreground mt-1">{page.pageNumber}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full lg:w-80 bg-muted/30 border-t lg:border-t-0 lg:border-l border-border p-6">
              <h2 className="text-xl font-bold mb-6">Crop margins</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Left (points)</Label>
                    <Input type="number" min="0" max="200" value={marginLeft} onChange={(e) => setMarginLeft(e.target.value)} data-testid="input-margin-left" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Right (points)</Label>
                    <Input type="number" min="0" max="200" value={marginRight} onChange={(e) => setMarginRight(e.target.value)} data-testid="input-margin-right" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Top (points)</Label>
                    <Input type="number" min="0" max="200" value={marginTop} onChange={(e) => setMarginTop(e.target.value)} data-testid="input-margin-top" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Bottom (points)</Label>
                    <Input type="number" min="0" max="200" value={marginBottom} onChange={(e) => setMarginBottom(e.target.value)} data-testid="input-margin-bottom" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">72 points = 1 inch. Adjust margins to remove from each side of the page.</p>

                <Button onClick={handleProcess} disabled={isProcessing} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 mt-4" data-testid="button-crop">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crop className="w-4 h-4 mr-2" />
                      Crop PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </ToolLayout>
  );
}
