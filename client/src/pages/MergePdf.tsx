import { useCallback, useState, DragEvent } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, ArrowRight, Loader2, Download, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/ToolLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useRecentFiles } from "@/hooks/use-recent-files";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

export default function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { addRecentFile } = useRecentFiles();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const moveFile = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    const newFiles = [...files];
    const [moved] = newFiles.splice(from, 1);
    newFiles.splice(to, 0, moved);
    setFiles(newFiles);
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveFile(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: "Not enough files",
        description: "Please select at least 2 PDF files to merge.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      setProgress(30);
      
      const response = await pdfFetch('/api/pdf/merge', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
      
      setProgress(100);
      setIsProcessing(false);
      setIsComplete(true);
      
      files.forEach(f => {
        addRecentFile({
          name: f.name,
          tool: "/merge-pdf",
          toolName: "Merge PDF",
          size: f.size,
        });
      });
      
      toast({
        title: "Success!",
        description: "Your PDFs have been merged successfully.",
      });
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to merge PDFs. Please check if the files are valid.",
        variant: "destructive"
      });
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
    setProgress(0);
    setDownloadUrl(null);
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="Merge PDF files"
        description="Combine PDFs in the order you want with the easiest PDF merger available."
      >
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="h-20 w-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
            <Download className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold">Your PDF is ready!</h2>
          <p className="text-muted-foreground max-w-md">
            The files have been successfully merged into a single document.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" onClick={handleDownload} data-testid="button-download">
              Download Merged PDF
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset} data-testid="button-merge-more">
              Merge More Files
            </Button>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Merge PDF files"
      description="Combine PDFs in the order you want with the easiest PDF merger available."
    >
      {files.length === 0 ? (
        <div 
          {...getRootProps()} 
          className={`h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}`}
          data-testid="dropzone-merge"
        >
          <input {...getInputProps()} data-testid="input-file-merge" />
          <div className="bg-cyan-500/10 p-4 rounded-full mb-6">
            <UploadCloud className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select PDF files</h3>
          <p className="text-muted-foreground mb-6">or drop PDFs here</p>
          <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-select-files">Select PDF files</Button>
        </div>
      ) : (
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <AnimatePresence>
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  draggable
                  onDragStart={(e) => handleDragStart(e as unknown as DragEvent<HTMLDivElement>, index)}
                  onDragOver={(e) => handleDragOver(e as unknown as DragEvent<HTMLDivElement>, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group aspect-[3/4] bg-muted/30 border rounded-lg p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                  data-testid={`card-file-${index}`}
                >
                  <div className="absolute top-2 left-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="absolute top-2 right-8 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveFile(index, index - 1); }}
                      className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                      disabled={index === 0}
                      data-testid={`button-move-up-${index}`}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveFile(index, index + 1); }}
                      className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                      disabled={index === files.length - 1}
                      data-testid={`button-move-down-${index}`}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <File className="h-12 w-12 text-red-500 mb-3" />
                  <span className="text-sm font-medium line-clamp-2 w-full break-words">
                    {file.name}
                  </span>
                  <span className="absolute bottom-2 left-2 text-xs text-muted-foreground font-mono">
                    #{index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute top-2 left-2 bg-background/80 backdrop-blur text-xs font-mono px-2 py-0.5 rounded border">
                    {index + 1}
                  </div>
                </motion.div>
              ))}
              <div 
                {...getRootProps()} 
                className="aspect-[3/4] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                data-testid="dropzone-add-more"
              >
                <input {...getInputProps()} />
                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">Add more</span>
              </div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {isProcessing && (
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Merging PDFs...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {!isProcessing && (
              <Button 
                size="lg" 
                className="w-full md:w-auto px-8 py-6 text-lg"
                onClick={handleMerge}
                disabled={files.length < 2}
                data-testid="button-merge"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    Merge PDF
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
