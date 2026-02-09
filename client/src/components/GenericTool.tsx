import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, Download, ArrowRight, Loader2, CheckCircle2, RefreshCw, Lock, Crown, Share2, Copy, Check, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { useProcessingHistory } from "@/hooks/use-processing-history";
import { useUsageStats } from "@/hooks/use-usage-stats";
import { hapticFeedback } from "@/hooks/use-haptic";
import { Confetti } from "@/components/Confetti";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PdfPreview } from "@/components/PdfPreview";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getToolByHref, canAccessTool, type PlanLevel } from "@/hooks/use-tools";
import { Link } from "wouter";
import { toolPageData } from "@/lib/toolPageData";

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

const FRIENDLY_ERRORS: Record<string, string> = {
  "Failed to fetch": "Connection lost. Check your internet and try again.",
  "daily_limit_exceeded": "You've reached today's free limit. Sign up for more!",
  "file_too_large": "This file is too large. Try compressing it first or upgrade your plan.",
  "page_limit_exceeded": "Too many pages for a free account. Try splitting the file first.",
  "NetworkError": "Network error. Check your connection and try again.",
  "timeout": "The operation took too long. Try with a smaller file.",
};

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  for (const [key, friendly] of Object.entries(FRIENDLY_ERRORS)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return friendly;
  }
  if (msg.includes("401") || msg.includes("Unauthorized")) {
    return "Please log in to continue using this tool.";
  }
  if (msg.includes("413")) {
    return "File is too large. Try a smaller file or compress it first.";
  }
  if (msg.includes("500") || msg.includes("Internal")) {
    return "Something went wrong on our end. Please try again in a moment.";
  }
  return msg || "Something went wrong. Please try again.";
}

function sendNotification(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

async function requestNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

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

const MAX_RETRIES = 3;
function getRetryDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 16000);
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryingIn, setRetryingIn] = useState<number | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const { addToHistory } = useProcessingHistory();
  const { recordOperation } = useUsageStats();
  const { t } = useLanguage();

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    hapticFeedback("medium");
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

  const doProcess = async (retry = 0): Promise<void> => {
    const targetFile = multiFile ? files[0] : file;
    if (!targetFile && !multiFile) return;
    if (multiFile && files.length === 0) return;

    if (requiresPassword && !password) {
      hapticFeedback("error");
      toast({
        title: "Password required",
        description: "Please enter a password.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setRetryCount(retry);
    setRetryingIn(null);

    if (retry === 0) {
      requestNotificationPermission();
    }

    const totalSize = multiFile ? files.reduce((a, f) => a + f.size, 0) : (file?.size || 0);
    const fileCount = multiFile ? files.length : 1;

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
      setShowConfetti(true);
      hapticFeedback("success");

      addToHistory({
        fileName: multiFile ? `${files.length} files` : (file?.name || "unknown"),
        toolId: id,
        toolName: title,
        operation: processLabel,
        fileSize: totalSize,
        status: "success",
      });

      recordOperation({
        toolId: id,
        fileCount,
        totalSize,
        success: true,
      });

      sendNotification("InstantPDF", `${title} completed successfully!`);

      toast({
        title: "Success!",
        description: successMessage,
      });
    } catch (err) {
      console.error(err);

      const isNetworkError = err instanceof TypeError ||
        (err instanceof Error && (
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("network")
        ));

      if (isNetworkError && retry < MAX_RETRIES) {
        const delay = getRetryDelay(retry);
        setRetryingIn(Math.ceil(delay / 1000));
        toast({
          title: "Connection issue",
          description: `Retrying in ${Math.ceil(delay / 1000)} seconds... (attempt ${retry + 2}/${MAX_RETRIES + 1})`,
        });

        const countdown = setInterval(() => {
          setRetryingIn((prev) => (prev && prev > 1 ? prev - 1 : null));
        }, 1000);

        retryTimerRef.current = setTimeout(() => {
          clearInterval(countdown);
          doProcess(retry + 1);
        }, delay);
        return;
      }

      hapticFeedback("error");

      addToHistory({
        fileName: multiFile ? `${files.length} files` : (file?.name || "unknown"),
        toolId: id,
        toolName: title,
        operation: processLabel,
        fileSize: totalSize,
        status: "failed",
      });

      recordOperation({
        toolId: id,
        fileCount,
        totalSize,
        success: false,
      });

      sendNotification("InstantPDF", `${title} failed. Please try again.`);

      setIsProcessing(false);
      setProgress(0);
      setRetryCount(0);
      setRetryingIn(null);
      toast({
        title: "Something went wrong",
        description: friendlyError(err),
        variant: "destructive"
      });
    }
  };

  const handleProcess = () => doProcess(0);

  const handleDownload = async () => {
    if (downloadUrl) {
      hapticFeedback("medium");
      try {
        await downloadPdfFile(downloadUrl);
      } catch (err) {
        hapticFeedback("error");
        toast({
          title: "Download failed",
          description: friendlyError(err),
          variant: "destructive"
        });
      }
    }
  };

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = async () => {
    if (!downloadUrl) return;
    setShareLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          downloadUrl,
          filename: file?.name || files[0]?.name || "processed.pdf",
        }),
      });
      if (!res.ok) throw new Error("Failed to create share link");
      const data = await res.json();
      setShareUrl(data.shareUrl);
    } catch {
      toast({ title: "Share failed", description: "Could not create share link.", variant: "destructive" });
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setFiles([]);
    setIsComplete(false);
    setProgress(0);
    setDownloadUrl(null);
    setPassword("");
    setText("");
    setShowConfetti(false);
    setRetryCount(0);
    setRetryingIn(null);
    setShareUrl(null);
    setShareLoading(false);
    setLinkCopied(false);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  };

  const hasFile = multiFile ? files.length > 0 : file !== null;

  const { user } = useAuth();
  const userPlan: PlanLevel = user?.plan === "pro" ? "pro" : user ? "free" : "anonymous";
  const toolDef = getToolByHref(`/${id}`);
  const hasToolAccess = toolDef ? canAccessTool(toolDef, userPlan) : true;
  const requiredPlan = toolDef?.minPlan || "anonymous";

  const pageData = toolPageData[id];
  const pageSteps = pageData?.steps;
  const pageFaqs = pageData?.faqs;

  if (!hasToolAccess) {
    const isPro = requiredPlan === "pro";
    return (
      <ToolLayout title={title} description={description} steps={pageSteps} faqs={pageFaqs}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className={cn(
              "h-20 w-20 sm:h-24 sm:w-24 rounded-full flex items-center justify-center",
              isPro
                ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500"
                : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-500"
            )}
          >
            {isPro ? <Crown className="h-10 w-10 sm:h-12 sm:w-12" /> : <Lock className="h-10 w-10 sm:h-12 sm:w-12" />}
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold">
              {isPro ? "Pro Feature" : "Free Account Required"}
            </h2>
            <p className="text-muted-foreground max-w-md text-sm sm:text-base">
              {isPro
                ? `${title} is available exclusively for Pro users. Upgrade to unlock unlimited access to all advanced tools.`
                : `${title} requires a free account. Sign up in seconds to access this and many more tools.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {!user ? (
              <>
                <Link href="/login">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white" data-testid="button-login-gate">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" data-testid="button-signup-gate">
                    Create Free Account
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/profile">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white" data-testid="button-upgrade-gate">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  if (isComplete) {
    return (
      <ToolLayout title={title} description={description} steps={pageSteps} faqs={pageFaqs}>
        <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="flex flex-col items-center justify-center p-12 text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, damping: 12 }}
            className={cn("h-24 w-24 rounded-full flex items-center justify-center mb-4 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400")}
          >
            <CheckCircle2 className="h-12 w-12" />
          </motion.div>
          <h2 className="text-2xl font-bold">{t("tool.ready")}</h2>
          <p className="text-muted-foreground max-w-md">
            {successMessage}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4"
          >
            <Button size="lg" className={buttonClass} onClick={handleDownload} data-testid="button-download">
              <Download className="mr-2 h-4 w-4" />
              {downloadLabel}
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset} data-testid="button-process-another">
              {t("tool.processAnother")}
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4"
          >
            {!shareUrl ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                disabled={shareLoading}
                data-testid="button-share"
              >
                {shareLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                {t("tool.shareLink")}
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="text-xs bg-transparent flex-1 outline-none min-w-0"
                  data-testid="input-share-url"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  data-testid="button-copy-link"
                >
                  {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title={title} description={description} steps={pageSteps} faqs={pageFaqs}>
      {!hasFile ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            {...getRootProps()}
            className={cn(
              "h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer group active:scale-[0.98]",
              isDragActive 
                ? "border-primary bg-primary/5 scale-[0.99]" 
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
            )}
            data-testid="dropzone"
          >
            <input {...getInputProps()} data-testid="input-file" />
            <motion.div
              className={cn("p-6 rounded-full mb-6 transition-transform group-hover:scale-110 duration-300", colorClass.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 '))}
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={cn("h-12 w-12", colorClass.split(' ')[0])} />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">{t("tool.selectFile")}</h3>
            <p className="text-muted-foreground mb-6">{t("tool.dropFile")}</p>
            <Button size="lg" className={buttonClass} data-testid="button-select-file">{t("tool.selectFile")}</Button>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-muted/30 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r"
          >
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
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="relative aspect-[3/4] w-56 bg-white dark:bg-muted shadow-xl rounded-sm border p-6 flex flex-col items-center justify-center mb-6"
              >
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
              </motion.div>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
              Remove file{multiFile && files.length > 1 ? 's' : ''}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 p-8 flex flex-col items-center justify-center"
          >
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
                <div className="space-y-5">
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className={cn("h-14 w-14 rounded-full flex items-center justify-center", colorClass.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 '))}
                    >
                      <Icon className={cn("h-7 w-7", colorClass.split(' ')[0])} />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-1">
                      {retryingIn !== null
                        ? `Retrying in ${retryingIn}s...`
                        : retryCount > 0
                        ? `Processing (attempt ${retryCount + 1})`
                        : "Processing"}
                      {retryingIn === null && (
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          ...
                        </motion.span>
                      )}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      style={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  {retryingIn !== null && (
                    <p className="text-xs text-muted-foreground text-center">
                      Connection issue detected. Auto-retrying...
                    </p>
                  )}
                </div>
              ) : (
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button 
                    size="lg" 
                    className={cn("w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5", buttonClass)}
                    onClick={() => {
                      hapticFeedback("medium");
                      handleProcess();
                    }}
                    data-testid="button-process"
                  >
                    {processLabel}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </ToolLayout>
  );
}
