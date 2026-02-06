import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Upload, Image, Download, Loader2, ArrowLeft, Check, FileText } from "lucide-react";
import { Link } from "wouter";
import { useRecentFiles } from "@/hooks/use-recent-files";
import { useToast } from "@/hooks/use-toast";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

export default function ExtractImages() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addRecentFile } = useRecentFiles();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setIsComplete(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await pdfFetch("/api/pdf/extract-images", {
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
      
      addRecentFile({
        name: file.name,
        tool: "/extract-images",
        toolName: "Extract Images",
        size: file.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const { toast } = useToast();

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

  const resetState = () => {
    setFile(null);
    setIsComplete(false);
    setDownloadUrl(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
            </Button>
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-purple-500/10 text-purple-500 mb-4">
              <Image className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Extract Images from PDF
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Pull all embedded images from your PDF document. Images are extracted in their original format and quality.
            </p>
          </div>

          {!file ? (
            <Card
              {...getRootProps()}
              className={`p-12 border-2 border-dashed cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-purple-500 bg-purple-500/5"
                  : "border-border hover:border-purple-500/50 hover:bg-muted/50"
              }`}
              data-testid="dropzone-extract-images"
            >
              <input {...getInputProps()} data-testid="input-file-extract-images" />
              <div className="flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{ y: isDragActive ? -10 : 0 }}
                  className="mb-4"
                >
                  <Upload className="h-12 w-12 text-muted-foreground" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">
                  {isDragActive ? "Drop your PDF here" : "Drag & drop your PDF"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <Button variant="outline" data-testid="button-browse-extract-images">
                  Select PDF
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  disabled={isProcessing}
                  data-testid="button-remove-file"
                >
                  Change
                </Button>
              </div>

              {error && (
                <div className="bg-red-500/10 text-red-500 rounded-lg p-4 mb-6">
                  {error}
                </div>
              )}

              {isComplete ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 text-green-500 mb-3">
                    <Check className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-green-500 mb-4">
                    Images extracted successfully!
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={handleDownload}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      data-testid="button-download-images"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download Images (ZIP)
                    </Button>
                    <Button variant="outline" onClick={resetState} data-testid="button-extract-another">
                      Extract from Another PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleExtract}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="lg"
                  data-testid="button-extract-images"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Extracting Images...
                    </>
                  ) : (
                    <>
                      <Image className="h-5 w-5 mr-2" />
                      Extract Images
                    </>
                  )}
                </Button>
              )}
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
