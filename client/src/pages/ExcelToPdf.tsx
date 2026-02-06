import { FileSpreadsheet } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function ExcelToPdf() {
  return (
    <GenericTool
      id="excel-to-pdf"
      title="Excel to PDF"
      description="Make EXCEL spreadsheets easy to read by converting them to PDF."
      icon={FileSpreadsheet}
      colorClass="text-green-600 bg-green-50"
      buttonClass="bg-green-600 hover:bg-green-700"
      processLabel="Convert to PDF"
      downloadLabel="Download PDF"
      successMessage="Your Excel file has been converted to PDF."
      accept={{
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
      }}
    />
  );
}