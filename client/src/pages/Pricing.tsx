import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  X,
  Zap,
  Crown,
  Shield,
  FileText,
  ChevronDown,
  Users,
  Globe,
  Star,
  Lock,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const plans = [
  {
    name: "Anonymous",
    price: "Free",
    period: "",
    description: "No account needed. Start using tools instantly.",
    icon: FileText,
    color: "from-slate-400 to-slate-500",
    badge: null,
    features: [
      { text: "10 operations per day", included: true },
      { text: "7MB max file size", included: true },
      { text: "25 pages max", included: true },
      { text: "9 basic tools", included: true },
      { text: "No account required", included: true },
      { text: "Usage tracking", included: false },
      { text: "Priority processing", included: false },
    ],
    cta: "Use Now",
    ctaLink: "/",
  },
  {
    name: "Free",
    price: "Free",
    period: "",
    description: "Create an account for higher limits and more tools.",
    icon: Shield,
    color: "from-cyan-500 to-blue-600",
    badge: null,
    features: [
      { text: "25 operations per day", included: true },
      { text: "11MB max file size", included: true },
      { text: "40 pages max", included: true },
      { text: "25+ tools", included: true },
      { text: "Usage tracking & history", included: true },
      { text: "Account management", included: true },
      { text: "Priority processing", included: false },
    ],
    cta: "Sign Up Free",
    ctaLink: "/signup",
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "Unlimited access for professionals and businesses.",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    badge: "Most Popular",
    features: [
      { text: "Unlimited operations", included: true },
      { text: "No file size limit", included: true },
      { text: "No page limit", included: true },
      { text: "All 50+ tools", included: true },
      { text: "OCR, extract text/images, HTML to PDF", included: true },
      { text: "Usage tracking & history", included: true },
      { text: "Priority processing", included: true },
    ],
    cta: "Upgrade to Pro",
    ctaLink: "/signup",
  },
];

const featureComparison = [
  { feature: "Daily Operations", anonymous: "10", free: "25", pro: "Unlimited" },
  { feature: "Max File Size", anonymous: "7 MB", free: "11 MB", pro: "No Limit" },
  { feature: "Max Pages", anonymous: "25", free: "40", pro: "No Limit" },
  { feature: "Available Tools", anonymous: "9 basic", free: "25+", pro: "All 50+" },
  { feature: "Merge PDF", anonymous: true, free: true, pro: true },
  { feature: "Split PDF", anonymous: true, free: true, pro: true },
  { feature: "Compress PDF", anonymous: true, free: true, pro: true },
  { feature: "Convert To/From PDF", anonymous: true, free: true, pro: true },
  { feature: "Edit & Modify Tools", anonymous: false, free: true, pro: true },
  { feature: "Security Tools", anonymous: false, free: true, pro: true },
  { feature: "OCR Text Recognition", anonymous: false, free: false, pro: true },
  { feature: "Extract Text / Images", anonymous: false, free: false, pro: true },
  { feature: "HTML to PDF", anonymous: false, free: false, pro: true },
  { feature: "Batch Processing", anonymous: false, free: true, pro: true },
  { feature: "Usage Dashboard", anonymous: false, free: true, pro: true },
  { feature: "Operation History", anonymous: false, free: true, pro: true },
  { feature: "Mobile App Access", anonymous: true, free: true, pro: true },
  { feature: "Priority Processing", anonymous: false, free: false, pro: true },
  { feature: "Account Management", anonymous: false, free: true, pro: true },
];

const faqs = [
  {
    question: "Can I use the tools without creating an account?",
    answer:
      "Yes! Anonymous users can access 9 basic PDF tools with up to 10 operations per day, a 7MB file size limit, and a 25-page limit. No sign-up required.",
  },
  {
    question: "What happens when I reach my daily limit?",
    answer:
      "Once you hit your daily operation limit, you'll need to wait until the next day or upgrade your plan. Free users get 25 operations per day, while Pro users enjoy unlimited operations.",
  },
  {
    question: "How does the Pro plan billing work?",
    answer:
      "Pro is billed monthly at $9.99/month. You can cancel anytime and continue using Pro features until the end of your billing period.",
  },
  {
    question: "Are my files stored on your servers?",
    answer:
      "No. All files are processed in-memory and are never stored on our servers. Your documents are deleted immediately after processing, ensuring complete privacy.",
  },
  {
    question: "What tools are included in each plan?",
    answer:
      "Anonymous users get 9 basic tools (merge, split, compress, and basic conversions). Free users unlock 25+ tools including editing and security features. Pro users get all 50+ tools including OCR, text/image extraction, and HTML to PDF.",
  },
  {
    question: "Can I switch between plans?",
    answer:
      "Absolutely. You can upgrade from Free to Pro at any time. If you downgrade, you'll keep Pro access until the end of your current billing period.",
  },
];

const socialProofStats = [
  { label: "Documents Processed", value: "500K+", icon: FileText },
  { label: "Happy Users", value: "10,000+", icon: Users },
  { label: "Countries", value: "120+", icon: Globe },
  { label: "Uptime", value: "99.9%", icon: Zap },
];

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left"
        data-testid={`button-faq-${index}`}
      >
        <div className="flex items-center justify-between p-5 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
          <span className="font-medium text-sm md:text-base pr-4">{question}</span>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="px-5 pt-2 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
            </Button>
          </Link>

          <div className="text-center mb-14">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20 mb-5"
            >
              <Zap className="h-8 w-8" />
            </motion.div>
            <h1
              className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent"
              data-testid="text-pricing-title"
            >
              Simple, Transparent Pricing
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Start free with basic tools, unlock more as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
            {plans.map((plan, i) => {
              const isPro = plan.name === "Pro";
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className={isPro ? "md:-mt-4 md:mb-[-16px]" : ""}
                >
                  <Card
                    className={`p-6 md:p-8 h-full flex flex-col relative transition-shadow duration-300 ${
                      isPro
                        ? "border-2 border-amber-500/60 shadow-xl shadow-amber-500/15 dark:shadow-amber-500/10 ring-1 ring-amber-500/20"
                        : "hover:shadow-lg"
                    }`}
                    data-testid={`card-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-amber-500/30">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-white" />
                          {plan.badge}
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div
                        className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${plan.color} text-white mb-4 shadow-lg`}
                      >
                        <plan.icon className="h-6 w-6" />
                      </div>
                      <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                      <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className={`text-4xl font-bold ${isPro ? "text-amber-500 dark:text-amber-400" : ""}`}>
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-muted-foreground text-sm">{plan.period}</span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">{plan.description}</p>
                    </div>

                    <div className="space-y-3 flex-1 mb-6">
                      {plan.features.map((f) => (
                        <div key={f.text} className="flex items-start gap-2.5">
                          {f.included ? (
                            <div className={`mt-0.5 flex-shrink-0 rounded-full p-0.5 ${isPro ? "bg-amber-500/10 dark:bg-amber-500/20" : "bg-green-500/10 dark:bg-green-500/20"}`}>
                              <Check className={`h-3.5 w-3.5 ${isPro ? "text-amber-500" : "text-green-500"}`} />
                            </div>
                          ) : (
                            <div className="mt-0.5 flex-shrink-0 rounded-full p-0.5 bg-muted">
                              <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                            </div>
                          )}
                          <span
                            className={`text-sm ${
                              f.included ? "text-foreground" : "text-muted-foreground/50"
                            }`}
                          >
                            {f.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full font-semibold ${
                        isPro
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25"
                          : plan.name === "Free"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                          : ""
                      }`}
                      size="lg"
                      variant={plan.name === "Anonymous" ? "outline" : "default"}
                      onClick={() => setLocation(plan.ctaLink)}
                      data-testid={`button-plan-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-20"
            data-testid="section-social-proof"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold mb-2">Trusted by Thousands Worldwide</h2>
              <p className="text-muted-foreground">
                Join a growing community of professionals who rely on our tools every day.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {socialProofStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                >
                  <Card className="p-5 text-center hover:shadow-md transition-shadow" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <stat.icon className="h-6 w-6 mx-auto mb-2 text-cyan-500 dark:text-cyan-400" />
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-20"
          >
            <h2 className="text-2xl font-display font-bold text-center mb-8" data-testid="text-comparison-title">
              Feature Comparison
            </h2>

            <Card className="overflow-hidden border-2">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-slate-400" />
                          Anonymous
                        </span>
                      </th>
                      <th className="text-center p-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <Shield className="h-4 w-4 text-cyan-500" />
                          Free
                        </span>
                      </th>
                      <th className="text-center p-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5 text-amber-500">
                          <Crown className="h-4 w-4" />
                          Pro
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.map((row, i) => (
                      <tr
                        key={row.feature}
                        className={`border-b last:border-b-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                        data-testid={`row-feature-${i}`}
                      >
                        <td className="p-4 text-sm font-medium">{row.feature}</td>
                        <td className="p-4 text-center">
                          {typeof row.anonymous === "boolean" ? (
                            row.anonymous ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">{row.anonymous}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.free === "boolean" ? (
                            row.free ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">{row.free}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.pro === "boolean" ? (
                            row.pro ? (
                              <Check className="h-4 w-4 text-amber-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-semibold text-amber-500">{row.pro}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-20"
            data-testid="section-faq"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Everything you need to know about our pricing and plans.
              </p>
            </div>
            <div className="max-w-3xl mx-auto space-y-3">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} index={i} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Card className="p-8 md:p-10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 text-center">
              <Lock className="h-8 w-8 mx-auto mb-3 text-cyan-500 dark:text-cyan-400" />
              <h3 className="text-xl font-bold mb-2">Your Privacy is Our Priority</h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Regardless of your plan, your files are always processed in-memory and never stored on our servers.
                All processing happens securely with end-to-end encryption.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
