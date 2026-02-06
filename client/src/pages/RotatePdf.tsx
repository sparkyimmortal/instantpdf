import { RotateCw, RotateCcw, Download, UploadCloud, File as FileIcon, ArrowRight } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const rotateLeft = () => setRotation((prev) => {
    const newVal = prev - 90;
    return newVal <= 0 ? 270 : newVal;
  });
  
  const rotateRight = () => setRotation((prev) => {
    const newVal = prev + 90;
    return newVal > 270 ? 90 : newVal;
  });

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('degrees', rotation.toString());

      setProgress(30);

      const response = await pdfFetch('/api/pdf/rotate', {
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
      
      toast({
        title: "Success!",
        description: "PDF rotated successfully.",
      });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to rotate PDF.",
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
    setFile(null);
    setRotation(90);
    setIsComplete(false);
    setProgress(0);
    setDownloadUrl(null);
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="Rotate PDF"
        description="Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!"
      >
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="h-20 w-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
            <Download className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold">Your PDF is ready!</h2>
          <p className="text-muted-foreground max-w-md">
            The file has been rotated successfully.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" onClick={handleDownload} data-testid="button-download">
              Download Rotated PDF
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset} data-testid="button-process-another">
              Process Another File
            </Button>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!"
    >
       {!file ? (
        <div 
          {...getRootProps()} 
          className={cn(
            "h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer group",
            isDragActive 
              ? "border-cyan-500 bg-cyan-500/10 scale-[0.99]" 
              : "border-muted-foreground/20 hover:border-cyan-500/50 hover:bg-muted/30"
          )}
          data-testid="dropzone"
        >
          <input {...getInputProps()} data-testid="input-file" />
          <div className="bg-cyan-500/10 p-6 rounded-full mb-6 transition-transform group-hover:scale-110 duration-300">
            <RotateCw className="h-12 w-12 text-cyan-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select PDF file</h3>
          <p className="text-muted-foreground mb-6">or drop PDF here</p>
          <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-select-file">Select PDF File</Button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
          <div className="flex-1 bg-muted/30 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r relative">
             <div 
              className="relative aspect-[3/4] w-64 bg-card shadow-xl rounded-sm border border-border p-4 flex flex-col items-center justify-center transition-transform duration-500 ease-in-out"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <FileIcon className="h-16 w-16 text-red-500 mb-2" />
              <p className="text-sm font-medium text-center line-clamp-2" data-testid="text-filename">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            
            <div className="mt-8 flex gap-4">
              <Button onClick={rotateLeft} variant="outline" className="flex items-center gap-2" data-testid="button-rotate-left">
                <RotateCcw className="h-4 w-4" /> Left
              </Button>
              <Button onClick={rotateRight} variant="outline" className="flex items-center gap-2" data-testid="button-rotate-right">
                Right <RotateCw className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              Rotation: {rotation}°
            </p>

            <Button variant="ghost" size="sm" onClick={handleReset} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
              Remove file
            </Button>
          </div>

          <div className="flex-1 p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Rotate PDF</h3>
                <p className="text-muted-foreground text-sm">
                  Rotate your pages 90, 180 or 270 degrees clockwise.
                </p>
              </div>

              {isProcessing ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  onClick={handleProcess}
                  data-testid="button-rotate"
                >
                  Rotate PDF
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
