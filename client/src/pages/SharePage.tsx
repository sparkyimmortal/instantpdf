import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Clock, FileText, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShareInfo {
  filename: string;
  fileSize: number;
  expiresAt: string;
  createdAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { t } = useLanguage();
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${token}/info`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Share link not found");
        }
        return res.json();
      })
      .then((data) => setInfo(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = () => {
    window.location.href = `/api/share/${token}/download`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-xl mx-auto px-4 py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-4" />
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2" data-testid="text-share-error-title">
                {error.includes("expired") ? t("share.expired") : t("share.notFound")}
              </h2>
              <p className="text-muted-foreground text-sm" data-testid="text-share-error-message">
                {error.includes("expired") ? t("share.expiredMessage") : error}
              </p>
            </Card>
          </motion.div>
        ) : info ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8">
              <div className="text-center mb-6">
                <div className="h-16 w-16 mx-auto rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-cyan-500" />
                </div>
                <h2 className="text-xl font-bold" data-testid="text-share-title">{t("share.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("share.subtitle")}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">File</span>
                  <span className="text-sm font-medium truncate max-w-[200px]" data-testid="text-share-filename">
                    {info.filename}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Size</span>
                  <span className="text-sm font-medium" data-testid="text-share-size">
                    {formatFileSize(info.fileSize)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("share.expiresIn")}</span>
                  <span className="text-sm font-medium flex items-center gap-1" data-testid="text-share-expires">
                    <Clock className="h-3 w-3" />
                    {formatTimeRemaining(info.expiresAt)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                onClick={handleDownload}
                data-testid="button-share-download"
              >
                <Download className="mr-2 h-4 w-4" />
                {t("share.download")}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                {t("share.poweredBy")}
              </p>
            </Card>
          </motion.div>
        ) : null}
      </main>
    </div>
  );
}
