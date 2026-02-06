import { FileType } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function PdfToWord() {
  return (
    <GenericTool
      id="pdf-to-word"
      title="PDF to Word"
      description="Convert your PDF to WORD documents with incredible accuracy."
      icon={FileType}
      colorClass="text-blue-600 bg-blue-50"
      buttonClass="bg-blue-600 hover:bg-blue-700"
      processLabel="Convert to Word"
      downloadLabel="Download WORD"
      successMessage="Your PDF has been converted to an editable Word document."
      showPreview={true}
    />
  );
}