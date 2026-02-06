import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, AlertTriangle, Scale, Ban, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function Terms() {
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
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-display font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-display font-bold mb-4">1. Acceptance of Terms</h2>
              <Card className="p-6">
                <p className="text-muted-foreground">
                  By accessing and using InstantPDF (instantpdf.in), you accept and agree to be bound by these 
                  Terms of Service. If you do not agree to these terms, please do not use our service.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-display font-bold mb-4">2. Description of Service</h2>
              <Card className="p-6">
                <p className="text-muted-foreground mb-4">
                  InstantPDF provides online PDF manipulation tools including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Merging multiple PDF files</li>
                  <li>Splitting PDF documents</li>
                  <li>Compressing PDF files</li>
                  <li>Converting between PDF and other formats</li>
                  <li>Adding watermarks, page numbers, and headers</li>
                  <li>Password protection and unlocking</li>
                  <li>Rotating, cropping, and editing PDFs</li>
                </ul>
              </Card>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h2 className="text-2xl font-display font-bold">3. Acceptable Use</h2>
              </div>
              <Card className="p-6">
                <p className="text-muted-foreground mb-4">You agree to use InstantPDF only for lawful purposes. You may:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Process PDF files that you own or have permission to modify</li>
                  <li>Use the service for personal or business purposes</li>
                  <li>Create an account to access enhanced features</li>
                </ul>
              </Card>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Ban className="h-5 w-5 text-red-500" />
                <h2 className="text-2xl font-display font-bold">4. Prohibited Activities</h2>
              </div>
              <Card className="p-6">
                <p className="text-muted-foreground mb-4">You may NOT use InstantPDF to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Process illegal, harmful, or fraudulent content</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Attempt to bypass usage limits or abuse the service</li>
                  <li>Upload malicious files or attempt to compromise our systems</li>
                  <li>Use automated tools to excessively access the service</li>
                  <li>Share your account credentials with others</li>
                </ul>
              </Card>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-5 w-5 text-cyan-500" />
                <h2 className="text-2xl font-display font-bold">5. User Accounts</h2>
              </div>
              <Card className="p-6">
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Free Accounts:</strong> Available to all users with daily 
                    usage limits. Free accounts may have restrictions on file size and number of operations.
                  </p>
                  <p>
                    <strong className="text-foreground">Pro Accounts:</strong> Paid subscriptions with enhanced 
                    limits and features. Pro subscriptions are subject to our pricing and billing terms.
                  </p>
                  <p>
                    You are responsible for maintaining the security of your account credentials.
                  </p>
                </div>
              </Card>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-2xl font-display font-bold">6. Disclaimer of Warranties</h2>
              </div>
              <Card className="p-6 border-amber-500/20">
                <p className="text-muted-foreground">
                  InstantPDF is provided "as is" without warranties of any kind. We do not guarantee that the 
                  service will be uninterrupted, error-free, or that all PDF operations will produce perfect 
                  results. Always keep backups of your original files.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-display font-bold mb-4">7. Limitation of Liability</h2>
              <Card className="p-6">
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, InstantPDF and its operators shall not be liable for 
                  any indirect, incidental, special, consequential, or punitive damages resulting from your use 
                  of the service, including but not limited to loss of data, business interruption, or other 
                  damages.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-display font-bold mb-4">8. Intellectual Property</h2>
              <Card className="p-6">
                <p className="text-muted-foreground">
                  The InstantPDF name, logo, and website content are our intellectual property. You retain all 
                  rights to your own PDF files. We do not claim any ownership over files you process through 
                  our service.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-display font-bold mb-4">9. Changes to Terms</h2>
              <Card className="p-6">
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms of Service at any time. Changes will be effective 
                  immediately upon posting. Your continued use of the service constitutes acceptance of the 
                  modified terms.
                </p>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-display font-bold mb-4">10. Contact</h2>
              <Card className="p-6">
                <p className="text-muted-foreground">
                  For questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:legal@instantpdf.in" className="text-cyan-500 hover:underline">
                    legal@instantpdf.in
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
