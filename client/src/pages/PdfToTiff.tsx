import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Upload, FileText, Download, Loader2, ArrowLeft, Check, X } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";
import download from "downloadjs";

export default function PdfToTiff() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setIsComplete(false);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(30);

      const response = await pdfFetch("/api/pdf/pdf-to-tiff", {
        method: "POST",
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const data = await response.json();

      setProgress(90);

      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = data.downloadUrl.split("/").pop() || "converted.tiff";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgress(100);
      setIsComplete(true);

      toast({
        title: "Success!",
        description: "PDF converted to TIFF successfully.",
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to convert PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setIsComplete(false);
    setError(null);
    setProgress(0);
  };

  return (
    <ToolLayout
      title="PDF to TIFF"
      description="Convert PDF to TIFF format for printing and archiving"
    >
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer group",
            isDragActive
              ? "border-cyan-500 bg-cyan-500/5 scale-[0.99]"
              : "border-muted-foreground/20 hover:border-cyan-500/50 hover:bg-muted/30"
          )}
          data-testid="dropzone"
        >
          <input {...getInputProps()} data-testid="input-file" />
          <div className="bg-cyan-500/10 p-6 rounded-full mb-6 transition-transform group-hover:scale-110 duration-300">
            <FileText className="h-12 w-12 text-cyan-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select PDF File</h3>
          <p className="text-muted-foreground mb-6">or drop your PDF here</p>
          <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600" data-testid="button-select-file">
            Select PDF
          </Button>
        </div>
      ) : (
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-cyan-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" data-testid="text-filename">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetState}
              disabled={isProcessing}
              data-testid="button-change-file"
            >
              Change
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-500 rounded-lg p-4 mb-6" data-testid="text-error">
              {error}
            </div>
          )}

          {isComplete ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 text-green-500 mb-4">
                <Check className="h-8 w-8" />
              </div>
              <p className="font-medium text-green-500 mb-6 text-lg" data-testid="text-success">
                PDF converted to TIFF successfully!
              </p>
              <Button variant="outline" onClick={resetState} data-testid="button-convert-another">
                Convert Another PDF
              </Button>
            </div>
          ) : isProcessing ? (
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Converting PDF to TIFF...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                size="lg"
                className="w-full md:w-auto px-12 h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all"
                onClick={handleProcess}
                data-testid="button-convert"
              >
                <Download className="mr-2 h-5 w-5" />
                Convert & Download TIFF
              </Button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
