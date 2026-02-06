import { FileCode } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function WordToPdf() {
  return (
    <GenericTool
      id="word-to-pdf"
      title="Word to PDF"
      description="Make DOC and DOCX files easy to read by converting them to PDF."
      icon={FileCode}
      colorClass="text-blue-600 bg-blue-50"
      buttonClass="bg-blue-600 hover:bg-blue-700"
      processLabel="Convert to PDF"
      downloadLabel="Download PDF"
      successMessage="Your Word document has been converted to PDF."
      accept={{
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
      }}
    />
  );
}