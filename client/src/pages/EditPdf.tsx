import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, Download, PenLine, Loader2, FileText, Trash2, Type, Image, 
  Pencil, Square, Circle, Highlighter, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Edit3, X, GripVertical, RotateCw
} from "lucide-react";
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

interface Annotation {
  id: string;
  type: "text" | "image" | "drawing" | "shape";
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  color?: string;
  imageData?: string;
  drawingPath?: { x: number; y: number }[];
  shapeType?: "rectangle" | "circle";
}

export default function EditPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "image" | "draw" | "highlight" | "shape">("select");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawingPath, setCurrentDrawingPath] = useState<{ x: number; y: number }[]>([]);
  const [drawColor, setDrawColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setIsComplete(false);
      setDownloadUrl(null);
      setAnnotations([]);
      setCurrentPage(0);
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "text") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const newAnnotation: Annotation = {
        id: `text-${Date.now()}`,
        type: "text",
        page: currentPage + 1,
        x,
        y,
        content: "New Text",
        fontSize,
        color: textColor,
      };
      setAnnotations([...annotations, newAnnotation]);
      setSelectedAnnotation(newAnnotation.id);
      setActiveTool("select");
    }
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "draw" && activeTool !== "highlight") return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setIsDrawing(true);
    setCurrentDrawingPath([{ x, y }]);
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || (activeTool !== "draw" && activeTool !== "highlight")) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setCurrentDrawingPath([...currentDrawingPath, { x, y }]);
  };

  const handleDrawEnd = () => {
    if (!isDrawing || currentDrawingPath.length < 2) {
      setIsDrawing(false);
      setCurrentDrawingPath([]);
      return;
    }

    const newAnnotation: Annotation = {
      id: `drawing-${Date.now()}`,
      type: "drawing",
      page: currentPage + 1,
      x: 0,
      y: 0,
      color: activeTool === "highlight" ? "#FFFF00" : drawColor,
      drawingPath: [...currentDrawingPath],
    };
    setAnnotations([...annotations, newAnnotation]);
    setIsDrawing(false);
    setCurrentDrawingPath([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newAnnotation: Annotation = {
        id: `image-${Date.now()}`,
        type: "image",
        page: currentPage + 1,
        x: 20,
        y: 20,
        width: 30,
        height: 30,
        imageData: reader.result as string,
      };
      setAnnotations([...annotations, newAnnotation]);
      setSelectedAnnotation(newAnnotation.id);
    };
    reader.readAsDataURL(uploadedFile);
    
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(annotations.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    if (selectedAnnotation === id) {
      setSelectedAnnotation(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("annotations", JSON.stringify(annotations));

      const response = await pdfFetch("/api/pdf/edit", {
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
      toast({ title: "Success!", description: "PDF edited successfully." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to edit PDF",
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
    setAnnotations([]);
    setIsComplete(false);
    setDownloadUrl(null);
    setCurrentPage(0);
  };

  const currentPageAnnotations = annotations.filter(a => a.page === currentPage + 1);

  if (isComplete) {
    return (
      <ToolLayout
        title="Edit PDF"
        description="Add text, images, and annotations to your PDF."
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your PDF is ready!</h2>
          <p className="text-muted-foreground mb-8">PDF has been edited successfully.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleDownload} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-12 px-8" data-testid="button-download">
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="button-another">
              Edit Another
            </Button>
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  if (!file) {
    return (
      <ToolLayout
        title="Edit PDF"
        description="Add text, images, and annotations to your PDF."
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors",
              isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-cyan-500/50"
            )}
            data-testid="dropzone-edit"
          >
            <input {...getInputProps()} data-testid="input-file-edit" />
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
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTool === "select" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTool("select")}
              className={activeTool === "select" ? "bg-muted text-foreground" : ""}
            >
              <Edit3 className="w-4 h-4 mr-1" /> Select
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <Button
              variant={activeTool === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTool("text")}
              className={activeTool === "text" ? "bg-cyan-500/10 text-cyan-500" : ""}
              data-testid="tool-text"
            >
              <Type className="w-4 h-4 mr-1" /> Add Text
            </Button>
            <Button
              variant={activeTool === "image" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTool("image");
                imageInputRef.current?.click();
              }}
              className={activeTool === "image" ? "bg-cyan-500/10 text-cyan-500" : ""}
              data-testid="tool-image"
            >
              <Image className="w-4 h-4 mr-1" /> Add Image
            </Button>
            <Button
              variant={activeTool === "draw" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTool("draw")}
              className={activeTool === "draw" ? "bg-cyan-500/10 text-cyan-500" : ""}
              data-testid="tool-draw"
            >
              <Pencil className="w-4 h-4 mr-1" /> Draw
            </Button>
            <Button
              variant={activeTool === "highlight" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTool("highlight")}
              className={activeTool === "highlight" ? "bg-yellow-500/10 text-yellow-500" : ""}
              data-testid="tool-highlight"
            >
              <Highlighter className="w-4 h-4 mr-1" /> Highlight
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-4">
            {activeTool === "text" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
                  className="w-16 h-8 text-sm"
                  min={8}
                  max={72}
                />
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            )}
            {activeTool === "draw" && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => setDrawColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
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

        <div className="flex-1 overflow-auto bg-muted/30 p-4 flex items-start justify-center">
          {pages.length > 0 && pages[currentPage] && (
            <div
              ref={containerRef}
              className="relative bg-card shadow-lg"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
              onClick={handleCanvasClick}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
            >
              <img
                src={pages[currentPage].imageUrl}
                alt={`Page ${currentPage + 1}`}
                className="max-w-full"
                draggable={false}
              />

              {currentPageAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className={cn(
                    "absolute cursor-move",
                    selectedAnnotation === annotation.id && "ring-2 ring-cyan-500"
                  )}
                  style={{
                    left: `${annotation.x}%`,
                    top: `${annotation.y}%`,
                    ...(annotation.width && { width: `${annotation.width}%` }),
                    ...(annotation.height && { height: `${annotation.height}%` }),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotation(annotation.id);
                  }}
                >
                  {annotation.type === "text" && (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="outline-none min-w-[50px] px-1"
                      style={{
                        fontSize: `${annotation.fontSize}px`,
                        color: annotation.color,
                      }}
                      onBlur={(e) => updateAnnotation(annotation.id, { content: e.currentTarget.textContent || "" })}
                    >
                      {annotation.content}
                    </div>
                  )}
                  {annotation.type === "image" && annotation.imageData && (
                    <img
                      src={annotation.imageData}
                      alt="Annotation"
                      className="max-w-[200px] max-h-[200px] object-contain"
                      draggable={false}
                    />
                  )}
                </div>
              ))}

              {currentPageAnnotations
                .filter((a) => a.type === "drawing" && a.drawingPath)
                .map((annotation) => (
                  <svg
                    key={annotation.id}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 10 }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d={annotation.drawingPath!.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                      fill="none"
                      stroke={annotation.color}
                      strokeWidth={annotation.color === "#FFFF00" ? 6 : 1}
                      strokeOpacity={annotation.color === "#FFFF00" ? 0.5 : 1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ))}

              {isDrawing && currentDrawingPath.length > 1 && (
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none" 
                  style={{ zIndex: 20 }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d={currentDrawingPath.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                    fill="none"
                    stroke={activeTool === "highlight" ? "#FFFF00" : drawColor}
                    strokeWidth={activeTool === "highlight" ? 6 : 1}
                    strokeOpacity={activeTool === "highlight" ? 0.5 : 1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        <div className="w-64 bg-card border-l border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-foreground">Edit PDF</h3>
            <p className="text-xs text-muted-foreground mt-1">Reorder items to move them to the back or front.</p>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-sm">Page {currentPage + 1}</span>
              <button
                onClick={() => setAnnotations(annotations.filter(a => a.page !== currentPage + 1))}
                className="text-destructive text-xs hover:underline"
              >
                Remove all
              </button>
            </div>

            <div className="space-y-2">
              {currentPageAnnotations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No annotations on this page</p>
              ) : (
                currentPageAnnotations.map((annotation, idx) => (
                  <div
                    key={annotation.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded border cursor-pointer",
                      selectedAnnotation === annotation.id ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedAnnotation(annotation.id)}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    {annotation.type === "text" && <Type className="w-4 h-4 text-muted-foreground" />}
                    {annotation.type === "image" && <Image className="w-4 h-4 text-muted-foreground" />}
                    {annotation.type === "drawing" && <Pencil className="w-4 h-4 text-muted-foreground" />}
                    <span className="flex-1 text-sm truncate">
                      {annotation.type === "text" ? annotation.content?.substring(0, 15) || "Text" : 
                       annotation.type === "image" ? "Image" : 
                       annotation.color === "#FFFF00" ? "Highlight" : "Drawing"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(annotation.id);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 border-t border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
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
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={handleProcess}
          disabled={isProcessing || annotations.length === 0}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 h-10 px-6"
          data-testid="button-edit-pdf"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Edit PDF <Download className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
