import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings, Shield, LayoutDashboard, Clock, BookOpen, Globe } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages } from "@/lib/i18n";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navLinkKeys = [
  { href: "/", key: "nav.allTools" as const },
  { href: "/dashboard", key: "nav.dashboard" as const },
  { href: "/merge-pdf", key: "nav.quickMerge" as const },
  { href: "/split-pdf", key: "nav.quickSplit" as const },
  { href: "/compress-pdf", key: "nav.quickCompress" as const },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout, isLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2 group">
            <img src="/logo.png" alt="InstantPDF" className="h-9 w-9 rounded-lg shadow-lg shadow-cyan-500/30 object-cover" />
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              InstantPDF
            </span>
          </Link>
          <div className="hidden md:flex md:flex-1 md:items-center md:space-x-4">
            <nav className="flex items-center space-x-1 text-sm font-medium text-muted-foreground">
              {navLinkKeys.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`px-3 py-2 rounded-lg transition-all hover:text-foreground hover:bg-muted ${
                    location === link.href ? 'text-foreground bg-muted' : ''
                  }`}
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-language">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`cursor-pointer ${language === lang.code ? "bg-accent" : ""}`}
                  >
                    <span className="mr-2">{lang.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            {!isLoading && (
              user ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden md:flex hover:bg-muted gap-2">
                      <User className="h-4 w-4" />
                      <span className="max-w-[150px] truncate">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      {t("nav.profile")}
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" />
                        {t("nav.admin")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setLocation("/history")} className="cursor-pointer">
                      <Clock className="h-4 w-4 mr-2" />
                      {t("nav.history")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/blog")} className="cursor-pointer">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {t("nav.blog")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { logout(); setLocation("/"); }} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("nav.signout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="hidden md:flex hover:bg-muted">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button 
                      size="sm" 
                      className="hidden md:flex bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all"
                    >
                      {t("nav.signup")}
                    </Button>
                  </Link>
                </>
              )
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
              data-testid="button-mobile-menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-background border-b border-border/50 shadow-xl md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4">
            <nav className="flex flex-col space-y-1">
              {navLinkKeys.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    location === link.href 
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>
            <div className="flex items-center justify-between px-4 py-2 mt-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">{t("nav.theme")}</span>
              <ThemeToggle showLabel />
            </div>
            <div className="px-4 py-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground block mb-2">{t("nav.language")}</span>
              <div className="flex flex-wrap gap-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      language === lang.code
                        ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border/50 mt-1 pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Settings className="h-4 w-4" />
                      {t("nav.profile")}
                    </Button>
                  </Link>
                  <Link href="/history">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Clock className="h-4 w-4" />
                      {t("nav.history")}
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t("nav.blog")}
                    </Button>
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Shield className="h-4 w-4" />
                        {t("nav.admin")}
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => { logout(); setLocation("/"); }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.signout")}
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0">
                      {t("nav.signup")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
