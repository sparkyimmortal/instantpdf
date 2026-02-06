import { Unlock } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function UnlockPdf() {
  return (
    <GenericTool
      id="unlock-pdf"
      title="Unlock PDF"
      description="Remove PDF password security, giving you the freedom to use your PDFs as you want."
      icon={Unlock}
      colorClass="text-pink-600 bg-pink-50"
      buttonClass="bg-pink-600 hover:bg-pink-700"
      processLabel="Unlock PDF"
      downloadLabel="Download Unlocked PDF"
      successMessage="Password protection has been removed from your PDF."
      requiresPassword={true}
    />
  );
}
