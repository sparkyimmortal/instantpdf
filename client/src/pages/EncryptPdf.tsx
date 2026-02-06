import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Shield, Upload, FileText, Loader2, Check, Download } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";
import download from "downloadjs";

export default function EncryptPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [permissions, setPermissions] = useState({
    print: false,
    copy: false,
    modify: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setIsComplete(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleEncrypt = async () => {
    if (!file) return;

    if (!password) {
      toast({ title: "Error", description: "Please enter a password.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);

      const enabledPermissions = Object.entries(permissions)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);
      if (enabledPermissions.length > 0) {
        formData.append("permissions", enabledPermissions.join(","));
      }

      const response = await pdfFetch("/api/pdf/encrypt-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(formatPdfError(errorData));
      }

      const data = await response.json();

      const dlResponse = await pdfFetch(data.downloadUrl);
      if (!dlResponse.ok) throw new Error("Failed to download encrypted PDF");

      const blob = await dlResponse.blob();
      const filename = data.downloadUrl.split("/").pop() || "encrypted.pdf";
      download(blob, filename, "application/pdf");

      setIsComplete(true);
      toast({ title: "Success!", description: "Your PDF has been encrypted." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to encrypt PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword("");
    setConfirmPassword("");
    setPermissions({ print: false, copy: false, modify: false });
    setIsComplete(false);
  };

  if (isComplete) {
    return (
      <ToolLayout title="Encrypt PDF" description="Protect your PDF with AES-256 encryption">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4" data-testid="text-success">PDF encrypted successfully!</h2>
          <p className="text-muted-foreground mb-8">Your PDF is now protected with AES-256 encryption.</p>
          <Button variant="outline" onClick={handleReset} data-testid="button-encrypt-another">
            Encrypt Another PDF
          </Button>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="Encrypt PDF" description="Protect your PDF with AES-256 encryption">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {!file ? (
          <div className="p-8">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors",
                isDragActive ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:border-emerald-500/50"
              )}
              data-testid="dropzone-encrypt"
            >
              <input {...getInputProps()} data-testid="input-file-encrypt" />
              <Upload className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
              <p className="text-xl font-medium text-foreground mb-2">Select PDF file</p>
              <p className="text-muted-foreground mb-6">or drop PDF here</p>
              <Button className="bg-emerald-500 hover:bg-emerald-600 border-0" data-testid="button-select-file">
                Select PDF file
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8 p-4 bg-muted/50 rounded-lg">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" data-testid="text-filename">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isProcessing} data-testid="button-remove-file">
                Change
              </Button>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-semibold">Encryption Settings</h3>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium mb-2 block">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  data-testid="input-password"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-sm font-medium mb-2 block">Confirm Password *</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  data-testid="input-confirm-password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Permissions (optional)</Label>
                <div className="space-y-3">
                  {([
                    { key: "print" as const, label: "Allow Print" },
                    { key: "copy" as const, label: "Allow Copy" },
                    { key: "modify" as const, label: "Allow Modify" },
                  ]).map(({ key, label }) => (
                    <label
                      key={key}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                        permissions[key] ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:border-emerald-500/50"
                      )}
                      data-testid={`checkbox-label-${key}`}
                    >
                      <input
                        type="checkbox"
                        checked={permissions[key]}
                        onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                        className="h-4 w-4 accent-emerald-500"
                        data-testid={`checkbox-${key}`}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleEncrypt}
                disabled={isProcessing || !password || password !== confirmPassword}
                className="w-full bg-emerald-500 hover:bg-emerald-600 border-0"
                size="lg"
                data-testid="button-encrypt"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Encrypt & Download
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </ToolLayout>
  );
}
