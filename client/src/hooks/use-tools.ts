import { useState, useEffect, useCallback } from "react";
import {
  FilePlus, Scissors, Minimize2, FileType, FileText, Image, Lock, Unlock,
  RotateCw, Stamp, ArrowRightLeft, FileCode, Trash2, LayoutGrid,
  Wrench, ScanText, Globe, FileArchive, Hash, Crop, PenTool, PenLine,
  EyeOff, GitCompare, FileSpreadsheet, AlignJustify, Layers,
  ImageDown, FileOutput, Shield, BookOpen, Edit3, ImagePlus, FileImage, Link2
} from "lucide-react";

export type PlanLevel = "anonymous" | "free" | "pro";

export interface Tool {
  icon: any;
  title: string;
  description: string;
  color: string;
  href: string;
  tip?: string;
  minPlan?: PlanLevel;
}

export interface Category {
  name: string;
  tools: Tool[];
}

export const toolTips: Record<string, string> = {
  "/merge-pdf": "Combine multiple PDFs into a single file",
  "/split-pdf": "Extract specific pages or split into chunks",
  "/compress-pdf": "Reduce file size without losing quality",
  "/rotate-pdf": "Rotate pages 90, 180, or 270 degrees",
  "/watermark-pdf": "Add text or image watermarks",
  "/protect-pdf": "Add password protection",
  "/unlock-pdf": "Remove password from PDF",
  "/sign-pdf": "Add electronic signatures",
  "/redact-pdf": "Permanently hide sensitive info",
  "/extract-images": "Download all images from PDF",
  "/extract-text": "Copy all text from PDF",
  "/flatten-pdf": "Make forms non-editable",
};

export const toolCategories: Category[] = [
  {
    name: "Organize PDF",
    tools: [
      { icon: FilePlus, title: "Merge PDF", description: "Combine multiple PDFs into one unified document", color: "bg-red-500/10 text-red-400 dark:bg-red-500/20 dark:text-red-400", href: "/merge-pdf" },
      { icon: Scissors, title: "Split PDF", description: "Separate one page or a whole set for easy conversion", color: "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400", href: "/split-pdf" },
      { icon: Trash2, title: "Remove Pages", description: "Delete selected pages from your PDF file", color: "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400", href: "/remove-pages", minPlan: "free" },
      { icon: LayoutGrid, title: "Organize PDF", description: "Sort, add and delete PDF pages", color: "bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400", href: "/organize-pdf", minPlan: "free" },
    ]
  },
  {
    name: "Optimize PDF",
    tools: [
      { icon: Minimize2, title: "Compress PDF", description: "Reduce file size while optimizing quality", color: "bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400", href: "/compress-pdf" },
      { icon: Wrench, title: "Repair PDF", description: "Recover data from corrupted PDF", color: "bg-slate-500/10 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400", href: "/repair-pdf", minPlan: "free" },
      { icon: ScanText, title: "OCR PDF", description: "Convert scanned PDFs to searchable text", color: "bg-teal-500/10 text-teal-500 dark:bg-teal-500/20 dark:text-teal-400", href: "/ocr-pdf", minPlan: "pro" },
      { icon: Layers, title: "Flatten PDF", description: "Merge form fields and annotations into document", color: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400", href: "/flatten-pdf", minPlan: "free" },
    ]
  },
  {
    name: "Convert to PDF",
    tools: [
      { icon: Image, title: "JPG to PDF", description: "Convert JPG images to PDF", color: "bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-400", href: "/jpg-to-pdf" },
      { icon: FileCode, title: "Word to PDF", description: "Convert DOC and DOCX to PDF", color: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400", href: "/word-to-pdf", minPlan: "free" },
      { icon: ArrowRightLeft, title: "PowerPoint to PDF", description: "Convert PPT and PPTX to PDF", color: "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400", href: "/powerpoint-to-pdf", minPlan: "free" },
      { icon: FileSpreadsheet, title: "Excel to PDF", description: "Convert Excel spreadsheets to PDF", color: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400", href: "/excel-to-pdf", minPlan: "free" },
      { icon: Globe, title: "HTML to PDF", description: "Convert webpages or HTML to PDF", color: "bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-400", href: "/html-to-pdf", minPlan: "pro" },
      { icon: ImagePlus, title: "PNG to PDF", description: "Convert PNG images to PDF document", color: "bg-lime-500/10 text-lime-500 dark:bg-lime-500/20 dark:text-lime-400", href: "/png-to-pdf" },
      { icon: ImagePlus, title: "BMP to PDF", description: "Convert BMP images to PDF document", color: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400", href: "/bmp-to-pdf", minPlan: "free" },
      { icon: FileCode, title: "Markdown to PDF", description: "Convert Markdown text to beautiful PDF", color: "bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400", href: "/markdown-to-pdf", minPlan: "free" },
      { icon: Link2, title: "URL to PDF", description: "Convert any webpage URL to PDF", color: "bg-sky-500/10 text-sky-500 dark:bg-sky-500/20 dark:text-sky-400", href: "/url-to-pdf", minPlan: "pro" },
    ]
  },
  {
    name: "Convert from PDF",
    tools: [
      { icon: Image, title: "PDF to JPG", description: "Convert PDF pages to JPG images", color: "bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-400", href: "/pdf-to-jpg", minPlan: "free" },
      { icon: FileType, title: "PDF to Word", description: "Convert PDF to DOC and DOCX", color: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400", href: "/pdf-to-word", minPlan: "free" },
      { icon: FileText, title: "PDF to PowerPoint", description: "Convert PDF to PPT and PPTX", color: "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400", href: "/pdf-to-powerpoint", minPlan: "free" },
      { icon: FileSpreadsheet, title: "PDF to Excel", description: "Convert PDF to Excel spreadsheets", color: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400", href: "/pdf-to-excel", minPlan: "free" },
      { icon: FileArchive, title: "PDF to PDF/A", description: "Convert PDF to PDF/A for archiving", color: "bg-stone-500/10 text-stone-500 dark:bg-stone-500/20 dark:text-stone-400", href: "/pdf-to-pdfa", minPlan: "pro" },
      { icon: ImageDown, title: "Extract Images", description: "Pull all images from your PDF", color: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400", href: "/extract-images", minPlan: "pro" },
      { icon: FileOutput, title: "Extract Text", description: "Get all text content as plain text", color: "bg-teal-500/10 text-teal-500 dark:bg-teal-500/20 dark:text-teal-400", href: "/extract-text", minPlan: "pro" },
      { icon: FileImage, title: "PDF to PNG", description: "Export PDF pages as high-quality PNG", color: "bg-lime-500/10 text-lime-500 dark:bg-lime-500/20 dark:text-lime-400", href: "/pdf-to-png", minPlan: "free" },
      { icon: FileImage, title: "PDF to TIFF", description: "Convert PDF to TIFF for printing", color: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400", href: "/pdf-to-tiff", minPlan: "pro" },
    ]
  },
  {
    name: "Edit PDF",
    tools: [
      { icon: RotateCw, title: "Rotate PDF", description: "Rotate your PDFs the way you need", color: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400", href: "/rotate-pdf" },
      { icon: Hash, title: "Add Page Numbers", description: "Add page numbers into PDFs", color: "bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400", href: "/add-page-numbers", minPlan: "free" },
      { icon: AlignJustify, title: "Header & Footer", description: "Add custom headers and footers to PDF", color: "bg-sky-500/10 text-sky-500 dark:bg-sky-500/20 dark:text-sky-400", href: "/add-header-footer", minPlan: "free" },
      { icon: Stamp, title: "Watermark", description: "Stamp an image or text over your PDF", color: "bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400", href: "/watermark-pdf", minPlan: "free" },
      { icon: Crop, title: "Crop PDF", description: "Crop your PDF margins", color: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400", href: "/crop-pdf", minPlan: "free" },
      { icon: PenTool, title: "Edit PDF", description: "Add text, images, shapes to PDF", color: "bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400", href: "/edit-pdf", minPlan: "pro" },
    ]
  },
  {
    name: "PDF Security",
    tools: [
      { icon: Unlock, title: "Unlock PDF", description: "Remove PDF password security", color: "bg-pink-500/10 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400", href: "/unlock-pdf", minPlan: "free" },
      { icon: Lock, title: "Protect PDF", description: "Encrypt PDF with a password", color: "bg-slate-500/10 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400", href: "/protect-pdf", minPlan: "free" },
      { icon: PenLine, title: "Sign PDF", description: "Sign yourself or request signatures", color: "bg-fuchsia-500/10 text-fuchsia-500 dark:bg-fuchsia-500/20 dark:text-fuchsia-400", href: "/sign-pdf", minPlan: "pro" },
      { icon: EyeOff, title: "Redact PDF", description: "Permanently remove sensitive content", color: "bg-slate-500/10 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400", href: "/redact-pdf", minPlan: "pro" },
      { icon: GitCompare, title: "Compare PDF", description: "Compare two similar PDF files", color: "bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-400", href: "/compare-pdf", minPlan: "pro" },
      { icon: Shield, title: "Encrypt PDF", description: "Protect with AES-256 encryption", color: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400", href: "/encrypt-pdf", minPlan: "pro" },
    ]
  },
  {
    name: "PDF Utilities",
    tools: [
      { icon: FileText, title: "PDF Metadata", description: "View and edit PDF properties", color: "bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-400", href: "/metadata-editor", minPlan: "free" },
      { icon: BookOpen, title: "PDF Bookmarks", description: "Add bookmarks and table of contents", color: "bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400", href: "/bookmarks-editor", minPlan: "pro" },
      { icon: Layers, title: "Batch Process", description: "Apply operations to multiple PDFs", color: "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400", href: "/batch-process", minPlan: "pro" },
      { icon: Edit3, title: "Fill PDF Form", description: "Fill out PDF form fields", color: "bg-teal-500/10 text-teal-500 dark:bg-teal-500/20 dark:text-teal-400", href: "/form-filler", minPlan: "free" },
      { icon: FileText, title: "PDF Templates", description: "Ready-made templates for invoices, resumes & more", color: "bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400", href: "/pdf-templates" },
      { icon: LayoutGrid, title: "Image Collage", description: "Arrange images into PDF with custom layouts", color: "bg-pink-500/10 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400", href: "/image-collage" },
      { icon: PenTool, title: "Annotate PDF", description: "Highlight, draw and add notes to PDFs", color: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400", href: "/annotate-pdf", minPlan: "free" },
    ]
  }
];

export const allTools: Tool[] = toolCategories.flatMap(cat => cat.tools);

const PLAN_HIERARCHY: Record<PlanLevel, number> = {
  anonymous: 0,
  free: 1,
  pro: 2,
};

export function canAccessTool(tool: Tool, userPlan: PlanLevel): boolean {
  const requiredPlan = tool.minPlan || "anonymous";
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

export function getToolAccessLabel(tool: Tool): string | null {
  if (!tool.minPlan || tool.minPlan === "anonymous") return null;
  if (tool.minPlan === "free") return "Free";
  return "Pro";
}

export function getToolByHref(href: string): Tool | undefined {
  return allTools.find(t => t.href === href);
}

const FAVORITES_KEY = "instantpdf_favorites";

function readFavoritesFromStorage(): string[] {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(readFavoritesFromStorage);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) setFavorites(readFavoritesFromStorage());
    };
    const onCustom = () => setFavorites(readFavoritesFromStorage());
    window.addEventListener("storage", onStorage);
    window.addEventListener("favorites-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("favorites-updated", onCustom);
    };
  }, []);

  const toggleFavorite = useCallback((href: string) => {
    const current = readFavoritesFromStorage();
    const updated = current.includes(href)
      ? current.filter(f => f !== href)
      : [...current, href];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    setFavorites(updated);
    window.dispatchEvent(new Event("favorites-updated"));
  }, []);

  const isFavorite = useCallback((href: string) => favorites.includes(href), [favorites]);

  const getFavoriteTools = useCallback(() => {
    return favorites.map(href => getToolByHref(href)).filter(Boolean) as Tool[];
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite, getFavoriteTools };
}

const RECENT_KEY = "instantpdf_recent";
const MAX_RECENT = 8;

export interface RecentEntry {
  href: string;
  timestamp: number;
}

function readRecentFromStorage(): RecentEntry[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function writeRecentToStorage(entries: RecentEntry[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(entries));
}

export function useRecentTools() {
  const [recent, setRecent] = useState<RecentEntry[]>(readRecentFromStorage);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === RECENT_KEY) setRecent(readRecentFromStorage());
    };
    const onCustom = () => setRecent(readRecentFromStorage());
    window.addEventListener("storage", onStorage);
    window.addEventListener("recent-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("recent-updated", onCustom);
    };
  }, []);

  const recordUsage = useCallback((href: string) => {
    const current = readRecentFromStorage();
    const filtered = current.filter(r => r.href !== href);
    const updated = [{ href, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
    writeRecentToStorage(updated);
    setRecent(updated);
    window.dispatchEvent(new Event("recent-updated"));
  }, []);

  const getRecentTools = useCallback(() => {
    const current = readRecentFromStorage();
    return current
      .map(entry => {
        const tool = getToolByHref(entry.href);
        return tool ? { ...tool, lastUsed: entry.timestamp } : null;
      })
      .filter(Boolean) as (Tool & { lastUsed: number })[];
  }, [recent]);

  const clearRecent = useCallback(() => {
    writeRecentToStorage([]);
    setRecent([]);
    window.dispatchEvent(new Event("recent-updated"));
  }, []);

  return { recent, recordUsage, getRecentTools, clearRecent };
}
