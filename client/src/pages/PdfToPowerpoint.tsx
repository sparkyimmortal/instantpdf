import { FileText } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function PdfToPowerpoint() {
  return (
    <GenericTool
      id="pdf-to-powerpoint"
      title="PDF to PowerPoint"
      description="Turn your PDF files into easy to edit PPT and PPTX slideshows."
      icon={FileText}
      colorClass="text-orange-600 bg-orange-50"
      buttonClass="bg-orange-600 hover:bg-orange-700"
      processLabel="Convert to PPT"
      downloadLabel="Download POWERPOINT"
      successMessage="Your PDF has been converted to a PowerPoint presentation."
    />
  );
}