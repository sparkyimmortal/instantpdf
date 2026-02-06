import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { FileText, Upload, Download, Loader2, Trash2 } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  pages: number;
}

export default function MetadataEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setIsComplete(false);
      setDownloadUrl(null);
      setMetadata(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  useEffect(() => {
    if (!file) {
      setMetadata(null);
      return;
    }

    async function readMetadata() {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file!);
        formData.append("action", "read");

        const response = await pdfFetch("/api/pdf/metadata", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(formatPdfError(errorData));
        }

        const data = await response.json();
        setMetadata(data);
        setTitle(data.title || "");
        setAuthor(data.author || "");
        setSubject(data.subject || "");
        setKeywords(data.keywords || "");
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to read metadata",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    readMetadata();
  }, [file, toast]);

  const handleSave = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "update");
      formData.append("title", title);
      formData.append("author", author);
      formData.append("subject", subject);
      formData.append("keywords", keywords);

      const response = await pdfFetch("/api/pdf/metadata", {
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
      toast({ title: "Success!", description: "Metadata updated successfully." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update metadata",
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
    setMetadata(null);
    setIsComplete(false);
    setDownloadUrl(null);
    setTitle("");
    setAuthor("");
    setSubject("");
    setKeywords("");
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="PDF Metadata"
        description="View and edit PDF title, author, and other properties"
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your PDF is ready!</h2>
          <p className="text-muted-foreground mb-8">Metadata has been updated.</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 px-8"
              data-testid="button-download"
            >
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
      title="PDF Metadata"
      description="View and edit PDF title, author, and other properties"
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
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-select-file">
                Select PDF file
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <FileText className="w-4 h-4" />
              <span className="font-medium" data-testid="text-filename">{file.name}</span>
              <button onClick={handleReset} className="ml-2 text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Reading metadata...</span>
              </div>
            ) : metadata ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold" data-testid="text-editable-header">Editable Properties</h3>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Document title"
                      data-testid="input-title"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Author</Label>
                    <Input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Author name"
                      data-testid="input-author"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Subject</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Document subject"
                      data-testid="input-subject"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Keywords</Label>
                    <Input
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                      data-testid="input-keywords"
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <h3 className="text-lg font-semibold" data-testid="text-readonly-header">Document Info (Read-only)</h3>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Creator</Label>
                    <Input
                      value={metadata.creator || "N/A"}
                      readOnly
                      className="bg-muted/50"
                      data-testid="input-creator"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Producer</Label>
                    <Input
                      value={metadata.producer || "N/A"}
                      readOnly
                      className="bg-muted/50"
                      data-testid="input-producer"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Pages</Label>
                    <Input
                      value={String(metadata.pages || "N/A")}
                      readOnly
                      className="bg-muted/50"
                      data-testid="input-pages"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end pt-4 border-t border-border">
                  <Button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 px-8"
                    data-testid="button-save"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </ToolLayout>
  );
}
