import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, Download, ArrowRight, Loader2, CheckCircle2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PdfPreview } from "@/components/PdfPreview";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

const API_ENDPOINTS: Record<string, string> = {
  'ocr-pdf': '/api/pdf/ocr',
  'protect-pdf': '/api/pdf/protect',
  'unlock-pdf': '/api/pdf/unlock',
  'pdf-to-word': '/api/pdf/pdf-to-word',
  'pdf-to-excel': '/api/pdf/pdf-to-excel',
  'pdf-to-powerpoint': '/api/pdf/pdf-to-powerpoint',
  'word-to-pdf': '/api/pdf/word-to-pdf',
  'excel-to-pdf': '/api/pdf/excel-to-pdf',
  'powerpoint-to-pdf': '/api/pdf/powerpoint-to-pdf',
  'repair-pdf': '/api/pdf/repair',
  'rotate-pdf': '/api/pdf/rotate',
  'pdf-to-pdfa': '/api/pdf/convert-to-pdfa',
  'watermark-pdf': '/api/pdf/watermark',
  'pdf-to-jpg': '/api/pdf/pdf-to-jpg',
  'jpg-to-pdf': '/api/pdf/image-to-pdf',
    'html-to-pdf': '/api/pdf/html-to-pdf',
  'add-page-numbers': '/api/pdf/page-numbers',
  'crop-pdf': '/api/pdf/crop',
  'flatten-pdf': '/api/pdf/flatten',
  'redact-pdf': '/api/pdf/redact',
  'compare-pdf': '/api/pdf/compare',
  'sign-pdf': '/api/pdf/digital-signature',
  'validate-pdfa': '/api/pdf/validate-pdfa',
  'extract-text': '/api/pdf/extract-text',
  'extract-images': '/api/pdf/extract-images',
  'organize-pdf': '/api/pdf/organize',
  'edit-pdf': '/api/pdf/edit',
};

interface GenericToolProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  buttonClass: string;
  accept?: Record<string, string[]>;
  processLabel?: string;
  successMessage?: string;
  downloadLabel?: string;
  requiresPassword?: boolean;
  requiresText?: boolean;
  multiFile?: boolean;
  showPreview?: boolean;
}

export function GenericTool({
  id,
  title,
  description,
  icon: Icon,
  colorClass,
  buttonClass,
  accept = { 'application/pdf': ['.pdf'] },
  processLabel = "Convert",
  successMessage = "Your file has been converted successfully.",
  downloadLabel = "Download File",
  requiresPassword = false,
  requiresText = false,
  multiFile = false,
  showPreview = false,
}: GenericToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [text, setText] = useState("");
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (multiFile) {
      setFiles(prev => [...prev, ...acceptedFiles]);
    } else if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [multiFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiFile ? undefined : 1
  });

  const handleProcess = async () => {
    const targetFile = multiFile ? files[0] : file;
    if (!targetFile && !multiFile) return;
    if (multiFile && files.length === 0) return;

    if (requiresPassword && !password) {
      toast({
        title: "Password required",
        description: "Please enter a password.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      const formData = new FormData();
      
      if (multiFile) {
        files.forEach(f => formData.append('files', f));
      } else if (file) {
        formData.append('file', file);
      }

      if (requiresPassword && password) {
        formData.append('password', password);
      }

      if (requiresText && text) {
        formData.append('text', text);
      }

      setProgress(30);

      const endpoint = API_ENDPOINTS[id] || `/api/pdf/${id}`;
      const response = await pdfFetch(endpoint, {
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
        description: successMessage,
      });
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setProgress(0);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Processing failed. Please try again.",
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
    setFiles([]);
    setIsComplete(false);
    setProgress(0);
    setDownloadUrl(null);
    setPassword("");
    setText("");
  };

  const hasFile = multiFile ? files.length > 0 : file !== null;

  if (isComplete) {
    return (
      <ToolLayout title={title} description={description}>
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
          <div className={cn("h-24 w-24 rounded-full flex items-center justify-center mb-4 bg-green-100 text-green-600")}>
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold">Ready to download!</h2>
          <p className="text-muted-foreground max-w-md">
            {successMessage}
          </p>
          <div className="flex gap-4">
            <Button size="lg" className={buttonClass} onClick={handleDownload} data-testid="button-download">
              <Download className="mr-2 h-4 w-4" />
              {downloadLabel}
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
    <ToolLayout title={title} description={description}>
      {!hasFile ? (
        <div 
          {...getRootProps()} 
          className={cn(
            "h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer group",
            isDragActive 
              ? "border-primary bg-primary/5 scale-[0.99]" 
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
          )}
          data-testid="dropzone"
        >
          <input {...getInputProps()} data-testid="input-file" />
          <div className={cn("p-6 rounded-full mb-6 transition-transform group-hover:scale-110 duration-300", colorClass.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 '))}>
            <Icon className={cn("h-12 w-12", colorClass.split(' ')[0])} />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select file</h3>
          <p className="text-muted-foreground mb-6">or drop file here</p>
          <Button size="lg" className={buttonClass} data-testid="button-select-file">Select File</Button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
          <div className="flex-1 bg-muted/30 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r">
            {showPreview && file && !multiFile ? (
              <div className="w-full max-w-xs mb-6">
                <PdfPreview file={file} className="w-full" />
                <p className="text-sm font-medium text-center mt-4 line-clamp-2 break-words" data-testid="text-filename">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {((file.size || 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="relative aspect-[3/4] w-56 bg-white shadow-xl rounded-sm border p-6 flex flex-col items-center justify-center mb-6">
                <Icon className={cn("h-16 w-16 mb-4", colorClass.split(' ')[0])} />
                <p className="text-sm font-medium text-center line-clamp-2 w-full break-words" data-testid="text-filename">
                  {multiFile ? `${files.length} file(s) selected` : file?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {multiFile 
                    ? `${(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total`
                    : `${((file?.size || 0) / 1024 / 1024).toFixed(2)} MB`
                  }
                </p>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
              Remove file{multiFile && files.length > 1 ? 's' : ''}
            </Button>
          </div>

          <div className="flex-1 p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">{processLabel}</h3>
                <p className="text-muted-foreground text-sm">
                  Ready to process <strong>{multiFile ? `${files.length} file(s)` : file?.name}</strong>
                </p>
              </div>

              {requiresPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    data-testid="input-password"
                  />
                </div>
              )}

              {requiresText && (
                <div className="space-y-2">
                  <Label htmlFor="text">Text</Label>
                  <Input
                    id="text"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text"
                    data-testid="input-text"
                  />
                </div>
              )}

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
                  className={cn("w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5", buttonClass)}
                  onClick={handleProcess}
                  data-testid="button-process"
                >
                  {processLabel}
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
