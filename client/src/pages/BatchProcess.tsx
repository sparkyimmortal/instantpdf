import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Layers, Upload, Download, Loader2, Trash2, FileText, X } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Operation = "compress" | "rotate" | "flatten" | "watermark";

export default function BatchProcess() {
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState<Operation>("compress");
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [rotateDegrees, setRotateDegrees] = useState("90");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles((prev) => [...prev, ...acceptedFiles]);
      setIsComplete(false);
      setDownloadUrl(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("operation", operation);

      if (operation === "compress") {
        formData.append("level", compressionLevel);
      } else if (operation === "rotate") {
        formData.append("degrees", rotateDegrees);
      } else if (operation === "watermark") {
        formData.append("text", watermarkText);
      }

      const response = await pdfFetch("/api/pdf/batch", {
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
      toast({ title: "Success!", description: "All files have been processed." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to process files",
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
    setFiles([]);
    setIsComplete(false);
    setDownloadUrl(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="Batch Process"
        description="Apply the same operation to multiple PDF files at once"
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your files are ready!</h2>
          <p className="text-muted-foreground mb-8">{files.length} files have been processed.</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-0 h-12 px-8"
              data-testid="button-download"
            >
              Download ZIP
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="button-another">
              Process More Files
            </Button>
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Batch Process"
      description="Apply the same operation to multiple PDF files at once"
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-6 min-h-[500px]">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-6",
                isDragActive ? "border-orange-500 bg-orange-500/10" : "border-border hover:border-orange-500/50"
              )}
              data-testid="dropzone"
            >
              <input {...getInputProps()} data-testid="input-file" />
              <Upload className="w-12 h-12 mx-auto mb-3 text-orange-500" />
              <p className="text-lg font-medium text-foreground mb-1">Select PDF files</p>
              <p className="text-muted-foreground text-sm">or drop multiple PDFs here</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </h3>
                {files.map((f, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20"
                    data-testid={`file-row-${index}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="text-sm font-medium truncate" data-testid={`text-filename-${index}`}>{f.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatSize(f.size)}</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-destructive shrink-0 ml-2"
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full lg:w-80 bg-muted/30 border-t lg:border-t-0 lg:border-l border-border p-6">
            <h2 className="text-xl font-bold mb-6">Operation</h2>

            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Operation</Label>
                <Select value={operation} onValueChange={(v) => setOperation(v as Operation)}>
                  <SelectTrigger data-testid="select-operation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compress">Compress</SelectItem>
                    <SelectItem value="rotate">Rotate</SelectItem>
                    <SelectItem value="flatten">Flatten</SelectItem>
                    <SelectItem value="watermark">Add Watermark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {operation === "compress" && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Compression Level</Label>
                  <Select value={compressionLevel} onValueChange={setCompressionLevel}>
                    <SelectTrigger data-testid="select-compression-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {operation === "rotate" && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Rotation Degrees</Label>
                  <Select value={rotateDegrees} onValueChange={setRotateDegrees}>
                    <SelectTrigger data-testid="select-rotate-degrees">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90°</SelectItem>
                      <SelectItem value="180">180°</SelectItem>
                      <SelectItem value="270">270°</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {operation === "watermark" && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Watermark Text</Label>
                  <Input
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter watermark text"
                    data-testid="input-watermark-text"
                  />
                </div>
              )}

              <Button
                onClick={handleProcess}
                disabled={isProcessing || files.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-0 h-12"
                data-testid="button-process"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 mr-2" />
                    Process All Files
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </ToolLayout>
  );
}
