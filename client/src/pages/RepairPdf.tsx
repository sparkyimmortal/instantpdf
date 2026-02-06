import { Wrench } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function RepairPdf() {
  return (
    <GenericTool
      id="repair-pdf"
      title="Repair PDF"
      description="Recover data from a corrupted or damaged PDF document."
      icon={Wrench}
      colorClass="text-muted-foreground bg-muted/30"
      buttonClass="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0"
      processLabel="Repair PDF"
      downloadLabel="Download Repaired PDF"
      successMessage="Your PDF has been repaired successfully."
      showPreview={true}
    />
  );
}
