import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Upload, Layers, Download, Loader2, ArrowLeft, Check, FileText } from "lucide-react";
import { Link } from "wouter";
import download from "downloadjs";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

export default function FlattenPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleFlatten = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await pdfFetch("/api/pdf/flatten", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const data = await response.json();
      
      const downloadResponse = await pdfFetch(data.downloadUrl);
      if (!downloadResponse.ok) throw new Error("Failed to download flattened PDF");

      const blob = await downloadResponse.blob();
      const filename = data.downloadUrl.split("/").pop() || "flattened.pdf";
      download(blob, filename, "application/pdf");
      
      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setIsComplete(false);
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
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
              <Layers className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Flatten PDF
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Merge form fields, annotations, and rotations into your PDF. Makes the document non-editable and reduces file size.
            </p>
          </div>

          {!file ? (
            <Card
              {...getRootProps()}
              className={`p-12 border-2 border-dashed cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-border hover:border-amber-500/50 hover:bg-muted/50"
              }`}
              data-testid="dropzone-flatten"
            >
              <input {...getInputProps()} data-testid="input-file-flatten" />
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
                <Button variant="outline" data-testid="button-browse-flatten">
                  Select PDF
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-amber-500" />
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

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-2">What flattening does:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Merges all form fields into static content
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Applies all page rotations permanently
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Embeds annotations into the document
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Reduces file size by removing interactive elements
                  </li>
                </ul>
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
                    PDF flattened successfully!
                  </p>
                  <Button onClick={resetState} data-testid="button-flatten-another">
                    Flatten Another PDF
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleFlatten}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  size="lg"
                  data-testid="button-flatten-pdf"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Flattening...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Flatten & Download
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
