import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeftRight, FileText, Image, ZoomIn, ZoomOut } from "lucide-react";

interface BeforeAfterPreviewProps {
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeSize?: number;
  afterSize?: number;
}

export function BeforeAfterPreview({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  beforeSize,
  afterSize,
}: BeforeAfterPreviewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const reductionPercent = beforeSize && afterSize
    ? Math.round((1 - afterSize / beforeSize) * 100)
    : 0;

  if (!beforeImage || !afterImage) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <div className="flex gap-8 items-center">
          <div className="flex flex-col items-center">
            <div className="h-24 w-20 bg-muted rounded-lg flex items-center justify-center mb-2">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">{beforeLabel}</span>
            {beforeSize && (
              <span className="text-xs text-muted-foreground">{formatSize(beforeSize)}</span>
            )}
          </div>
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
          <div className="flex flex-col items-center">
            <div className="h-24 w-20 bg-muted rounded-lg flex items-center justify-center mb-2">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">{afterLabel}</span>
            {afterSize && (
              <span className="text-xs font-medium text-green-500">{formatSize(afterSize)}</span>
            )}
          </div>
        </div>
        {reductionPercent > 0 && (
          <div className="mt-4 px-4 py-2 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
            {reductionPercent}% smaller
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        data-testid="before-after-container"
      >
        <div className="absolute inset-0">
          <img
            src={afterImage}
            alt={afterLabel}
            className="w-full h-full object-contain"
          />
        </div>

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="w-full h-full object-contain"
            style={{ width: `${100 / Math.max(sliderPosition, 1) * 100}%`, maxWidth: "none" }}
          />
        </div>

        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
            <ArrowLeftRight className="h-4 w-4 text-gray-600" />
          </div>
        </motion.div>

        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 text-white text-sm rounded-full">
          {beforeLabel}
          {beforeSize && ` (${formatSize(beforeSize)})`}
        </div>
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 text-white text-sm rounded-full">
          {afterLabel}
          {afterSize && ` (${formatSize(afterSize)})`}
        </div>
      </div>

      <div className="p-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Comparison</span>
          <Slider
            value={[sliderPosition]}
            onValueChange={(val) => setSliderPosition(val[0])}
            min={0}
            max={100}
            step={1}
            className="w-32"
            data-testid="slider-comparison"
          />
        </div>
        {reductionPercent > 0 && (
          <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
            {reductionPercent}% reduction
          </div>
        )}
      </div>
    </Card>
  );
}

interface SideBySidePreviewProps {
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeSize?: number;
  afterSize?: number;
}

export function SideBySidePreview({
  beforeImage,
  afterImage,
  beforeLabel = "Original",
  afterLabel = "Processed",
  beforeSize,
  afterSize,
}: SideBySidePreviewProps) {
  const [zoom, setZoom] = useState(100);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex border-b p-2 gap-2 justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(Math.max(50, zoom - 25))}
          disabled={zoom <= 50}
          data-testid="button-zoom-out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm flex items-center px-2">{zoom}%</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom(Math.min(200, zoom + 25))}
          disabled={zoom >= 200}
          data-testid="button-zoom-in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-background p-4">
          <div className="text-center mb-2">
            <span className="text-sm font-medium">{beforeLabel}</span>
            {beforeSize && (
              <span className="text-xs text-muted-foreground ml-2">
                ({formatSize(beforeSize)})
              </span>
            )}
          </div>
          <div
            className="overflow-auto max-h-[400px] flex items-center justify-center bg-muted/30 rounded-lg p-4"
            data-testid="preview-before"
          >
            {beforeImage ? (
              <img
                src={beforeImage}
                alt={beforeLabel}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
                className="max-w-none"
              />
            ) : (
              <div className="h-48 w-36 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-background p-4">
          <div className="text-center mb-2">
            <span className="text-sm font-medium">{afterLabel}</span>
            {afterSize && (
              <span className="text-xs text-green-500 ml-2">
                ({formatSize(afterSize)})
              </span>
            )}
          </div>
          <div
            className="overflow-auto max-h-[400px] flex items-center justify-center bg-muted/30 rounded-lg p-4"
            data-testid="preview-after"
          >
            {afterImage ? (
              <img
                src={afterImage}
                alt={afterLabel}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
                className="max-w-none"
              />
            ) : (
              <div className="h-48 w-36 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
