import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ToolLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function ToolLayout({ children, title, description, className }: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 bg-muted/30">
        <div className="container px-4 py-8 md:py-12 max-w-5xl mx-auto">
          <div className="mb-8 flex flex-col items-center text-center space-y-4">
            <Link href="/" className="self-start md:absolute md:left-8 md:top-24 flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to tools
            </Link>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground max-w-2xl text-lg">{description}</p>
          </div>
          
          <div className={cn("bg-card border shadow-sm rounded-xl overflow-hidden min-h-[400px]", className)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}