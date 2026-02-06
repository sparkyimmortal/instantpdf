import { Image } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function PdfToExcel() {
  return (
    <GenericTool
      id="pdf-to-excel"
      title="PDF to Excel"
      description="Pull data straight from PDFs into Excel spreadsheets in a few seconds."
      icon={Image}
      colorClass="text-green-600 bg-green-50"
      buttonClass="bg-green-600 hover:bg-green-700"
      processLabel="Convert to Excel"
      downloadLabel="Download EXCEL"
      successMessage="Your PDF data has been extracted to an Excel spreadsheet."
      showPreview={true}
    />
  );
}