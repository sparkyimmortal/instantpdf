import { Globe } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function HtmlToPdf() {
  return (
    <GenericTool
      id="html-to-pdf"
      title="HTML to PDF"
      description="Convert webpages or HTML files to PDF."
      icon={Globe}
      colorClass="text-cyan-600 bg-cyan-50"
      buttonClass="bg-cyan-600 hover:bg-cyan-700"
      processLabel="Convert to PDF"
      downloadLabel="Download PDF"
      successMessage="HTML converted to PDF successfully."
      accept={{ 'text/html': ['.html', '.htm'] }}
    />
  );
}