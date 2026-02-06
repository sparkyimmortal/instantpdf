import { Lock } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function ProtectPdf() {
  return (
    <GenericTool
      id="protect-pdf"
      title="Protect PDF"
      description="Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access."
      icon={Lock}
      colorClass="text-slate-600 bg-slate-50"
      buttonClass="bg-slate-800 hover:bg-slate-900"
      processLabel="Protect PDF"
      downloadLabel="Download Protected PDF"
      successMessage="Your PDF is now password protected."
      requiresPassword={true}
      showPreview={true}
    />
  );
}
