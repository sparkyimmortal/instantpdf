import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  Loader2,
  X,
  ImageIcon,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Columns,
  Square,
  Grid3X3,
} from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LayoutOption = "full" | "2up" | "2x2" | "3x3";
type MarginOption = "none" | "small" | "medium" | "large";
type PageSizeOption = "a4" | "letter" | "a3";

interface UploadedImage {
  file: File;
  preview: string;
}

const layoutOptions: { value: LayoutOption; label: string; description: string }[] = [
  { value: "full", label: "Full Page", description: "1 image per page" },
  { value: "2up", label: "2-Up", description: "2 images per page" },
  { value: "2x2", label: "Grid 2×2", description: "4 images per page" },
  { value: "3x3", label: "Grid 3×3", description: "9 images per page" },
];

export default function ImageCollage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [layout, setLayout] = useState<LayoutOption>("full");
  const [margin, setMargin] = useState<MarginOption>("medium");
  const [pageSize, setPageSize] = useState<PageSizeOption>("a4");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/bmp": [".bmp"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    multiple: true,
  });

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    setImages((prev) => {
      const newArr = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      images.forEach((img) => formData.append("files", img.file));
      formData.append("layout", layout);
      formData.append("margin", margin);
      formData.append("pageSize", pageSize);

      const response = await pdfFetch("/api/pdf/image-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const data = await response.json();
      await downloadPdfFile(data.downloadUrl, "collage.pdf");

      toast({ title: "Success!", description: "Your PDF collage has been generated." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const LayoutIcon = ({ type }: { type: LayoutOption }) => {
    const baseClass = "w-10 h-10 border rounded p-1 grid gap-0.5";
    switch (type) {
      case "full":
        return (
          <div className={cn(baseClass, "grid-cols-1 grid-rows-1")}>
            <div className="bg-current rounded-sm opacity-40" />
          </div>
        );
      case "2up":
        return (
          <div className={cn(baseClass, "grid-cols-1 grid-rows-2")}>
            <div className="bg-current rounded-sm opacity-40" />
            <div className="bg-current rounded-sm opacity-40" />
          </div>
        );
      case "2x2":
        return (
          <div className={cn(baseClass, "grid-cols-2 grid-rows-2")}>
            <div className="bg-current rounded-sm opacity-40" />
            <div className="bg-current rounded-sm opacity-40" />
            <div className="bg-current rounded-sm opacity-40" />
            <div className="bg-current rounded-sm opacity-40" />
          </div>
        );
      case "3x3":
        return (
          <div className={cn(baseClass, "grid-cols-3 grid-rows-3")}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-current rounded-sm opacity-40" />
            ))}
          </div>
        );
    }
  };

  return (
    <ToolLayout
      title="Image to PDF Collage"
      description="Upload multiple images and arrange them into a beautifully laid out PDF"
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-6 min-h-[500px]">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-6",
                isDragActive
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-border hover:border-orange-500/50"
              )}
              data-testid="dropzone"
            >
              <input {...getInputProps()} data-testid="input-file" />
              <Upload className="w-12 h-12 mx-auto mb-3 text-orange-500" />
              <p className="text-lg font-medium text-foreground mb-1">
                Drop images here
              </p>
              <p className="text-muted-foreground text-sm">
                JPG, PNG, BMP, WebP, GIF supported
              </p>
            </div>

            {images.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {images.length} image{images.length !== 1 ? "s" : ""} selected
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      images.forEach((img) => URL.revokeObjectURL(img.preview));
                      setImages([]);
                    }}
                    data-testid="button-clear-all"
                  >
                    Clear all
                  </Button>
                </div>
                <AnimatePresence>
                  {images.map((img, index) => (
                    <motion.div
                      key={img.preview}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/20"
                      data-testid={`image-row-${index}`}
                    >
                      <img
                        src={img.preview}
                        alt={img.file.name}
                        className="w-12 h-12 object-cover rounded border"
                        data-testid={`img-thumbnail-${index}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          data-testid={`text-filename-${index}`}
                        >
                          {img.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-filesize-${index}`}>
                          {formatSize(img.file.size)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveImage(index, "up")}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                          data-testid={`button-move-up-${index}`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveImage(index, "down")}
                          disabled={index === images.length - 1}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                          data-testid={`button-move-down-${index}`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeImage(index)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="w-full lg:w-80 bg-muted/30 border-t lg:border-t-0 lg:border-l border-border p-6">
            <h2 className="text-xl font-bold mb-6">Settings</h2>

            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium mb-3 block">Layout</Label>
                <div className="grid grid-cols-2 gap-2">
                  {layoutOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLayout(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                        layout === opt.value
                          ? "border-orange-500 bg-orange-500/10 text-orange-600"
                          : "border-border hover:border-orange-500/30 text-muted-foreground"
                      )}
                      data-testid={`button-layout-${opt.value}`}
                    >
                      <LayoutIcon type={opt.value} />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Margin</Label>
                <Select value={margin} onValueChange={(v) => setMargin(v as MarginOption)}>
                  <SelectTrigger data-testid="select-margin">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Page Size</Label>
                <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSizeOption)}>
                  <SelectTrigger data-testid="select-page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="a3">A3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isProcessing || images.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-0 h-12"
                data-testid="button-generate"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </ToolLayout>
  );
}
