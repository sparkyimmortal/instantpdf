import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { FileCode, Upload, FileText, Loader2, Check, Download } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";
import download from "downloadjs";

type Mode = "upload" | "write";

export default function MarkdownToPdf() {
  const [mode, setMode] = useState<Mode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setIsComplete(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/markdown": [".md"] },
    maxFiles: 1,
  });

  const handleConvert = async () => {
    if (mode === "upload" && !file) return;
    if (mode === "write" && !markdown.trim()) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      if (mode === "upload" && file) {
        formData.append("file", file);
      } else {
        formData.append("markdown", markdown);
      }

      const response = await pdfFetch("/api/pdf/markdown-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const data = await response.json();

      const dlResponse = await pdfFetch(data.downloadUrl);
      if (!dlResponse.ok) throw new Error("Failed to download PDF");

      const blob = await dlResponse.blob();
      const filename = data.downloadUrl.split("/").pop() || "markdown.pdf";
      download(blob, filename, "application/pdf");

      setIsComplete(true);
      toast({ title: "Success!", description: "Markdown converted to PDF." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to convert Markdown",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setMarkdown("");
    setIsComplete(false);
  };

  const canSubmit = mode === "upload" ? !!file : markdown.trim().length > 0;

  if (isComplete) {
    return (
      <ToolLayout title="Markdown to PDF" description="Convert Markdown text to a beautiful PDF">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4" data-testid="text-success">PDF created successfully!</h2>
          <p className="text-muted-foreground mb-8">Your Markdown has been converted to PDF.</p>
          <Button variant="outline" onClick={handleReset} data-testid="button-convert-another">
            Convert Another
          </Button>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="Markdown to PDF" description="Convert Markdown text to a beautiful PDF">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="inline-flex bg-muted rounded-lg p-1">
              <button
                onClick={() => { setMode("upload"); setIsComplete(false); }}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  mode === "upload"
                    ? "bg-violet-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="tab-upload"
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Upload File
              </button>
              <button
                onClick={() => { setMode("write"); setIsComplete(false); }}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  mode === "write"
                    ? "bg-violet-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="tab-write"
              >
                <FileCode className="h-4 w-4 inline mr-2" />
                Write Markdown
              </button>
            </div>
          </div>

          {mode === "upload" ? (
            <>
              {!file ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-violet-500 bg-violet-500/10" : "border-border hover:border-violet-500/50"
                  )}
                  data-testid="dropzone-markdown"
                >
                  <input {...getInputProps()} data-testid="input-file-markdown" />
                  <Upload className="w-16 h-16 mx-auto mb-4 text-violet-500" />
                  <p className="text-xl font-medium text-foreground mb-2">Select Markdown file</p>
                  <p className="text-muted-foreground mb-6">or drop .md file here</p>
                  <Button className="bg-violet-500 hover:bg-violet-600 border-0" data-testid="button-select-file">
                    Select .md file
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-6">
                  <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid="text-filename">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isProcessing} data-testid="button-remove-file">
                    Change
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="mb-6">
              <Label htmlFor="markdown-input" className="text-sm font-medium mb-2 block">Markdown Content</Label>
              <textarea
                id="markdown-input"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder={"# Hello World\n\nWrite your **markdown** here...\n\n- Item 1\n- Item 2\n- Item 3"}
                className="w-full h-80 p-4 rounded-lg border border-border bg-muted/50 text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                data-testid="textarea-markdown"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {markdown.length} characters
              </p>
            </div>
          )}

          <Button
            onClick={handleConvert}
            disabled={isProcessing || !canSubmit}
            className="w-full bg-violet-500 hover:bg-violet-600 border-0"
            size="lg"
            data-testid="button-convert"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Convert to PDF
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </ToolLayout>
  );
}
