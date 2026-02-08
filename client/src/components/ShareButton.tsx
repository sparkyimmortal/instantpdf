import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  title: string;
  description: string;
  className?: string;
}

export function ShareButton({ title, description, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `InstantPDF - ${title}`,
          text: description,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          fallbackCopy(url);
        }
      }
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Tool link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy the URL from the address bar.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={className}
      data-testid="button-share"
    >
      {copied ? (
        <Check className="h-4 w-4 mr-2 text-green-500" />
      ) : (
        <Share2 className="h-4 w-4 mr-2" />
      )}
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
