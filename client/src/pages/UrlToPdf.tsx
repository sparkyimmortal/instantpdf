import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Globe, Loader2, Check, Download, Link as LinkIcon } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";
import download from "downloadjs";

export default function UrlToPdf() {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const isValidUrl = url.startsWith("http://") || url.startsWith("https://");

  const handleConvert = async () => {
    if (!isValidUrl) {
      toast({ title: "Error", description: "Please enter a valid URL starting with http:// or https://", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("url", url);

      const response = await pdfFetch("/api/pdf/url-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const data = await response.json();

      const dlResponse = await pdfFetch(data.downloadUrl);
      if (!dlResponse.ok) throw new Error("Failed to download PDF");

      const blob = await dlResponse.blob();
      const filename = data.downloadUrl.split("/").pop() || "webpage.pdf";
      download(blob, filename, "application/pdf");

      setIsComplete(true);
      toast({ title: "Success!", description: "Webpage converted to PDF." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to convert URL",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setIsComplete(false);
  };

  if (isComplete) {
    return (
      <ToolLayout title="URL to PDF" description="Convert any webpage to a PDF document">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4" data-testid="text-success">PDF created successfully!</h2>
          <p className="text-muted-foreground mb-8">The webpage has been converted to PDF.</p>
          <Button variant="outline" onClick={handleReset} data-testid="button-convert-another">
            Convert Another URL
          </Button>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="URL to PDF" description="Convert any webpage to a PDF document">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-8">
          <div className="max-w-lg mx-auto space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
                <Globe className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground">
                Enter the URL of any public webpage to convert it to a PDF document.
              </p>
            </div>

            <div>
              <Label htmlFor="url-input" className="text-sm font-medium mb-2 block">Webpage URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="url-input"
                  type="url"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setIsComplete(false); }}
                  placeholder="https://example.com"
                  className="pl-10"
                  data-testid="input-url"
                />
              </div>
              {url && !isValidUrl && (
                <p className="text-sm text-red-500 mt-2" data-testid="text-url-error">
                  URL must start with http:// or https://
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2 text-sm">Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  Works with any public webpage
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  Captures full page content including images
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  Preserves layout and styling
                </li>
              </ul>
            </div>

            <Button
              onClick={handleConvert}
              disabled={isProcessing || !isValidUrl}
              className="w-full bg-blue-500 hover:bg-blue-600 border-0"
              size="lg"
              data-testid="button-convert"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Convert to PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </ToolLayout>
  );
}
