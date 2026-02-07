import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ToolGrid } from "@/components/ToolGrid";
import { RecentFiles } from "@/components/RecentFiles";
import { motion } from "framer-motion";
import { Zap, Shield, Clock, FileText, Users, Globe, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "30+", label: "PDF Tools", icon: FileText },
  { value: "100%", label: "Private & Secure", icon: Shield },
  { value: "<2s", label: "Processing Time", icon: Clock },
  { value: "0", label: "Files Stored", icon: Globe },
];

const highlights = [
  {
    title: "No Installation Required",
    description: "Works directly in your browser. No software to download or install.",
    icon: Globe,
  },
  {
    title: "Lightning Fast",
    description: "Powered by a dedicated Go backend for instant processing of even large files.",
    icon: Zap,
  },
  {
    title: "Privacy First",
    description: "Files processed in-memory and deleted immediately. We never store your documents.",
    icon: Shield,
  },
  {
    title: "Mobile Ready",
    description: "Use on any device. Plus our Android app with document scanner and QR tools.",
    icon: Users,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <main>
        <Hero />

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-12 sm:py-16 border-b border-border/30"
        >
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 mb-3">
                    <stat.icon className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <RecentFiles />
        <ToolGrid />

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 sm:py-20"
        >
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4" data-testid="text-why-title">
                Why Choose InstantPDF?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Built for speed, privacy, and simplicity. Here's what makes us different.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {highlights.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-6 h-full hover:border-cyan-500/30 transition-colors" data-testid={`card-highlight-${i}`}>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-cyan-500" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 sm:py-20"
        >
          <div className="container px-4 md:px-6">
            <Card className="p-8 sm:p-12 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/20 text-center">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4" data-testid="text-cta-title">
                Ready to simplify your PDF workflow?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                Join thousands of users who trust InstantPDF for fast, private, and reliable PDF processing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25"
                    data-testid="button-view-pricing"
                  >
                    View Pricing
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" data-testid="button-signup-cta">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </motion.section>
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
                <span className="text-muted-foreground">&copy; 2026 All Rights Reserved</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link href="/pricing" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-pricing">Pricing</Link>
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