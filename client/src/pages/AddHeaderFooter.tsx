import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, Loader2, FileText, Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ToolLayout } from "@/components/ToolLayout";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
}

export default function AddHeaderFooter() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [headerAlign, setHeaderAlign] = useState<"left" | "center" | "right">("center");
  const [footerAlign, setFooterAlign] = useState<"left" | "center" | "right">("center");
  const [fontSize, setFontSize] = useState("12");
  const [margin, setMargin] = useState("recommended");
  const [fromPage, setFromPage] = useState("1");
  const [toPage, setToPage] = useState("");

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
            setToPage(String(pagesData.length));
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
    if (!file || (!headerText.trim() && !footerText.trim())) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("headerText", headerText);
      formData.append("footerText", footerText);
      formData.append("headerAlign", headerAlign);
      formData.append("footerAlign", footerAlign);
      formData.append("fontSize", fontSize);
      formData.append("margin", margin);
      formData.append("fromPage", fromPage);
      formData.append("toPage", toPage || String(totalPages));

      const response = await pdfFetch("/api/pdf/add-header-footer", {
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
      toast({ title: "Success!", description: "Header and footer added." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add header/footer",
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
  };

  const getAlignPosition = (align: string, isHeader: boolean) => {
    const y = isHeader ? "top-2" : "bottom-2";
    if (align === "left") return `${y} left-2`;
    if (align === "right") return `${y} right-2`;
    return `${y} left-1/2 -translate-x-1/2`;
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="Add Header & Footer"
        description="Add custom headers and footers to your PDF pages."
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your PDF is ready!</h2>
          <p className="text-muted-foreground mb-8">Header and footer have been added.</p>
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
      title="Add Header & Footer"
      description="Add custom headers and footers to your PDF pages."
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
                  <span className="font-medium text-foreground" data-testid="text-filename">{file.name}</span>
                  <span>({totalPages} pages)</span>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {pages.map((page) => (
                    <div key={page.pageNumber} className="relative group" data-testid={`preview-page-${page.pageNumber}`}>
                      <div className="aspect-[3/4] bg-muted/30 rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                        <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
                        {headerText && (
                          <div className={cn("absolute text-[8px] font-medium text-cyan-600 bg-cyan-500/10 px-1 rounded truncate max-w-[80%]", getAlignPosition(headerAlign, true))}>
                            {headerText}
                          </div>
                        )}
                        {footerText && (
                          <div className={cn("absolute text-[8px] font-medium text-cyan-600 bg-cyan-500/10 px-1 rounded truncate max-w-[80%]", getAlignPosition(footerAlign, false))}>
                            {footerText}
                          </div>
                        )}
                      </div>
                      <div className="text-center text-xs text-muted-foreground mt-1">{page.pageNumber}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full lg:w-80 bg-muted/30 border-t lg:border-t-0 lg:border-l border-border p-6">
              <h2 className="text-xl font-bold mb-6">Header & Footer options</h2>

              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Header text:</Label>
                  <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Enter header text" data-testid="input-header-text" />
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => setHeaderAlign("left")}
                      className={cn("p-2 rounded border", headerAlign === "left" ? "border-cyan-500 bg-cyan-500/10" : "border-border")}
                      data-testid="button-header-align-left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setHeaderAlign("center")}
                      className={cn("p-2 rounded border", headerAlign === "center" ? "border-cyan-500 bg-cyan-500/10" : "border-border")}
                      data-testid="button-header-align-center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setHeaderAlign("right")}
                      className={cn("p-2 rounded border", headerAlign === "right" ? "border-cyan-500 bg-cyan-500/10" : "border-border")}
                      data-testid="button-header-align-right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Footer text:</Label>
                  <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Enter footer text" data-testid="input-footer-text" />
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => setFooterAlign("left")}
                      className={cn("p-2 rounded border", footerAlign === "left" ? "border-cyan-500 bg-cyan-500/10" : "border-border")}
                      data-testid="button-footer-align-left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setFooterAlign("center")}
                      className={cn("p-2 rounded border", footerAlign === "center" ? "border-cyan-500 bg-cyan-500/10" : "border-border")}
                      data-testid="button-footer-align-center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setFooterAlign("right")}
                      className={cn("p-2 rounded border", footerAlign === "right" ? "border-cyan-500 bg-cyan-500/10" : "border-border")}
                      data-testid="button-footer-align-right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Font size:</Label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger data-testid="select-font-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10pt</SelectItem>
                      <SelectItem value="12">12pt (default)</SelectItem>
                      <SelectItem value="14">14pt</SelectItem>
                      <SelectItem value="16">16pt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Margin:</Label>
                  <Select value={margin} onValueChange={setMargin}>
                    <SelectTrigger data-testid="select-margin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="recommended">Recommended</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Pages:</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">From</span>
                    <Input type="number" min="1" max={totalPages} value={fromPage} onChange={(e) => setFromPage(e.target.value)} className="w-16 h-8 text-center" data-testid="input-from-page" />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input type="number" min="1" max={totalPages} value={toPage} onChange={(e) => setToPage(e.target.value)} placeholder={String(totalPages)} className="w-16 h-8 text-center" data-testid="input-to-page" />
                  </div>
                </div>

                <Button onClick={handleProcess} disabled={isProcessing || (!headerText.trim() && !footerText.trim())} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12" data-testid="button-add-header-footer">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Add Header & Footer"
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
