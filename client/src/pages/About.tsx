import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Zap, Mail, MapPin, ShieldCheck, Lock, Clock, 
  FileText, Layers, Globe, ArrowLeft, Users, Sparkles
} from "lucide-react";
import { Link } from "wouter";

const features = [
  { icon: ShieldCheck, name: "Secure Processing", description: "All files are processed on our servers and automatically deleted after completion. Your data never leaves our secure environment." },
  { icon: Clock, name: "Lightning Fast", description: "Our optimized processing engine handles your PDFs in seconds, not minutes. No waiting around for results." },
  { icon: Lock, name: "Privacy First", description: "We never store, share, or access your documents. Your files are encrypted during transfer and permanently removed after processing." },
  { icon: Layers, name: "All-in-One Platform", description: "Merge, split, compress, convert, rotate, watermark, and more — all the PDF tools you need in one place." },
  { icon: Globe, name: "Works Everywhere", description: "No software to install. InstantPDF works directly in your browser on any device — desktop, tablet, or mobile." },
  { icon: Users, name: "Free & Pro Plans", description: "Get started for free with generous daily limits. Upgrade to Pro for unlimited access and larger file support." },
];

const stats = [
  { value: "50+", label: "PDF Tools" },
  { value: "100%", label: "Free to Start" },
  { value: "256-bit", label: "SSL Encryption" },
  { value: "24/7", label: "Available" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
            </Button>
          </Link>

          <section className="text-center mb-16">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/30 mb-4">
                <Zap className="h-12 w-12" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              About <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">InstantPDF</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              InstantPDF is your all-in-one online PDF toolkit. We make it easy to manage, 
              edit, and convert your PDF documents — fast, secure, and completely free to get started.
            </p>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="p-6 text-center" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-display font-bold mb-2 text-center">Our Mission</h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
              We believe everyone should have access to powerful PDF tools without expensive software 
              subscriptions or complicated installations. InstantPDF brings professional-grade PDF 
              processing right to your browser.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-display font-bold mb-6 text-center">Why Choose InstantPDF?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg hover:shadow-cyan-500/10 transition-shadow" data-testid={`feature-${feature.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-cyan-500" />
                      </div>
                      <h3 className="font-semibold">{feature.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <Card className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-cyan-500" />
                <h2 className="text-2xl font-display font-bold text-center">What We Offer</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-cyan-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Merge & Split</span> — Combine multiple PDFs or extract specific pages with ease.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-cyan-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Compress</span> — Reduce file sizes without losing quality for easy sharing.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-cyan-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Convert</span> — Transform PDFs to images, Word, and other formats.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-cyan-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Protect & Unlock</span> — Add or remove password protection on your PDFs.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-cyan-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Watermark</span> — Add custom text or image watermarks to your documents.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-cyan-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Rotate & Reorder</span> — Fix page orientation and rearrange pages as needed.</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="mb-16">
            <Card className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <h2 className="text-2xl font-display font-bold mb-6 text-center">Get in Touch</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                      <Mail className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">contact@instantpdf.in</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                      <Globe className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <p className="font-medium">www.instantpdf.in</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-muted-foreground mb-4">
                    Have questions, feedback, or need help? We'd love to hear from you!
                  </p>
                  <a href="mailto:contact@instantpdf.in">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700" data-testid="button-contact">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Us
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
