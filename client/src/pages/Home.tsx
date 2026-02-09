import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ToolGrid } from "@/components/ToolGrid";
import { RecentFiles } from "@/components/RecentFiles";
import { ProcessingHistory } from "@/components/ProcessingHistory";
import { FavoritesBar } from "@/components/FavoritesBar";
import { UsageStatsDashboard } from "@/components/UsageStatsDashboard";

import { PullToRefresh } from "@/components/PullToRefresh";
import { motion } from "framer-motion";
import { Zap, Shield, Clock, FileText, Users, Globe, ArrowRight, Mail, Heart, Smartphone, Download, Camera, QrCode, Wifi } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { t } = useLanguage();

  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshKey((k) => k + 1);
  }, []);

  const stats = [
    { value: "50+", label: t("hero.stats.tools"), icon: FileText },
    { value: "100%", label: t("hero.stats.secure"), icon: Shield },
    { value: "<2s", label: t("hero.stats.fast"), icon: Clock },
    { value: "0", label: t("hero.stats.stored"), icon: Globe },
  ];

  const highlights = [
    {
      title: t("highlight.noInstall"),
      description: t("highlight.noInstallDesc"),
      icon: Globe,
    },
    {
      title: t("highlight.fast"),
      description: t("highlight.fastDesc"),
      icon: Zap,
    },
    {
      title: t("highlight.privacy"),
      description: t("highlight.privacyDesc"),
      icon: Shield,
    },
    {
      title: t("highlight.mobile"),
      description: t("highlight.mobileDesc"),
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Navbar />
      <PullToRefresh onRefresh={handleRefresh}>
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

        <FavoritesBar key={`favs-${refreshKey}`} />
        <RecentFiles key={`recent-${refreshKey}`} />
        <ProcessingHistory key={`history-${refreshKey}`} />
        <UsageStatsDashboard key={`stats-${refreshKey}`} />
        <ToolGrid key={`tools-${refreshKey}`} />

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 sm:py-20"
        >
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4" data-testid="text-why-title">
                {t("home.whyTitle")}
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {t("home.whySubtitle")}
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
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4" data-testid="text-mobile-app-title">
                {t("home.mobileTitle")}
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {t("home.mobileSubtitle")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: FileText, title: t("home.mobileTools"), desc: t("home.mobileToolsDesc") },
                    { icon: Camera, title: t("home.scanner"), desc: t("home.scannerDesc") },
                    { icon: QrCode, title: t("home.qrCode"), desc: t("home.qrCodeDesc") },
                    { icon: Wifi, title: t("home.offline"), desc: t("home.offlineDesc") },
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-8 text-center bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/20">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t("home.androidTitle")}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t("home.androidDesc")}
                  </p>
                  <a href="/InstantPDF.apk" download>
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25"
                      data-testid="button-download-apk"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      {t("home.downloadApk")}
                    </Button>
                  </a>
                  <p className="text-xs text-muted-foreground mt-3">
                    {t("home.androidReq")}
                  </p>
                </Card>
              </motion.div>
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
                {t("home.ctaTitle")}
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                {t("home.ctaSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25"
                    data-testid="button-view-pricing"
                  >
                    {t("home.viewPricing")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" data-testid="button-signup-cta">
                    {t("home.createAccount")}
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
        className="border-t border-border/50 bg-muted/30"
      >
        <div className="container px-4 md:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-1.5 rounded-lg">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">InstantPDF</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {t("footer.tagline")}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <span>{t("footer.madeWith")}</span>
                <Heart className="h-3 w-3 text-red-400 fill-red-400" />
                <span>{t("footer.forProductivity")}</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-4">{t("footer.popularTools")}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/merge-pdf" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Merge PDF</Link></li>
                <li><Link href="/compress-pdf" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Compress PDF</Link></li>
                <li><Link href="/split-pdf" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Split PDF</Link></li>
                <li><Link href="/pdf-to-word" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">PDF to Word</Link></li>
                <li><Link href="/jpg-to-pdf" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">JPG to PDF</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-4">{t("footer.moreTools")}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/rotate-pdf" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Rotate PDF</Link></li>
                <li><Link href="/watermark-pdf" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Watermark PDF</Link></li>
                <li><Link href="/protect-pdf" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Protect PDF</Link></li>
                <li><Link href="/ocr-pdf" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">OCR PDF</Link></li>
                <li><Link href="/batch-process" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Batch Process</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-4">{t("footer.company")}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-pricing">{t("footer.pricing")}</Link></li>
                <li><Link href="/about" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-about">{t("footer.about")}</Link></li>
                <li><Link href="/blog" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-blog">{t("footer.blog")}</Link></li>
                <li><Link href="/contact" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-contact">{t("footer.contact")}</Link></li>
                <li><Link href="/privacy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-privacy">{t("footer.privacy")}</Link></li>
                <li><Link href="/terms" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" data-testid="link-terms">{t("footer.terms")}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground/60">{t("footer.copyright")}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
              <Link href="/contact" className="flex items-center gap-1 hover:text-cyan-500 transition-colors">
                <Mail className="h-3 w-3" />
                <span>{t("footer.support")}</span>
              </Link>
              <span>instantpdf.in</span>
            </div>
          </div>
        </div>
        </motion.footer>
      </PullToRefresh>
    </div>
  );
}