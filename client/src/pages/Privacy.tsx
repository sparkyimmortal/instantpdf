import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Trash2, Server, Globe } from "lucide-react";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
            </Button>
          </Link>

          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20 mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-display font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <Card className="p-8 mb-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Privacy-First Approach</h2>
                <p className="text-muted-foreground">
                  InstantPDF is designed with your privacy as the top priority. We do NOT store your PDF files 
                  on our servers. All files are processed in-memory and immediately deleted after processing.
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-5 w-5 text-cyan-500" />
                <h2 className="text-2xl font-display font-bold">Information We Collect</h2>
              </div>
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Account Information</h3>
                    <p className="text-muted-foreground">
                      When you create an account, we collect your email address and a securely hashed password. 
                      We never store your password in plain text.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Usage Statistics</h3>
                    <p className="text-muted-foreground">
                      We track anonymous usage statistics such as which tools are used and how often. 
                      This helps us improve our services. No personal data is linked to these statistics.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Technical Data</h3>
                    <p className="text-muted-foreground">
                      We may collect IP addresses for rate limiting and abuse prevention purposes only.
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="h-5 w-5 text-cyan-500" />
                <h2 className="text-2xl font-display font-bold">File Handling</h2>
              </div>
              <Card className="p-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Your PDFs are never stored.</strong> When you upload a file:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Files are processed entirely in-memory</li>
                    <li>Processing happens on secure servers</li>
                    <li>Files are immediately deleted after processing completes</li>
                    <li>No copies are made or retained</li>
                    <li>We cannot access, view, or recover your files</li>
                  </ul>
                </div>
              </Card>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Server className="h-5 w-5 text-cyan-500" />
                <h2 className="text-2xl font-display font-bold">Data Security</h2>
              </div>
              <Card className="p-6">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>All connections are encrypted using HTTPS/TLS</li>
                  <li>Passwords are hashed using industry-standard algorithms</li>
                  <li>We implement rate limiting to prevent abuse</li>
                  <li>Regular security audits are performed</li>
                  <li>Servers are hosted on secure cloud infrastructure</li>
                </ul>
              </Card>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-cyan-500" />
                <h2 className="text-2xl font-display font-bold">Cookies & Tracking</h2>
              </div>
              <Card className="p-6">
                <p className="text-muted-foreground mb-4">
                  We use minimal cookies necessary for the site to function:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Session cookies for authentication</li>
                  <li>Theme preference (light/dark mode)</li>
                  <li>No third-party tracking cookies</li>
                  <li>No advertising cookies</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-display font-bold mb-4">Your Rights</h2>
              <Card className="p-6">
                <p className="text-muted-foreground mb-4">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Access your account data</li>
                  <li>Delete your account at any time</li>
                  <li>Request a copy of your data</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-display font-bold mb-4">Contact Us</h2>
              <Card className="p-6">
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
                  <a href="mailto:privacy@instantpdf.in" className="text-cyan-500 hover:underline">
                    privacy@instantpdf.in
                  </a>
                </p>
              </Card>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
