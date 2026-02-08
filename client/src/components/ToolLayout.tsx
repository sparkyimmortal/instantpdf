import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ShareButton } from "@/components/ShareButton";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ToolLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  steps?: string[];
  faqs?: { question: string; answer: string }[];
}

export function ToolLayout({ children, title, description, className, steps, faqs }: ToolLayoutProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `${title} - ${description} | InstantPDF - Free online PDF tools`);
    }
    document.title = `${title} | InstantPDF`;
    return () => {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', 'InstantPDF - Fast, private, and free online PDF tools. Merge, split, compress, convert, and edit PDFs instantly.');
      }
      document.title = 'InstantPDF - Free Online PDF Tools';
    };
  }, [title, description]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 bg-muted/30">
        <div className="container px-4 py-8 md:py-12 max-w-5xl mx-auto">
          <div className="mb-8 flex flex-col items-center text-center space-y-4">
            <div className="w-full flex items-center justify-between">
              <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to tools
              </Link>
              <ShareButton title={title} description={description} />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground max-w-2xl text-lg">{description}</p>
          </div>
          
          <div className={cn("bg-card border shadow-sm rounded-xl overflow-hidden min-h-[400px]", className)}>
            {children}
          </div>

          {steps && steps.length > 0 && (
            <div className="mt-12" data-testid="section-how-it-works">
              <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="flex flex-col items-center text-center p-6 bg-card border rounded-xl shadow-sm"
                    data-testid={`step-card-${index}`}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold mb-4">
                      {index + 1}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-2">
                      Step {index + 1}
                    </p>
                    <p className="text-foreground font-medium">{step}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {faqs && faqs.length > 0 && (
            <div className="mt-12" data-testid="section-faq">
              <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
              <div className="max-w-3xl mx-auto space-y-3">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-card border rounded-xl overflow-hidden"
                    data-testid={`faq-item-${index}`}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                      data-testid={`button-faq-toggle-${index}`}
                    >
                      <span className="font-medium text-foreground pr-4">{faq.question}</span>
                      <motion.div
                        animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openFaqIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed border-t bg-muted/20 pt-4">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
