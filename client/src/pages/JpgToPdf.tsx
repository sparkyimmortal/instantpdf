import { Image, UploadCloud, ArrowRight, Download, X } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

export default function JpgToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      setProgress(30);

      const response = await pdfFetch('/api/pdf/image-to-pdf', {
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
        description: "Images converted to PDF successfully.",
      });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to convert images.",
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
        title="JPG to PDF"
        description="Convert JPG images to PDF in seconds. Easily adjust orientation and margins."
      >
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="h-20 w-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
            <Download className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold">Your PDF is ready!</h2>
          <p className="text-muted-foreground max-w-md">
            The images have been successfully converted to a PDF document.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700" onClick={handleDownload} data-testid="button-download">
              Download PDF
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset} data-testid="button-convert-more">
              Convert More Images
            </Button>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="JPG to PDF"
      description="Convert JPG images to PDF in seconds. Easily adjust orientation and margins."
    >
      {files.length === 0 ? (
        <div 
          {...getRootProps()} 
          className={cn(
            "h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer group",
            isDragActive 
              ? "border-yellow-500 bg-yellow-50 scale-[0.99]" 
              : "border-muted-foreground/20 hover:border-yellow-500/50 hover:bg-muted/30"
          )}
          data-testid="dropzone"
        >
          <input {...getInputProps()} data-testid="input-file" />
          <div className="bg-yellow-50 p-6 rounded-full mb-6 transition-transform group-hover:scale-110 duration-300">
            <Image className="h-12 w-12 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select Images</h3>
          <p className="text-muted-foreground mb-6">or drop JPGs here</p>
          <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700" data-testid="button-select-files">Select Images</Button>
        </div>
      ) : (
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {files.map((file, index) => (
              <div key={index} className="aspect-square bg-muted/30 border rounded-lg p-4 flex flex-col items-center justify-center relative group" data-testid={`card-image-${index}`}>
                <Image className="h-10 w-10 text-yellow-600 mb-2" />
                <p className="text-xs text-center line-clamp-2">{file.name}</p>
                <div className="absolute top-2 left-2 bg-background/80 text-xs px-2 py-0.5 rounded">
                  {index + 1}
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  data-testid={`button-remove-image-${index}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
             <div 
              {...getRootProps()} 
              className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              data-testid="dropzone-add-more"
            >
              <input {...getInputProps()} />
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-muted-foreground">Add more</span>
            </div>
          </div>
          
           {isProcessing ? (
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Converting images...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            ) : (
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto px-12 h-14 text-lg bg-yellow-600 hover:bg-yellow-700 shadow-lg hover:shadow-xl transition-all"
                  onClick={handleProcess}
                  data-testid="button-convert"
                >
                  Convert to PDF
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
        </div>
      )}
    </ToolLayout>
  );
}
