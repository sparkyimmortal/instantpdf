import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string[];
  category: "Tips" | "Tutorial" | "How-To" | "Best Practices";
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "reduce-pdf-size",
    title: "How to Reduce PDF File Size Without Losing Quality",
    excerpt: "Learn proven techniques to compress your PDFs while maintaining visual fidelity and text clarity.",
    content: [
      "Large PDF files can be a headache when sharing via email or uploading to websites with file size limits. The good news is that you can significantly reduce file size without noticeable quality loss. Start by examining what's making your PDF large — embedded fonts, high-resolution images, and redundant metadata are the usual culprits.",
      "One of the most effective strategies is to downsample images within the PDF. Most documents don't need 300 DPI images for on-screen viewing; 150 DPI is typically sufficient and can cut file size by 50% or more. Tools like InstantPDF's compression feature let you choose between different quality levels, so you can find the perfect balance between size and clarity.",
      "Beyond image optimization, consider removing unused fonts, flattening form fields you no longer need to edit, and stripping out hidden layers or annotations. For documents that will only be viewed digitally, converting to PDF/A format with web-optimized settings can also yield impressive size reductions while ensuring long-term compatibility."
    ],
    category: "Tips",
    readTime: "3 min",
  },
  {
    id: "merging-pdfs-guide",
    title: "The Complete Guide to Merging PDFs",
    excerpt: "Everything you need to know about combining multiple PDF files into a single, organized document.",
    content: [
      "Merging PDFs is one of the most common document tasks, whether you're combining invoices, assembling a report from multiple sections, or creating a single portfolio from separate files. The process should be straightforward, but there are important considerations to keep in mind for the best results.",
      "Before merging, organize your source files in the correct order. Most PDF merge tools process files in the order you add them, so arranging them beforehand saves time. Pay attention to page orientation and size — mixing letter and A4 pages in a single document can cause formatting issues. If your source files have different page sizes, consider standardizing them first.",
      "After merging, take advantage of bookmarks and a table of contents to make your combined document navigable. Adding page numbers to the merged file helps readers reference specific sections. If the merged file is too large, run it through a compression tool afterward. For recurring merge tasks, consider using batch processing to automate the workflow and save time."
    ],
    category: "Tutorial",
    readTime: "4 min",
  },
  {
    id: "pdf-security",
    title: "PDF Security: Protecting Your Documents",
    excerpt: "Best practices for securing sensitive PDF documents with passwords, encryption, and permissions.",
    content: [
      "PDF security is critical for anyone handling sensitive information — contracts, financial records, medical documents, or proprietary business data. PDFs support two levels of password protection: a user password that prevents opening the document, and an owner password that restricts actions like printing, copying text, or editing.",
      "Encryption strength matters significantly. Modern PDFs support 256-bit AES encryption, which is virtually unbreakable with current technology. Always choose the highest encryption level available. Avoid using simple or commonly guessed passwords; instead, use a combination of uppercase and lowercase letters, numbers, and special characters with at least 12 characters.",
      "Beyond passwords, consider using digital signatures to verify document authenticity and detect tampering. Redaction tools permanently remove sensitive information — unlike black highlight boxes, which can sometimes be removed to reveal hidden text. For maximum security, disable JavaScript in your PDFs, remove metadata that might reveal author information, and restrict permissions to prevent unauthorized modifications."
    ],
    category: "Best Practices",
    readTime: "5 min",
  },
  {
    id: "pdf-to-word-conversion",
    title: "Converting PDFs to Word: What You Need to Know",
    excerpt: "Tips for getting the best results when converting PDF documents to editable Word format.",
    content: [
      "Converting PDFs to Word documents is essential when you need to edit content that was originally shared as a read-only PDF. However, the conversion quality depends heavily on how the original PDF was created. PDFs made from digital documents (like Word or Google Docs exports) convert much more accurately than scanned paper documents.",
      "For scanned PDFs, you'll need OCR (Optical Character Recognition) technology to extract text before conversion. The accuracy of OCR depends on scan quality — higher resolution scans with good contrast produce better results. After OCR processing, always proofread the converted text, as characters like 'l' and '1' or 'O' and '0' are commonly confused.",
      "To get the best conversion results, use a tool that preserves formatting elements like tables, headers, bullet points, and images. Keep in mind that complex layouts with multiple columns, text boxes, or intricate formatting may not convert perfectly. In these cases, it's often more efficient to convert the basic text and then reformat in Word rather than trying to achieve a pixel-perfect conversion."
    ],
    category: "How-To",
    readTime: "3 min",
  },
  {
    id: "ocr-technology",
    title: "OCR Technology: Making Scanned PDFs Searchable",
    excerpt: "Understand how OCR works and how to get the best results from scanned document recognition.",
    content: [
      "Optical Character Recognition (OCR) transforms scanned images of text into actual searchable, selectable, and editable text. This technology is invaluable for digitizing paper archives, making scanned contracts searchable, or extracting data from printed forms. Modern OCR engines use machine learning to achieve accuracy rates above 99% for clean, well-formatted documents.",
      "The quality of your OCR results depends largely on the input. Scan documents at 300 DPI or higher for best results. Ensure pages are straight and well-lit — skewed or shadowed scans significantly reduce accuracy. If working with older or degraded documents, preprocessing steps like deskewing, despeckling, and contrast enhancement can dramatically improve recognition quality.",
      "After running OCR, the resulting PDF contains an invisible text layer behind the original scanned image, giving you the best of both worlds: the original visual appearance with full text searchability. This means you can search for specific words, copy text passages, and even index the document for full-text search systems. For multi-language documents, make sure your OCR tool supports all the languages present in the text."
    ],
    category: "Tutorial",
    readTime: "4 min",
  },
  {
    id: "pdf-business-tips",
    title: "Top 10 PDF Tips for Business Professionals",
    excerpt: "Essential PDF tricks every business professional should know to boost productivity.",
    content: [
      "PDFs are the backbone of business communication, from proposals and contracts to reports and invoices. Mastering PDF workflows can save hours each week. Start with keyboard shortcuts: Ctrl+F to search, Ctrl+D for document properties, and Ctrl+Shift+S for save-as. Use bookmarks and hyperlinks within longer documents to create easy navigation for your readers.",
      "Batch processing is a game-changer for repetitive tasks. Instead of compressing, watermarking, or converting files one at a time, use batch tools to process dozens of files simultaneously. Set up templates for commonly created documents like invoices or reports with pre-configured headers, footers, and page numbers to maintain brand consistency.",
      "For collaboration, use annotation and commenting features instead of printing and marking up physical copies. Digital signatures eliminate the need for printing, signing, and scanning — they're legally binding and far more efficient. Finally, establish a consistent file naming convention (e.g., YYYY-MM-DD_ProjectName_Version) and use PDF metadata fields to make documents easier to organize and retrieve later."
    ],
    category: "Tips",
    readTime: "5 min",
  },
];

const categoryColors: Record<string, string> = {
  "Tips": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  "Tutorial": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "How-To": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "Best Practices": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
};

function BlogCard({ post, index }: { post: BlogPost; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      data-testid={`card-blog-${post.id}`}
    >
      <Card className="p-6 h-full flex flex-col hover:border-cyan-500/30 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <Badge
            variant="outline"
            className={categoryColors[post.category]}
            data-testid={`badge-category-${post.id}`}
          >
            {post.category}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-readtime-${post.id}`}>
            <Clock className="h-3 w-3" />
            {post.readTime} read
          </span>
        </div>

        <h3 className="text-lg font-semibold mb-2" data-testid={`text-title-${post.id}`}>
          {post.title}
        </h3>

        <p className="text-sm text-muted-foreground mb-4 flex-1" data-testid={`text-excerpt-${post.id}`}>
          {post.excerpt}
        </p>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
              data-testid={`content-expanded-${post.id}`}
            >
              <div className="space-y-3 mb-4 pt-4 border-t border-border/50">
                {post.content.map((paragraph, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full justify-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
          data-testid={`button-readmore-${post.id}`}
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Read More <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </Card>
    </motion.div>
  );
}

export default function Blog() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="py-16 sm:py-24 text-center"
          data-testid="section-blog-hero"
        >
          <div className="container px-4 md:px-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 mb-6">
              <BookOpen className="h-8 w-8 text-cyan-500" />
            </div>
            <h1
              className="text-4xl sm:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
              data-testid="text-blog-heading"
            >
              PDF Tips & Tutorials
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-blog-subtitle">
              Expert guides and practical tips to help you work smarter with PDF documents.
            </p>
          </div>
        </motion.section>

        <section className="pb-16 sm:pb-24" data-testid="section-blog-grid">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogPosts.map((post, index) => (
                <BlogCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}