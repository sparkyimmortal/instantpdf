import { ScanText } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function OcrPdf() {
  return (
    <GenericTool
      id="ocr-pdf"
      title="OCR PDF"
      description="Convert scanned PDF files to searchable and selectable text."
      icon={ScanText}
      colorClass="text-teal-600 bg-teal-50"
      buttonClass="bg-teal-600 hover:bg-teal-700"
      processLabel="Recognize Text"
      downloadLabel="Download OCR PDF"
      successMessage="Text recognition completed successfully."
      showPreview={true}
    />
  );
}