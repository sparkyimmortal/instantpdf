import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ToolGrid } from "@/components/ToolGrid";
import { RecentFiles } from "@/components/RecentFiles";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main>
        <Hero />
        <RecentFiles />
        <ToolGrid />
      </main>
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t border-border/50 bg-muted/30 py-8 sm:py-12 text-sm text-muted-foreground"
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-1 rounded-lg">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">InstantPDF</span>
                <span className="text-muted-foreground">© 2026 All Rights Reserved</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link href="/privacy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-privacy">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-terms">Terms of Service</Link>
              <Link href="/contact" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-contact">Contact</Link>
              <Link href="/about" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-about">About</Link>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}