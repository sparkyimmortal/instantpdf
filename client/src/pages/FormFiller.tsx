import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Edit3, Upload, Download, Loader2, Trash2, FileText } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pdfFetch, formatPdfError, downloadPdfFile } from "@/lib/pdfApi";

interface FormField {
  name: string;
  value: string;
  type?: string;
}

export default function FormFiller() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setIsComplete(false);
      setDownloadUrl(null);
      setFields([]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  useEffect(() => {
    if (!file) {
      setFields([]);
      return;
    }

    async function readFields() {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file!);
        formData.append("action", "read");

        const response = await pdfFetch("/api/pdf/form-fill", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(formatPdfError(errorData));
        }

        const data = await response.json();
        const detectedFields: FormField[] = (data.fields || []).map((f: any) => ({
          name: f.name || f.fieldName || "",
          value: f.value || "",
          type: f.type || "text",
        }));
        setFields(detectedFields);

        if (detectedFields.length === 0) {
          toast({
            title: "No form fields found",
            description: "This PDF does not contain any fillable form fields.",
          });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to read form fields",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    readFields();
  }, [file, toast]);

  const updateFieldValue = (index: number, value: string) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], value };
    setFields(updated);
  };

  const handleFill = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "fill");

      const fieldsObj: Record<string, string> = {};
      fields.forEach((f) => {
        fieldsObj[f.name] = f.value;
      });
      formData.append("fields", JSON.stringify(fieldsObj));

      const response = await pdfFetch("/api/pdf/form-fill", {
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
      toast({ title: "Success!", description: "Form has been filled successfully." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to fill form",
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
    setFields([]);
    setIsComplete(false);
    setDownloadUrl(null);
  };

  if (isComplete) {
    return (
      <ToolLayout
        title="Fill PDF Form"
        description="Fill out PDF form fields and download the completed document"
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-400 mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Your PDF is ready!</h2>
          <p className="text-muted-foreground mb-8">Form fields have been filled.</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 border-0 h-12 px-8"
              data-testid="button-download"
            >
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="button-another">
              Process Another
            </Button>
          </div>
        </motion.div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout
      title="Fill PDF Form"
      description="Fill out PDF form fields and download the completed document"
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {!file ? (
          <div className="p-8">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors",
                isDragActive ? "border-teal-500 bg-teal-500/10" : "border-border hover:border-teal-500/50"
              )}
              data-testid="dropzone"
            >
              <input {...getInputProps()} data-testid="input-file" />
              <Upload className="w-16 h-16 mx-auto mb-4 text-teal-500" />
              <p className="text-xl font-medium text-foreground mb-2">Select PDF file</p>
              <p className="text-muted-foreground mb-6">or drop PDF here</p>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 border-0" data-testid="button-select-file">
                Select PDF file
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <FileText className="w-4 h-4" />
              <span className="font-medium" data-testid="text-filename">{file.name}</span>
              <button onClick={handleReset} className="ml-2 text-muted-foreground hover:text-destructive" data-testid="button-remove-file">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Reading form fields...</span>
              </div>
            ) : fields.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" data-testid="text-fields-header">
                  Form Fields ({fields.length} detected)
                </h3>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {fields.map((field, index) => (
                    <div
                      key={index}
                      className="p-4 border border-border rounded-lg bg-muted/20"
                      data-testid={`field-row-${index}`}
                    >
                      <Label className="text-sm font-medium mb-2 block" data-testid={`label-field-${index}`}>
                        {field.name}
                      </Label>
                      <Input
                        value={field.value}
                        onChange={(e) => updateFieldValue(index, e.target.value)}
                        placeholder={`Enter value for ${field.name}`}
                        data-testid={`input-field-${index}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    onClick={handleFill}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 border-0 h-12 px-8"
                    data-testid="button-fill"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Filling...
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Fill & Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Edit3 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">No form fields detected</p>
                <p className="text-muted-foreground">This PDF does not contain any fillable form fields.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </ToolLayout>
  );
}
