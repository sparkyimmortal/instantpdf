import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, PenLine, Loader2, FileText, Trash2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Type, ImageIcon, X, Move, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ToolLayout } from "@/components/ToolLayout";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
}

interface PlacedSignature {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: string;
}

type ResizeHandle = "nw" | "ne" | "sw" | "se" | null;

type SignatureMode = "draw" | "type" | "upload";

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("draw");
  const [signatureColor, setSignatureColor] = useState("#000000");
  const [signatureReady, setSignatureReady] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSignature[]>([]);
  const [draggingSignature, setDraggingSignature] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingSignature, setResizingSignature] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, sigX: 0, sigY: 0 });
  const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
  const [sidebarDragPos, setSidebarDragPos] = useState({ x: 0, y: 0 });
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null);

  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [drawingHistoryIndex, setDrawingHistoryIndex] = useState(-1);
  const [signatureHistory, setSignatureHistory] = useState<PlacedSignature[][]>([[]]);
  const [signatureHistoryIndex, setSignatureHistoryIndex] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setIsComplete(false);
      setDownloadUrl(null);
      setPlacedSignatures([]);
      setSignatureReady(null);
      setDrawingHistory([]);
      setDrawingHistoryIndex(-1);
      setSignatureHistory([[]]);
      setSignatureHistoryIndex(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  useEffect(() => {
    if (!file) {
      setPages([]);
      return;
    }

    async function loadPreview() {
      setLoadingPages(true);
      try {
        const formData = new FormData();
        formData.append("file", file!);

        const response = await pdfFetch("/api/pdf/preview", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.pages) {
            const pagesData = data.pages.map((p: PagePreview) => {
              let url = p.imageUrl;
              if (url.startsWith("http://") || url.startsWith("https://")) {
                const urlObj = new URL(url);
                url = urlObj.pathname;
              }
              return { ...p, imageUrl: url };
            });
            setPages(pagesData);
          }
        }
      } catch (err) {
        console.error("Preview error:", err);
      } finally {
        setLoadingPages(false);
      }
    }

    loadPreview();
  }, [file]);

  useEffect(() => {
    if (signatureMode === "draw" && drawCanvasRef.current) {
      const canvas = drawCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setDrawingHistory([]);
    setDrawingHistoryIndex(-1);
    setSignatureReady(null);
  }, [signatureMode, file]);

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawingSignature(true);
    setLastPoint({ x, y });
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature || !lastPoint) return;

    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.strokeStyle = signatureColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastPoint({ x, y });
  };

  const handleDrawEnd = () => {
    setIsDrawingSignature(false);
    setLastPoint(null);
    
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      setSignatureReady(dataUrl);
      
      const newHistory = drawingHistory.slice(0, drawingHistoryIndex + 1);
      newHistory.push(dataUrl);
      setDrawingHistory(newHistory);
      setDrawingHistoryIndex(newHistory.length - 1);
    }
  };

  const clearDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureReady(null);
    setDrawingHistory([]);
    setDrawingHistoryIndex(-1);
  };

  const undoDrawing = () => {
    if (drawingHistoryIndex <= 0) {
      const canvas = drawCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      setSignatureReady(null);
      setDrawingHistoryIndex(-1);
      return;
    }
    
    const newIndex = drawingHistoryIndex - 1;
    setDrawingHistoryIndex(newIndex);
    
    const canvas = drawCanvasRef.current;
    if (canvas && drawingHistory[newIndex]) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = drawingHistory[newIndex];
      }
      setSignatureReady(drawingHistory[newIndex]);
    }
  };

  const redoDrawing = () => {
    if (drawingHistoryIndex >= drawingHistory.length - 1) return;
    
    const newIndex = drawingHistoryIndex + 1;
    setDrawingHistoryIndex(newIndex);
    
    const canvas = drawCanvasRef.current;
    if (canvas && drawingHistory[newIndex]) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = drawingHistory[newIndex];
      }
      setSignatureReady(drawingHistory[newIndex]);
    }
  };

  const generateTypedSignature = () => {
    if (!typedSignature.trim()) return;

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 80;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "italic 32px 'Brush Script MT', cursive, Georgia, serif";
    ctx.fillStyle = signatureColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

    setSignatureReady(canvas.toDataURL("image/png"));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSignatureReady(reader.result as string);
    };
    reader.readAsDataURL(uploadedFile);
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!signatureReady || draggingSignature || resizingSignature) return;

    const container = e.currentTarget;
    const img = container.querySelector('img');
    if (!img) return;
    
    const imgRect = img.getBoundingClientRect();
    const zoomFactor = zoom / 100;
    
    const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
    const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;

    const newSignature: PlacedSignature = {
      id: `sig-${Date.now()}`,
      page: currentPage + 1,
      x: Math.max(0, x - 10),
      y: Math.max(0, y - 3),
      width: 20,
      height: 6,
      imageData: signatureReady,
    };

    const newSignatures = [...placedSignatures, newSignature];
    setPlacedSignatures(newSignatures);
    
    const newHistory = signatureHistory.slice(0, signatureHistoryIndex + 1);
    newHistory.push(newSignatures.map(s => ({ ...s })));
    setSignatureHistory(newHistory);
    setSignatureHistoryIndex(newHistory.length - 1);
  };

  const handleSignatureDragStart = (e: React.MouseEvent, sigId: string) => {
    e.stopPropagation();
    const sig = placedSignatures.find(s => s.id === sigId);
    if (!sig) return;

    const container = e.currentTarget.parentElement as HTMLElement;
    const img = container.querySelector('img');
    if (!img) return;
    
    const imgRect = img.getBoundingClientRect();
    const clickX = ((e.clientX - imgRect.left) / imgRect.width) * 100;
    const clickY = ((e.clientY - imgRect.top) / imgRect.height) * 100;

    setDraggingSignature(sigId);
    setDragOffset({ x: clickX - sig.x, y: clickY - sig.y });
  };

  const handleSignatureDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingSignature) return;

    const img = e.currentTarget.querySelector('img');
    if (!img) return;
    
    const imgRect = img.getBoundingClientRect();
    const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
    const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;

    setPlacedSignatures(sigs =>
      sigs.map(sig =>
        sig.id === draggingSignature
          ? { ...sig, x: Math.max(0, Math.min(80, x - dragOffset.x)), y: Math.max(0, Math.min(94, y - dragOffset.y)) }
          : sig
      )
    );
  };

  const handleSignatureDragEnd = () => {
    if (draggingSignature) {
      const newHistory = signatureHistory.slice(0, signatureHistoryIndex + 1);
      newHistory.push(placedSignatures.map(s => ({ ...s })));
      setSignatureHistory(newHistory);
      setSignatureHistoryIndex(newHistory.length - 1);
    }
    setDraggingSignature(null);
  };

  const handleResizeStart = (e: React.MouseEvent, sigId: string, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();
    const sig = placedSignatures.find(s => s.id === sigId);
    if (!sig || !previewContainerRef.current) return;

    const img = previewContainerRef.current.querySelector('img');
    if (!img) return;
    
    const imgRect = img.getBoundingClientRect();
    const mouseX = ((e.clientX - imgRect.left) / imgRect.width) * 100;
    const mouseY = ((e.clientY - imgRect.top) / imgRect.height) * 100;

    setResizingSignature(sigId);
    setResizeHandle(handle);
    setResizeStart({ 
      x: mouseX, 
      y: mouseY, 
      width: sig.width, 
      height: sig.height,
      sigX: sig.x,
      sigY: sig.y
    });
  };

  const handleResizeMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!resizingSignature || !resizeHandle || !previewContainerRef.current) return;

    const img = e.currentTarget.querySelector('img');
    if (!img) return;
    
    const imgRect = img.getBoundingClientRect();
    const mouseX = ((e.clientX - imgRect.left) / imgRect.width) * 100;
    const mouseY = ((e.clientY - imgRect.top) / imgRect.height) * 100;

    const deltaX = mouseX - resizeStart.x;
    const deltaY = mouseY - resizeStart.y;

    setPlacedSignatures(sigs =>
      sigs.map(sig => {
        if (sig.id !== resizingSignature) return sig;

        let newX = resizeStart.sigX;
        let newY = resizeStart.sigY;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;

        if (resizeHandle === "se") {
          newWidth = Math.max(5, resizeStart.width + deltaX);
          newHeight = Math.max(3, resizeStart.height + deltaY);
        } else if (resizeHandle === "sw") {
          newX = Math.max(0, resizeStart.sigX + deltaX);
          newWidth = Math.max(5, resizeStart.width - deltaX);
          newHeight = Math.max(3, resizeStart.height + deltaY);
        } else if (resizeHandle === "ne") {
          newY = Math.max(0, resizeStart.sigY + deltaY);
          newWidth = Math.max(5, resizeStart.width + deltaX);
          newHeight = Math.max(3, resizeStart.height - deltaY);
        } else if (resizeHandle === "nw") {
          newX = Math.max(0, resizeStart.sigX + deltaX);
          newY = Math.max(0, resizeStart.sigY + deltaY);
          newWidth = Math.max(5, resizeStart.width - deltaX);
          newHeight = Math.max(3, resizeStart.height - deltaY);
        }

        return { ...sig, x: newX, y: newY, width: newWidth, height: newHeight };
      })
    );
  };

  const handleResizeEnd = () => {
    if (resizingSignature) {
      const newHistory = signatureHistory.slice(0, signatureHistoryIndex + 1);
      newHistory.push(placedSignatures.map(s => ({ ...s })));
      setSignatureHistory(newHistory);
      setSignatureHistoryIndex(newHistory.length - 1);
    }
    setResizingSignature(null);
    setResizeHandle(null);
  };

  const handleSidebarDragStart = (e: React.MouseEvent) => {
    if (!signatureReady) return;
    e.preventDefault();
    setIsDraggingFromSidebar(true);
    setSidebarDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingFromSidebar) {
      setSidebarDragPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDraggingFromSidebar]);

  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    if (isDraggingFromSidebar && previewContainerRef.current) {
      const img = previewContainerRef.current.querySelector('img');
      if (!img) {
        setIsDraggingFromSidebar(false);
        return;
      }
      
      const imgRect = img.getBoundingClientRect();
      
      if (e.clientX >= imgRect.left && e.clientX <= imgRect.right && 
          e.clientY >= imgRect.top && e.clientY <= imgRect.bottom) {
        const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
        const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;

        const newSignature: PlacedSignature = {
          id: `sig-${Date.now()}`,
          page: currentPage + 1,
          x: Math.max(0, x - 10),
          y: Math.max(0, y - 3),
          width: 20,
          height: 6,
          imageData: signatureReady!,
        };

        const newSignatures = [...placedSignatures, newSignature];
        setPlacedSignatures(newSignatures);
        setSelectedSignature(newSignature.id);
        
        const newHistory = signatureHistory.slice(0, signatureHistoryIndex + 1);
        newHistory.push(newSignatures.map(s => ({ ...s })));
        setSignatureHistory(newHistory);
        setSignatureHistoryIndex(newHistory.length - 1);
      }
    }
    setIsDraggingFromSidebar(false);
  }, [isDraggingFromSidebar, currentPage, signatureReady, placedSignatures, signatureHistory, signatureHistoryIndex]);

  useEffect(() => {
    if (isDraggingFromSidebar) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isDraggingFromSidebar, handleGlobalMouseMove, handleGlobalMouseUp]);

  const removeSignature = (sigId: string) => {
    const newSignatures = placedSignatures.filter(s => s.id !== sigId);
    setPlacedSignatures(newSignatures);
    
    const newHistory = signatureHistory.slice(0, signatureHistoryIndex + 1);
    newHistory.push(newSignatures.map(s => ({ ...s })));
    setSignatureHistory(newHistory);
    setSignatureHistoryIndex(newHistory.length - 1);
  };

  const undoSignature = () => {
    if (signatureHistoryIndex <= 0) return;
    const newIndex = signatureHistoryIndex - 1;
    setSignatureHistoryIndex(newIndex);
    setPlacedSignatures(signatureHistory[newIndex]);
  };

  const redoSignature = () => {
    if (signatureHistoryIndex >= signatureHistory.length - 1) return;
    const newIndex = signatureHistoryIndex + 1;
    setSignatureHistoryIndex(newIndex);
    setPlacedSignatures(signatureHistory[newIndex]);
  };

  const handleProcess = async () => {
    if (!file || placedSignatures.length === 0) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signatures", JSON.stringify(placedSignatures));

      const response = await pdfFetch("/api/pdf/sign", {
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
      toast({ title: "Success!", description: "Document signed." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to sign PDF",
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
    setPages([]);
    setIsComplete(false);
    setDownloadUrl(null);
    setPlacedSignatures([]);
    setSignatureReady(null);
    setCurrentPage(0);
  };

  const currentPageSignatures = placedSignatures.filter(s => s.page === currentPage + 1);

  if (isComplete) {
    return (
      <ToolLayout
        title="Sign PDF"
        description="Add your signature to any PDF document."
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your PDF is ready!</h2>
          <p className="text-muted-foreground mb-8">Document has been signed.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleDownload} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 px-8" data-testid="button-download">
              Download Signed PDF
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="button-another">
              Sign Another
            </Button>
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  if (!file) {
    return (
      <ToolLayout
        title="Sign PDF"
        description="Add your signature to any PDF document."
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8">
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
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-select-file">Select PDF file</Button>
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background flex flex-col">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="font-medium">{file.name}</span>
              <button onClick={() => setFile(null)} className="ml-2 text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {signatureReady && (
              <span className="text-sm text-green-400 flex items-center gap-1">
                <PenLine className="w-4 h-4" /> Signature ready - click on PDF to place
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 bg-card border-r border-border overflow-y-auto p-4">
          <h3 className="font-bold text-foreground mb-4">Create Signature</h3>
          
          <div className="flex gap-1 mb-4">
            <Button
              variant={signatureMode === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => setSignatureMode("draw")}
              className={signatureMode === "draw" ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" : ""}
              data-testid="button-mode-draw"
            >
              <PenLine className="w-4 h-4 mr-1" /> Draw
            </Button>
            <Button
              variant={signatureMode === "type" ? "default" : "outline"}
              size="sm"
              onClick={() => setSignatureMode("type")}
              className={signatureMode === "type" ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" : ""}
              data-testid="button-mode-type"
            >
              <Type className="w-4 h-4 mr-1" /> Type
            </Button>
            <Button
              variant={signatureMode === "upload" ? "default" : "outline"}
              size="sm"
              onClick={() => setSignatureMode("upload")}
              className={signatureMode === "upload" ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" : ""}
              data-testid="button-mode-upload"
            >
              <ImageIcon className="w-4 h-4 mr-1" /> Upload
            </Button>
          </div>

          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Color</label>
            <div className="flex gap-2">
              {["#000000", "#1565c0", "#c62828"].map((color) => (
                <button
                  key={color}
                  onClick={() => setSignatureColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2",
                    signatureColor === color ? "border-foreground ring-2 ring-offset-1 ring-muted-foreground" : "border-border"
                  )}
                  style={{ backgroundColor: color }}
                  data-testid={`button-color-${color.replace("#", "")}`}
                />
              ))}
            </div>
          </div>

          {signatureMode === "draw" && (
            <div className="space-y-3">
              <div className="border border-border rounded-lg overflow-hidden" style={{ background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 16px 16px' }}>
                <canvas
                  ref={drawCanvasRef}
                  width={240}
                  height={100}
                  className="w-full cursor-crosshair"
                  style={{ background: 'transparent' }}
                  onMouseDown={handleDrawStart}
                  onMouseMove={handleDrawMove}
                  onMouseUp={handleDrawEnd}
                  onMouseLeave={handleDrawEnd}
                  data-testid="canvas-draw-signature"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={undoDrawing} 
                  disabled={drawingHistoryIndex < 0}
                  className="flex-1"
                  data-testid="button-undo-drawing"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={redoDrawing} 
                  disabled={drawingHistoryIndex >= drawingHistory.length - 1}
                  className="flex-1"
                  data-testid="button-redo-drawing"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={clearDrawCanvas} className="flex-1" data-testid="button-clear-signature">
                  Clear
                </Button>
              </div>
            </div>
          )}

          {signatureMode === "type" && (
            <div className="space-y-3">
              <Input
                placeholder="Type your signature"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                className="font-serif italic text-lg"
                data-testid="input-typed-signature"
              />
              <Button onClick={generateTypedSignature} disabled={!typedSignature.trim()} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" data-testid="button-apply-typed">
                Apply Signature
              </Button>
            </div>
          )}

          {signatureMode === "upload" && (
            <div className="space-y-3">
              <label className="block border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-upload-signature"
                />
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload signature image</span>
              </label>
            </div>
          )}

          {signatureReady && (
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="text-sm text-green-400 font-medium mb-2">Drag to place:</p>
              <div 
                className="bg-card p-2 rounded border border-border cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-shadow"
                onMouseDown={handleSidebarDragStart}
                data-testid="draggable-signature"
              >
                <img src={signatureReady} alt="Signature preview" className="max-h-16 mx-auto pointer-events-none" draggable={false} />
              </div>
              <p className="text-xs text-green-400 mt-2 text-center">or click on the PDF to place</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground mb-2">Placed Signatures</h4>
            {placedSignatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signatures placed yet</p>
            ) : (
              <div className="space-y-2">
                {placedSignatures.map((sig, idx) => (
                  <div key={sig.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                    <span className="text-sm">Page {sig.page}</span>
                    <button onClick={() => removeSignature(sig.id)} className="text-destructive hover:text-destructive/80" data-testid={`button-remove-sig-${idx}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto bg-muted/30 p-4 flex items-start justify-center">
            {pages.length > 0 && pages[currentPage] && (
              <div
                ref={previewContainerRef}
                className={cn(
                  "relative bg-card shadow-lg inline-block",
                  signatureReady && !draggingSignature && !resizingSignature ? "cursor-crosshair" : "cursor-default"
                )}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
                onClick={handlePreviewClick}
                onMouseMove={(e) => {
                  handleSignatureDrag(e);
                  handleResizeMove(e);
                }}
                onMouseUp={() => {
                  handleSignatureDragEnd();
                  handleResizeEnd();
                }}
                onMouseLeave={() => {
                  handleSignatureDragEnd();
                  handleResizeEnd();
                }}
              >
                <img
                  src={pages[currentPage].imageUrl}
                  alt={`Page ${currentPage + 1}`}
                  className="max-w-full"
                  draggable={false}
                />

                {currentPageSignatures.map((sig) => {
                  const isSelected = selectedSignature === sig.id || draggingSignature === sig.id || resizingSignature === sig.id;
                  return (
                    <div
                      key={sig.id}
                      className={cn(
                        "absolute cursor-move border-2 transition-all",
                        isSelected ? "border-cyan-500 border-dashed" : "border-transparent hover:border-cyan-400"
                      )}
                      style={{
                        left: `${sig.x}%`,
                        top: `${sig.y}%`,
                        width: `${sig.width}%`,
                        height: `${sig.height}%`,
                      }}
                      onMouseDown={(e) => {
                        setSelectedSignature(sig.id);
                        handleSignatureDragStart(e, sig.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSignature(sig.id);
                      }}
                    >
                      <img src={sig.imageData} alt="Signature" className="w-full h-full object-contain" draggable={false} />
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSignature(sig.id); }}
                        className={cn(
                          "absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md transition-opacity z-10",
                          isSelected ? "opacity-100" : "opacity-0 hover:opacity-100"
                        )}
                        data-testid={`button-remove-placed-sig-${sig.id}`}
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {isSelected && (
                        <>
                          <div
                            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-cyan-500 rounded-full cursor-nw-resize shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, sig.id, "nw")}
                          />
                          <div
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyan-500 rounded-full cursor-ne-resize shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, sig.id, "ne")}
                          />
                          <div
                            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-cyan-500 rounded-full cursor-sw-resize shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, sig.id, "sw")}
                          />
                          <div
                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-cyan-500 rounded-full cursor-se-resize shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, sig.id, "se")}
                          />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
                            <Move className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {signatureReady && placedSignatures.filter(s => s.page === currentPage + 1).length === 0 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/70 text-foreground rounded-lg px-4 py-2 text-center pointer-events-none">
                    <span className="text-sm">Drag signature here or click to place</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-muted/50 border-t border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="bg-muted px-3 py-1 rounded text-sm">
                {currentPage + 1}
              </div>
              <span className="text-muted-foreground">/ {pages.length}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                disabled={currentPage === pages.length - 1}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={undoSignature}
                disabled={signatureHistoryIndex <= 0}
                data-testid="button-undo-signature"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redoSignature}
                disabled={signatureHistoryIndex >= signatureHistory.length - 1}
                data-testid="button-redo-signature"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={handleProcess}
              disabled={isProcessing || placedSignatures.length === 0}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-10 px-6"
              data-testid="button-sign-pdf"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  Sign PDF <PenLine className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="w-24 bg-muted/50 overflow-y-auto p-2 space-y-2">
          {loadingPages ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            pages.map((page, idx) => (
              <div
                key={page.pageNumber}
                onClick={() => setCurrentPage(idx)}
                className={cn(
                  "cursor-pointer rounded overflow-hidden border-2 transition-all",
                  currentPage === idx ? "border-cyan-500" : "border-transparent hover:border-border"
                )}
                data-testid={`thumbnail-page-${idx + 1}`}
              >
                <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full" />
                <div className="text-center text-xs text-muted-foreground py-1">{page.pageNumber}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {isDraggingFromSidebar && signatureReady && (
        <div
          className="fixed pointer-events-none z-50 opacity-70"
          style={{
            left: sidebarDragPos.x - 50,
            top: sidebarDragPos.y - 20,
            width: 100,
          }}
        >
          <img src={signatureReady} alt="Dragging signature" className="w-full" draggable={false} />
        </div>
      )}
    </motion.div>
  );
}
