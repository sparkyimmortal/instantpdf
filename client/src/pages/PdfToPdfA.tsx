import { FileArchive } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function PdfToPdfA() {
  return (
    <GenericTool
      id="pdf-to-pdfa"
      title="PDF to PDF/A"
      description="Convert PDF documents to PDF/A for ISO-standardized long-term archiving."
      icon={FileArchive}
      colorClass="text-brown-600 bg-stone-50"
      buttonClass="bg-stone-600 hover:bg-stone-700"
      processLabel="Convert to PDF/A"
      downloadLabel="Download PDF/A"
      successMessage="Your PDF has been converted to PDF/A standard."
    />
  );
}