import { Image } from "lucide-react";
import { GenericTool } from "@/components/GenericTool";

export default function PdfToJpg() {
  return (
    <GenericTool
      id="pdf-to-jpg"
      title="PDF to JPG"
      description="Convert each PDF page into a JPG or extract all images contained in a PDF."
      icon={Image}
      colorClass="text-yellow-600 bg-yellow-50"
      buttonClass="bg-yellow-600 hover:bg-yellow-700"
      processLabel="Convert to JPG"
      downloadLabel="Download JPG Images"
      successMessage="PDF converted to JPG images successfully."
      showPreview={true}
    />
  );
}