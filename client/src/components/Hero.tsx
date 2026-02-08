import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Clock, FileText, Minimize2, RefreshCw, Layers, Scissors, Lock, Image } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback } from "react";
import { Link } from "wouter";

const floatingParticles = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 1.5,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 12 + 18,
  delay: Math.random() * 5,
}));

const toolIcons = [
  { icon: Layers, label: "Merge", x: -8, y: 15, delay: 0 },
  { icon: Minimize2, label: "Compress", x: 95, y: 25, delay: 0.5 },
  { icon: RefreshCw, label: "Convert", x: -5, y: 75, delay: 1 },
  { icon: Scissors, label: "Split", x: 92, y: 70, delay: 1.5 },
  { icon: Lock, label: "Protect", x: 50, y: -8, delay: 2 },
  { icon: Image, label: "Extract", x: 45, y: 105, delay: 2.5 },
];

export function Hero() {
  const scrollToTools = useCallback(() => {
    const toolsSection = document.getElementById('tools');
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 py-16 sm:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-500/8 via-transparent to-transparent" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/20"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [-15, 15, -15],
              x: [-8, 8, -8],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="absolute top-10 sm:top-20 left-5 sm:left-10 w-40 sm:w-56 h-40 sm:h-56 bg-cyan-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-500/8 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.25, 0.1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-center lg:text-left"
          >
            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 backdrop-blur-sm"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Zap className="h-3.5 w-3.5" />
                </motion.div>
                <span className="font-medium">Lightning fast PDF tools</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-500/15 px-4 py-1.5 text-sm font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 backdrop-blur-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>50+ PDF tools</span>
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground leading-[1.1]"
            >
              All your PDF tools in{" "}
              <motion.span
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto]"
                animate={{ backgroundPosition: ["0% center", "200% center"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                one place
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-[540px] mx-auto lg:mx-0 text-muted-foreground text-base sm:text-lg font-light leading-relaxed"
            >
              The fastest PDF tools online. Your files are never stored — processed instantly and deleted immediately. Complete privacy guaranteed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={scrollToTools}
                  className="h-12 sm:h-13 px-8 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 border-0 group"
                  data-testid="button-get-started"
                >
                  Get Started
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToTools}
                  className="h-12 sm:h-13 px-8 text-base border-border/50 hover:bg-muted/50 hover:border-cyan-500/30 transition-all backdrop-blur-sm"
                  data-testid="button-view-tools"
                >
                  View All Tools
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-2.5 justify-center lg:justify-start pt-4"
            >
              {[
                { icon: Zap, text: "Instant Processing" },
                { icon: Shield, text: "100% Private" },
                { icon: Clock, text: "No Data Stored" },
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 dark:bg-muted/40 px-3.5 py-1.5 text-xs font-medium text-muted-foreground border border-border/40 backdrop-blur-sm"
                >
                  <item.icon className="h-3 w-3 text-cyan-500 dark:text-cyan-400" />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full max-w-[420px] mx-auto">
              {toolIcons.map((tool, i) => (
                <motion.div
                  key={tool.label}
                  className="absolute z-20"
                  style={{ left: `${tool.x}%`, top: `${tool.y}%` }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 + tool.delay * 0.15 }}
                >
                  <motion.div
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: tool.delay }}
                    className="flex items-center gap-1.5 bg-background/90 dark:bg-background/80 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg shadow-black/5 dark:shadow-black/20 border border-border/50"
                  >
                    <tool.icon className="h-3.5 w-3.5 text-cyan-500" />
                    <span className="text-[11px] font-medium text-foreground/80">{tool.label}</span>
                  </motion.div>
                </motion.div>
              ))}

              <motion.div
                className="relative rounded-2xl bg-gradient-to-br from-background to-muted/80 dark:from-background dark:to-muted/40 border border-border/60 shadow-2xl shadow-cyan-500/5 dark:shadow-cyan-500/10 p-6 overflow-hidden"
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5" />

                <div className="relative space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">PDF Suite</div>
                      <div className="text-[11px] text-muted-foreground">All-in-one toolkit</div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: "Merge PDFs", color: "from-cyan-500 to-cyan-600", width: "85%" },
                      { label: "Compress", color: "from-blue-500 to-blue-600", width: "70%" },
                      { label: "Convert", color: "from-indigo-500 to-indigo-600", width: "90%" },
                      { label: "Split & Extract", color: "from-cyan-600 to-blue-500", width: "60%" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 1 + i * 0.15 }}
                        className="space-y-1"
                      >
                        <div className="flex justify-between text-[11px]">
                          <span className="text-foreground/70 font-medium">{item.label}</span>
                          <span className="text-muted-foreground">{item.width}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/80 dark:bg-muted/50 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            initial={{ width: "0%" }}
                            animate={{ width: item.width }}
                            transition={{ duration: 1, delay: 1.2 + i * 0.2, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {[
                      { icon: Lock, label: "Secure" },
                      { icon: Zap, label: "Fast" },
                      { icon: Shield, label: "Private" },
                    ].map((feat, i) => (
                      <motion.div
                        key={feat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 1.8 + i * 0.1 }}
                        className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 dark:bg-muted/30 py-2.5 px-2"
                      >
                        <feat.icon className="h-3.5 w-3.5 text-cyan-500" />
                        <span className="text-[10px] font-medium text-muted-foreground">{feat.label}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2 }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-cyan-500">Ready</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="lg:hidden flex justify-center"
          >
            <div className="relative w-full max-w-[320px]">
              <div className="rounded-xl bg-gradient-to-br from-background to-muted/80 dark:from-background dark:to-muted/40 border border-border/60 shadow-xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">PDF Suite</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { icon: Layers, label: "Merge" },
                    { icon: Minimize2, label: "Compress" },
                    { icon: RefreshCw, label: "Convert" },
                    { icon: Scissors, label: "Split" },
                  ].map((t) => (
                    <div key={t.label} className="flex-1 flex flex-col items-center gap-1 rounded-lg bg-muted/50 dark:bg-muted/30 py-2">
                      <t.icon className="h-3.5 w-3.5 text-cyan-500" />
                      <span className="text-[10px] font-medium text-muted-foreground">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
