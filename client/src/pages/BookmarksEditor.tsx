import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { BookOpen, Upload, Download, Loader2, Trash2, FileText, Plus, X } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

interface Bookmark {
  title: string;
  page: number;
}

export default function BookmarksEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([{ title: "", page: 1 }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
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

  const addBookmark = () => {
    setBookmarks([...bookmarks, { title: "", page: 1 }]);
  };

  const removeBookmark = (index: number) => {
    setBookmarks(bookmarks.filter((_, i) => i !== index));
  };

  const updateBookmark = (index: number, field: keyof Bookmark, value: string | number) => {
    const updated = [...bookmarks];
    if (field === "page") {
      updated[index] = { ...updated[index], page: Number(value) };
    } else {
      updated[index] = { ...updated[index], [field]: String(value) };
    }
    setBookmarks(updated);
  };

  const handleProcess = async () => {
    if (!file) return;

    const validBookmarks = bookmarks.filter((b) => b.title.trim() !== "");
    if (validBookmarks.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one bookmark with a title.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookmarks", JSON.stringify(validBookmarks));

      const response = await pdfFetch("/api/pdf/bookmarks", {
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
      toast({ title: "Success!", description: "Bookmarks added to your PDF." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add bookmarks",
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
    setBookmarks([{ title: "", page: 1 }]);
    setIsComplete(false);
    setDownloadUrl(null);
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="PDF Bookmarks"
        description="Add bookmarks and table of contents to your PDF"
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your PDF is ready!</h2>
          <p className="text-muted-foreground mb-8">Bookmarks have been added.</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 h-12 px-8"
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
      title="PDF Bookmarks"
      description="Add bookmarks and table of contents to your PDF"
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {!file ? (
          <div className="p-8">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors",
                isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-border hover:border-indigo-500/50"
              )}
              data-testid="dropzone"
            >
              <input {...getInputProps()} data-testid="input-file" />
              <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
              <p className="text-xl font-medium text-foreground mb-2">Select PDF file</p>
              <p className="text-muted-foreground mb-6">or drop PDF here</p>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0" data-testid="button-select-file">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Bookmarks</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBookmark}
                  data-testid="button-add-bookmark"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Bookmark
                </Button>
              </div>

              <div className="space-y-3">
                {bookmarks.map((bookmark, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-3 p-4 border border-border rounded-lg bg-muted/20"
                    data-testid={`bookmark-row-${index}`}
                  >
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-2 block">Title</Label>
                      <Input
                        value={bookmark.title}
                        onChange={(e) => updateBookmark(index, "title", e.target.value)}
                        placeholder={`e.g., Chapter ${index + 1}`}
                        data-testid={`input-bookmark-title-${index}`}
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-sm font-medium mb-2 block">Page</Label>
                      <Input
                        type="number"
                        min={1}
                        value={bookmark.page}
                        onChange={(e) => updateBookmark(index, "page", e.target.value)}
                        data-testid={`input-bookmark-page-${index}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBookmark(index)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      disabled={bookmarks.length === 1}
                      data-testid={`button-remove-bookmark-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 h-12 px-8"
                  data-testid="button-add-bookmarks"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Add Bookmarks
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
