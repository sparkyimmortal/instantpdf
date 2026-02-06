import { ArrowRightLeft } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function PowerpointToPdf() {
  return (
    <GenericTool
      id="powerpoint-to-pdf"
      title="PowerPoint to PDF"
      description="Make PPT and PPTX slideshows easy to view by converting them to PDF."
      icon={ArrowRightLeft}
      colorClass="text-orange-600 bg-orange-50"
      buttonClass="bg-orange-600 hover:bg-orange-700"
      processLabel="Convert to PDF"
      downloadLabel="Download PDF"
      successMessage="Your presentation has been converted to PDF."
      accept={{
        'application/vnd.ms-powerpoint': ['.ppt'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
      }}
    />
  );
}