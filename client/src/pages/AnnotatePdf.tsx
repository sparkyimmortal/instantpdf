import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  Loader2,
  Highlighter,
  StickyNote,
  Pencil,
  Undo2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";
import JSZip from "jszip";

type AnnotationMode = "highlight" | "note" | "draw";

interface HighlightAnnotation {
  type: "highlight";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface NoteAnnotation {
  type: "note";
  page: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface DrawAnnotation {
  type: "draw";
  page: number;
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
}

type Annotation = HighlightAnnotation | NoteAnnotation | DrawAnnotation;

const PRESET_COLORS = [
  "#FFEB3B",
  "#FF5722",
  "#2196F3",
  "#4CAF50",
  "#9C27B0",
  "#000000",
];

export default function AnnotatePdf() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [mode, setMode] = useState<AnnotationMode>("highlight");
  const [selectedColor, setSelectedColor] = useState("#FFEB3B");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number }[] | null>(null);
  const [highlightPreview, setHighlightPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [noteInput, setNoteInput] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [noteText, setNoteText] = useState("");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1000 });

  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setPdfFile(file);
    setAnnotations([]);
    setCurrentPage(0);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quality", "200");
      const response = await pdfFetch("/api/pdf/pdf-to-jpg", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);
      const images: string[] = [];
      const fileNames = Object.keys(zip.files).filter(
        (name) => !zip.files[name].dir
      );
      fileNames.sort();

      for (const name of fileNames) {
        const fileData = await zip.files[name].async("blob");
        const url = URL.createObjectURL(fileData);
        images.push(url);
      }

      setPageImages(images);
      toast({ title: "PDF loaded", description: `${images.length} page(s) ready for annotation.` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load PDF",
        variant: "destructive",
      });
      setPdfFile(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  useEffect(() => {
    if (!pageImages[currentPage] || !bgCanvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const maxWidth = containerRef.current ? containerRef.current.clientWidth - 32 : 800;
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);
      setCanvasSize({ width: w, height: h });

      const bgCanvas = bgCanvasRef.current!;
      bgCanvas.width = w;
      bgCanvas.height = h;
      const ctx = bgCanvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = pageImages[currentPage];
  }, [pageImages, currentPage]);

  useEffect(() => {
    if (!overlayCanvasRef.current) return;
    const canvas = overlayCanvasRef.current;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageAnnotations = annotations.filter((a) => a.page === currentPage);
    for (const ann of pageAnnotations) {
      if (ann.type === "highlight") {
        ctx.fillStyle = ann.color + "66";
        ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
      } else if (ann.type === "note") {
        ctx.fillStyle = ann.color;
        ctx.beginPath();
        ctx.roundRect(ann.x - 12, ann.y - 12, 24, 24, 4);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("N", ann.x, ann.y);

        if (ann.text) {
          ctx.fillStyle = "#000";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "left";
          const maxW = 150;
          const lines = wrapText(ctx, ann.text, maxW);
          const boxH = lines.length * 16 + 8;
          ctx.fillStyle = "#FFFDE7";
          ctx.strokeStyle = "#FBC02D";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(ann.x + 14, ann.y - 12, maxW + 16, boxH, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#333";
          ctx.font = "12px sans-serif";
          lines.forEach((line, i) => {
            ctx.fillText(line, ann.x + 22, ann.y - 2 + i * 16);
          });
        }
      } else if (ann.type === "draw") {
        if (ann.points.length < 2) continue;
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      }
    }

    if (highlightPreview) {
      ctx.fillStyle = selectedColor + "44";
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 1;
      ctx.fillRect(highlightPreview.x, highlightPreview.y, highlightPreview.w, highlightPreview.h);
      ctx.strokeRect(highlightPreview.x, highlightPreview.y, highlightPreview.w, highlightPreview.h);
    }

    if (currentDraw && currentDraw.length >= 2) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(currentDraw[0].x, currentDraw[0].y);
      for (let i = 1; i < currentDraw.length; i++) {
        ctx.lineTo(currentDraw[i].x, currentDraw[i].y);
      }
      ctx.stroke();
    }
  }, [annotations, currentPage, canvasSize, highlightPreview, currentDraw, selectedColor]);

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [""];
  }

  function getCanvasPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = overlayCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getCanvasPos(e);
    if (mode === "highlight") {
      setDrawStart(pos);
      setHighlightPreview({ x: pos.x, y: pos.y, w: 0, h: 0 });
      setIsDrawing(true);
    } else if (mode === "draw") {
      setCurrentDraw([pos]);
      setIsDrawing(true);
    } else if (mode === "note") {
      setNoteInput({ x: pos.x, y: pos.y, visible: true });
      setNoteText("");
      setTimeout(() => noteInputRef.current?.focus(), 50);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const pos = getCanvasPos(e);
    if (mode === "highlight" && drawStart) {
      setHighlightPreview({
        x: Math.min(drawStart.x, pos.x),
        y: Math.min(drawStart.y, pos.y),
        w: Math.abs(pos.x - drawStart.x),
        h: Math.abs(pos.y - drawStart.y),
      });
    } else if (mode === "draw" && currentDraw) {
      setCurrentDraw([...currentDraw, pos]);
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const pos = getCanvasPos(e);

    if (mode === "highlight" && drawStart) {
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.abs(pos.x - drawStart.x);
      const h = Math.abs(pos.y - drawStart.y);
      if (w > 5 && h > 5) {
        setAnnotations((prev) => [
          ...prev,
          { type: "highlight", page: currentPage, x, y, width: w, height: h, color: selectedColor },
        ]);
      }
      setHighlightPreview(null);
      setDrawStart(null);
    } else if (mode === "draw" && currentDraw) {
      if (currentDraw.length >= 2) {
        setAnnotations((prev) => [
          ...prev,
          { type: "draw", page: currentPage, points: currentDraw, color: selectedColor, lineWidth: 3 },
        ]);
      }
      setCurrentDraw(null);
    }
    setIsDrawing(false);
  }

  function handleNoteSubmit() {
    if (noteText.trim()) {
      setAnnotations((prev) => [
        ...prev,
        { type: "note", page: currentPage, x: noteInput.x, y: noteInput.y, text: noteText.trim(), color: selectedColor },
      ]);
    }
    setNoteInput({ x: 0, y: 0, visible: false });
    setNoteText("");
  }

  function handleUndo() {
    setAnnotations((prev) => {
      const pageAnns = prev.filter((a) => a.page === currentPage);
      if (pageAnns.length === 0) return prev;
      const lastAnn = pageAnns[pageAnns.length - 1];
      const idx = prev.lastIndexOf(lastAnn);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function handleClearAll() {
    setAnnotations((prev) => prev.filter((a) => a.page !== currentPage));
  }

  async function handleExport() {
    if (pageImages.length === 0) return;
    setIsExporting(true);

    try {
      const formData = new FormData();
      for (let i = 0; i < pageImages.length; i++) {
        const mergedCanvas = document.createElement("canvas");
        mergedCanvas.width = canvasSize.width;
        mergedCanvas.height = canvasSize.height;
        const ctx = mergedCanvas.getContext("2d")!;

        const img = await loadImage(pageImages[i]);
        ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);

        const pageAnns = annotations.filter((a) => a.page === i);
        renderAnnotationsToCtx(ctx, pageAnns);

        const blob = await new Promise<Blob>((resolve) =>
          mergedCanvas.toBlob((b) => resolve(b!), "image/png")
        );
        formData.append("files", blob, `page-${i + 1}.png`);
      }

      const response = await pdfFetch("/api/pdf/image-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const data = await response.json();
      if (data.downloadUrl) {
        await downloadPdfFile(data.downloadUrl, "annotated.pdf");
        toast({ title: "Exported!", description: "Your annotated PDF has been downloaded." });
      }
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not export annotated PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function renderAnnotationsToCtx(ctx: CanvasRenderingContext2D, anns: Annotation[]) {
    for (const ann of anns) {
      if (ann.type === "highlight") {
        ctx.fillStyle = ann.color + "66";
        ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
      } else if (ann.type === "note") {
        ctx.fillStyle = ann.color;
        ctx.beginPath();
        ctx.roundRect(ann.x - 12, ann.y - 12, 24, 24, 4);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("N", ann.x, ann.y);
        if (ann.text) {
          ctx.fillStyle = "#000";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "left";
          const maxW = 150;
          const lines = wrapText(ctx, ann.text, maxW);
          const boxH = lines.length * 16 + 8;
          ctx.fillStyle = "#FFFDE7";
          ctx.strokeStyle = "#FBC02D";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(ann.x + 14, ann.y - 12, maxW + 16, boxH, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#333";
          ctx.font = "12px sans-serif";
          lines.forEach((line, i) => {
            ctx.fillText(line, ann.x + 22, ann.y - 2 + i * 16);
          });
        }
      } else if (ann.type === "draw") {
        if (ann.points.length < 2) continue;
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      }
    }
  }

  function handleReset() {
    pageImages.forEach((url) => URL.revokeObjectURL(url));
    setPdfFile(null);
    setPageImages([]);
    setAnnotations([]);
    setCurrentPage(0);
    setNoteInput({ x: 0, y: 0, visible: false });
  }

  const pageAnnotationCount = annotations.filter((a) => a.page === currentPage).length;
  const totalAnnotationCount = annotations.length;

  if (!pdfFile) {
    return (
      <ToolLayout title="Annotate PDF" description="Highlight, draw, and add sticky notes to your PDF pages">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors",
              isDragActive ? "border-orange-500 bg-orange-500/10" : "border-border hover:border-orange-500/50"
            )}
            data-testid="dropzone"
          >
            <input {...getInputProps()} data-testid="input-file" />
            {isLoading ? (
              <>
                <Loader2 className="w-12 h-12 mx-auto mb-3 text-orange-500 animate-spin" />
                <p className="text-lg font-medium text-foreground mb-1">Loading PDF pages...</p>
                <p className="text-muted-foreground text-sm">Converting pages to images</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                <p className="text-lg font-medium text-foreground mb-1">Upload a PDF to annotate</p>
                <p className="text-muted-foreground text-sm">Drag & drop or click to select a PDF file</p>
              </>
            )}
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="Annotate PDF" description="Highlight, draw, and add sticky notes to your PDF pages">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/30">
            <Button variant="ghost" size="sm" onClick={handleReset} data-testid="button-reset">
              <X className="w-4 h-4 mr-1" /> New
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              variant={mode === "highlight" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("highlight")}
              data-testid="button-mode-highlight"
              className={mode === "highlight" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <Highlighter className="w-4 h-4 mr-1" /> Highlight
            </Button>
            <Button
              variant={mode === "note" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("note")}
              data-testid="button-mode-note"
              className={mode === "note" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <StickyNote className="w-4 h-4 mr-1" /> Note
            </Button>
            <Button
              variant={mode === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("draw")}
              data-testid="button-mode-draw"
              className={mode === "draw" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <Pencil className="w-4 h-4 mr-1" /> Draw
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex items-center gap-1" data-testid="color-picker">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-transform",
                    selectedColor === color ? "border-foreground scale-125" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  data-testid={`button-color-${color.replace("#", "")}`}
                />
              ))}
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={pageAnnotationCount === 0}
              data-testid="button-undo"
            >
              <Undo2 className="w-4 h-4 mr-1" /> Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={pageAnnotationCount === 0}
              data-testid="button-clear"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>

            <div className="flex-1" />

            {pageImages.length > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2" data-testid="text-page-info">
                  {currentPage + 1} / {pageImages.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pageImages.length - 1, p + 1))}
                  disabled={currentPage === pageImages.length - 1}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Button
              onClick={handleExport}
              disabled={isExporting || totalAnnotationCount === 0}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-0"
              size="sm"
              data-testid="button-export"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" /> Export PDF
                </>
              )}
            </Button>
          </div>

          <div
            ref={containerRef}
            className="flex-1 flex items-start justify-center p-4 bg-muted/20 min-h-[500px] overflow-auto"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <span className="ml-3 text-muted-foreground">Loading pages...</span>
              </div>
            ) : pageImages.length > 0 ? (
              <div
                style={{
                  position: "relative",
                  width: canvasSize.width,
                  height: canvasSize.height,
                }}
                data-testid="canvas-container"
              >
                <canvas
                  ref={bgCanvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: canvasSize.width,
                    height: canvasSize.height,
                  }}
                  data-testid="canvas-background"
                />
                <canvas
                  ref={overlayCanvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: canvasSize.width,
                    height: canvasSize.height,
                    cursor:
                      mode === "highlight"
                        ? "crosshair"
                        : mode === "draw"
                        ? "crosshair"
                        : "pointer",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    if (isDrawing) {
                      handleMouseUp({
                        clientX: 0,
                        clientY: 0,
                      } as React.MouseEvent<HTMLCanvasElement>);
                    }
                  }}
                  data-testid="canvas-overlay"
                />
                {noteInput.visible && (
                  <div
                    style={{
                      position: "absolute",
                      left: noteInput.x,
                      top: noteInput.y,
                      zIndex: 10,
                    }}
                    className="bg-card border border-border rounded-lg shadow-lg p-2 flex gap-1"
                    data-testid="note-input-popup"
                  >
                    <Input
                      ref={noteInputRef}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNoteSubmit();
                        if (e.key === "Escape") setNoteInput({ x: 0, y: 0, visible: false });
                      }}
                      placeholder="Type note..."
                      className="h-8 w-40 text-sm"
                      data-testid="input-note-text"
                    />
                    <Button size="sm" className="h-8" onClick={handleNoteSubmit} data-testid="button-add-note">
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => setNoteInput({ x: 0, y: 0, visible: false })}
                      data-testid="button-cancel-note"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {totalAnnotationCount > 0 && (
            <div className="px-4 py-2 border-t border-border text-sm text-muted-foreground" data-testid="text-annotation-count">
              {totalAnnotationCount} annotation{totalAnnotationCount !== 1 ? "s" : ""} total
              {pageAnnotationCount > 0 && ` (${pageAnnotationCount} on this page)`}
            </div>
          )}
        </div>
      </motion.div>
    </ToolLayout>
  );
}
