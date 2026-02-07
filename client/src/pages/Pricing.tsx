import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Check, X, Zap, Crown, Shield, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

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
      { text: "8 operations per day", included: true },
      { text: "5MB max file size", included: true },
      { text: "25 pages max", included: true },
      { text: "All PDF tools", included: true },
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
    description: "Create an account for higher limits and usage tracking.",
    icon: Shield,
    color: "from-cyan-500 to-blue-600",
    badge: null,
    features: [
      { text: "15 operations per day", included: true },
      { text: "10MB max file size", included: true },
      { text: "40 pages max", included: true },
      { text: "All PDF tools", included: true },
      { text: "Usage tracking & history", included: true },
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
      { text: "All PDF tools", included: true },
      { text: "Usage tracking & history", included: true },
      { text: "Priority processing", included: true },
    ],
    cta: "Upgrade to Pro",
    ctaLink: "/signup",
  },
];

const featureComparison = [
  { feature: "Daily Operations", anonymous: "8", free: "15", pro: "Unlimited" },
  { feature: "Max File Size", anonymous: "5 MB", free: "10 MB", pro: "No Limit" },
  { feature: "Max Pages", anonymous: "25", free: "40", pro: "No Limit" },
  { feature: "Merge PDF", anonymous: true, free: true, pro: true },
  { feature: "Split PDF", anonymous: true, free: true, pro: true },
  { feature: "Compress PDF", anonymous: true, free: true, pro: true },
  { feature: "Convert To/From PDF", anonymous: true, free: true, pro: true },
  { feature: "Edit & Modify Tools", anonymous: true, free: true, pro: true },
  { feature: "Security Tools", anonymous: true, free: true, pro: true },
  { feature: "OCR Text Recognition", anonymous: true, free: true, pro: true },
  { feature: "Batch Processing", anonymous: true, free: true, pro: true },
  { feature: "Usage Dashboard", anonymous: false, free: true, pro: true },
  { feature: "Operation History", anonymous: false, free: true, pro: true },
  { feature: "Mobile App Access", anonymous: true, free: true, pro: true },
  { feature: "Priority Processing", anonymous: false, free: false, pro: true },
  { feature: "Account Management", anonymous: false, free: true, pro: true },
];

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

          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20 mb-4">
              <Zap className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-display font-bold mb-4" data-testid="text-pricing-title">Pricing Plans</h1>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Start free, upgrade when you need more. All tools available on every plan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`p-6 h-full flex flex-col relative ${
                    plan.badge
                      ? "border-amber-500/50 shadow-lg shadow-amber-500/10"
                      : ""
                  }`}
                  data-testid={`card-plan-${plan.name.toLowerCase()}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div
                      className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${plan.color} text-white mb-4`}
                    >
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                  </div>

                  <div className="space-y-3 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <div key={f.text} className="flex items-center gap-2">
                        {f.included ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
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
                    className={`w-full ${
                      plan.badge
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                        : plan.name === "Free"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                        : ""
                    }`}
                    variant={plan.name === "Anonymous" ? "outline" : "default"}
                    onClick={() => setLocation(plan.ctaLink)}
                    data-testid={`button-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-display font-bold text-center mb-8" data-testid="text-comparison-title">
              Feature Comparison
            </h2>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold">Anonymous</th>
                      <th className="text-center p-4 font-semibold">Free</th>
                      <th className="text-center p-4 font-semibold text-amber-500">Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.map((row, i) => (
                      <tr
                        key={row.feature}
                        className={i % 2 === 0 ? "" : "bg-muted/20"}
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
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
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
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <Card className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 text-center">
              <h3 className="text-xl font-bold mb-2">Privacy Guarantee</h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Regardless of your plan, your files are always processed in-memory and never stored on our servers.
                Your privacy is our top priority.
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
