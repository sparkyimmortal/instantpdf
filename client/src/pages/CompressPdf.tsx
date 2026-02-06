import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, Download, Minimize2, Check, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { useRecentFiles } from "@/hooks/use-recent-files";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

const levels = [
  {
    id: "extreme",
    title: "Extreme Compression",
    description: "Less quality, high compression",
    saving: "~80%",
    icon: Minimize2,
    level: "high"
  },
  {
    id: "recommended",
    title: "Recommended Compression",
    description: "Good quality, good compression",
    saving: "~50%",
    icon: Check,
    level: "medium"
  },
  {
    id: "low",
    title: "Less Compression",
    description: "High quality, less compression",
    saving: "~20%",
    icon: File,
    level: "low"
  },
  {
    id: "custom",
    title: "Custom Target Size",
    description: "Compress to specific file size",
    saving: "Custom",
    icon: Target,
    level: "custom"
  }
];

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState("recommended");
  const [targetSize, setTargetSize] = useState("500");
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB">("KB");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const { toast } = useToast();
  const { addRecentFile } = useRecentFiles();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setOriginalSize(acceptedFiles[0].size);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const selectedLevel = levels.find(l => l.id === level);
      if (level === "custom") {
        const sizeInKB = targetUnit === "MB" ? parseInt(targetSize) * 1024 : parseInt(targetSize);
        formData.append('level', 'custom');
        formData.append('targetSize', String(sizeInKB));
      } else {
        formData.append('level', selectedLevel?.level || 'medium');
      }
      
      setProgress(30);

      const response = await pdfFetch('/api/pdf/compress', {
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
      
      const estimatedReduction = level === 'extreme' ? 0.2 : level === 'recommended' ? 0.5 : level === 'custom' ? 0.3 : 0.8;
      setCompressedSize(Math.round(originalSize * estimatedReduction));
      
      setProgress(100);
      setIsProcessing(false);
      setIsComplete(true);
      
      addRecentFile({
        name: file.name,
        tool: "/compress-pdf",
        toolName: "Compress PDF",
        size: file.size,
      });
      
      toast({
        title: "Success!",
        description: "Your PDF has been compressed successfully.",
      });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to compress PDF.",
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
    setIsComplete(false);
    setProgress(0);
    setDownloadUrl(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const reductionPercent = originalSize > 0 
    ? Math.round((1 - compressedSize / originalSize) * 100) 
    : 0;

  if (isComplete) {
    return (
      <ToolLayout title="Compress PDF file" description="Reduce file size while optimizing for maximal PDF quality.">
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className="h-20 w-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
            <Download className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold">Your PDF is compressed!</h2>
          <div className="bg-muted p-4 rounded-lg flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground line-through">{formatSize(originalSize)}</p>
              <p className="font-bold text-green-600">{formatSize(compressedSize)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <p className="text-sm font-medium">Reduced by {reductionPercent}%</p>
          </div>
          <div className="flex gap-4">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" onClick={handleDownload} data-testid="button-download">
              Download Compressed PDF
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset} data-testid="button-compress-another">
              Compress Another PDF
            </Button>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="Compress PDF file" description="Reduce file size while optimizing for maximal PDF quality.">
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer
            ${isDragActive ? "border-cyan-500 bg-cyan-500/5" : "border-muted-foreground/25 hover:border-cyan-500/50 hover:bg-muted/50"}`}
          data-testid="dropzone-compress"
        >
          <input {...getInputProps()} data-testid="input-file-compress" />
          <div className="bg-cyan-500/10 p-4 rounded-full mb-6">
            <UploadCloud className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select PDF file</h3>
          <p className="text-muted-foreground mb-6">or drop PDF here</p>
          <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-select-file">Select PDF file</Button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
          <div className="flex-1 bg-muted/30 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r">
            <div className="relative aspect-[3/4] w-48 bg-card shadow-xl rounded-sm border p-4 flex flex-col items-center justify-center mb-4">
              <File className="h-16 w-16 text-red-500 mb-2" />
              <p className="text-sm font-medium text-center line-clamp-2" data-testid="text-filename">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
              Remove file
            </Button>
          </div>

          <div className="flex-1 p-8">
            <h3 className="text-lg font-semibold mb-6">Choose compression level</h3>
            <div className="space-y-3">
              {levels.map((l) => {
                const Icon = l.icon;
                return (
                  <div
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={cn(
                      "flex items-center p-4 border rounded-lg cursor-pointer transition-all",
                      level === l.id 
                        ? "border-cyan-500 bg-cyan-500/10" 
                        : "border-muted hover:border-cyan-500/50"
                    )}
                    data-testid={`level-${l.id}`}
                  >
                    <div className={cn("p-2 rounded-full mr-4", level === l.id ? "bg-cyan-500/20" : "bg-muted")}>
                      <Icon className={cn("h-5 w-5", level === l.id ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{l.title}</p>
                      <p className="text-sm text-muted-foreground">{l.description}</p>
                    </div>
                    <span className={cn("text-sm font-medium", level === l.id ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground")}>
                      {l.saving}
                    </span>
                  </div>
                );
              })}
            </div>

            {level === "custom" && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <Label className="text-sm font-medium mb-2 block">Target file size:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="10"
                    max={targetUnit === "MB" ? "20" : "20480"}
                    value={targetSize}
                    onChange={(e) => setTargetSize(e.target.value)}
                    className="w-24"
                    data-testid="input-target-size"
                  />
                  <select
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value as "KB" | "MB")}
                    className="h-10 px-3 border rounded-md"
                    data-testid="select-target-unit"
                  >
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Min: 10KB, Max: 20MB</p>
              </div>
            )}

            {isProcessing && (
              <div className="mt-6">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">Compressing...</p>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0"
              onClick={handleCompress}
              disabled={isProcessing}
              data-testid="button-compress"
            >
              {isProcessing ? "Compressing..." : "Compress PDF"}
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
