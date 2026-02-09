import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecentTools, getToolByHref } from "@/hooks/use-tools";
import { SplashScreen } from "@/components/SplashScreen";
import { BottomNav } from "@/components/BottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ToolPageSkeleton, DashboardSkeleton, HomePageSkeleton } from "@/components/PageSkeleton";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

const MergePdf = lazy(() => import("@/pages/MergePdf"));
const SplitPdf = lazy(() => import("@/pages/SplitPdf"));
const CompressPdf = lazy(() => import("@/pages/CompressPdf"));
const PdfToWord = lazy(() => import("@/pages/PdfToWord"));
const PdfToPowerpoint = lazy(() => import("@/pages/PdfToPowerpoint"));
const PdfToExcel = lazy(() => import("@/pages/PdfToExcel"));
const WordToPdf = lazy(() => import("@/pages/WordToPdf"));
const PowerpointToPdf = lazy(() => import("@/pages/PowerpointToPdf"));
const RotatePdf = lazy(() => import("@/pages/RotatePdf"));
const UnlockPdf = lazy(() => import("@/pages/UnlockPdf"));
const ProtectPdf = lazy(() => import("@/pages/ProtectPdf"));
const WatermarkPdf = lazy(() => import("@/pages/WatermarkPdf"));
const RemovePages = lazy(() => import("@/pages/RemovePages"));
const OrganizePdf = lazy(() => import("@/pages/OrganizePdf"));
const RepairPdf = lazy(() => import("@/pages/RepairPdf"));
const OcrPdf = lazy(() => import("@/pages/OcrPdf"));
const JpgToPdf = lazy(() => import("@/pages/JpgToPdf"));
const ExcelToPdf = lazy(() => import("@/pages/ExcelToPdf"));
const HtmlToPdf = lazy(() => import("@/pages/HtmlToPdf"));
const PdfToJpg = lazy(() => import("@/pages/PdfToJpg"));
const PdfToPdfA = lazy(() => import("@/pages/PdfToPdfA"));
const AddPageNumbers = lazy(() => import("@/pages/AddPageNumbers"));
const AddHeaderFooter = lazy(() => import("@/pages/AddHeaderFooter"));
const CropPdf = lazy(() => import("@/pages/CropPdf"));
const EditPdf = lazy(() => import("@/pages/EditPdf"));
const SignPdf = lazy(() => import("@/pages/SignPdf"));
const RedactPdf = lazy(() => import("@/pages/RedactPdf"));
const ComparePdf = lazy(() => import("@/pages/ComparePdf"));
const FlattenPdf = lazy(() => import("@/pages/FlattenPdf"));
const ExtractImages = lazy(() => import("@/pages/ExtractImages"));
const ExtractText = lazy(() => import("@/pages/ExtractText"));
const PngToPdf = lazy(() => import("@/pages/PngToPdf"));
const PdfToPng = lazy(() => import("@/pages/PdfToPng"));
const PdfToTiff = lazy(() => import("@/pages/PdfToTiff"));
const BmpToPdf = lazy(() => import("@/pages/BmpToPdf"));
const EncryptPdf = lazy(() => import("@/pages/EncryptPdf"));
const MetadataEditor = lazy(() => import("@/pages/MetadataEditor"));
const BookmarksEditor = lazy(() => import("@/pages/BookmarksEditor"));
const BatchProcess = lazy(() => import("@/pages/BatchProcess"));
const FormFiller = lazy(() => import("@/pages/FormFiller"));
const MarkdownToPdf = lazy(() => import("@/pages/MarkdownToPdf"));
const UrlToPdf = lazy(() => import("@/pages/UrlToPdf"));
const PdfTemplates = lazy(() => import("@/pages/PdfTemplates"));
const ImageCollage = lazy(() => import("@/pages/ImageCollage"));
const AnnotatePdf = lazy(() => import("@/pages/AnnotatePdf"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const About = lazy(() => import("@/pages/About"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Contact = lazy(() => import("@/pages/Contact"));
const Blog = lazy(() => import("@/pages/Blog"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Profile = lazy(() => import("@/pages/Profile"));
const History = lazy(() => import("@/pages/History"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const SharePage = lazy(() => import("@/pages/SharePage"));

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1] as const,
};

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function ToolUsageTracker() {
  const [location] = useLocation();
  const { recordUsage } = useRecentTools();

  useEffect(() => {
    if (location !== "/" && location !== "/dashboard" && getToolByHref(location)) {
      recordUsage(location);
    }
  }, [location, recordUsage]);

  return null;
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <div className="pb-20 md:pb-0">
      <Suspense fallback={
        location === "/" ? <HomePageSkeleton /> :
        location === "/dashboard" ? <DashboardSkeleton /> :
        <ToolPageSkeleton />
      }>
        <AnimatePresence mode="wait">
          <motion.div key={location} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
            <Switch location={location}>
              <Route path="/" component={Home} />
              <Route path="/dashboard" component={Dashboard} />
              
              <Route path="/merge-pdf" component={MergePdf} />
              <Route path="/split-pdf" component={SplitPdf} />
              <Route path="/remove-pages" component={RemovePages} />
              <Route path="/organize-pdf" component={OrganizePdf} />
              
              <Route path="/compress-pdf" component={CompressPdf} />
              <Route path="/repair-pdf" component={RepairPdf} />
              <Route path="/ocr-pdf" component={OcrPdf} />
              <Route path="/flatten-pdf" component={FlattenPdf} />

              <Route path="/jpg-to-pdf" component={JpgToPdf} />
              <Route path="/word-to-pdf" component={WordToPdf} />
              <Route path="/powerpoint-to-pdf" component={PowerpointToPdf} />
              <Route path="/excel-to-pdf" component={ExcelToPdf} />
              <Route path="/html-to-pdf" component={HtmlToPdf} />
              <Route path="/png-to-pdf" component={PngToPdf} />
              <Route path="/bmp-to-pdf" component={BmpToPdf} />
              <Route path="/markdown-to-pdf" component={MarkdownToPdf} />
              <Route path="/url-to-pdf" component={UrlToPdf} />

              <Route path="/pdf-to-jpg" component={PdfToJpg} />
              <Route path="/pdf-to-word" component={PdfToWord} />
              <Route path="/pdf-to-powerpoint" component={PdfToPowerpoint} />
              <Route path="/pdf-to-excel" component={PdfToExcel} />
              <Route path="/pdf-to-pdfa" component={PdfToPdfA} />
              <Route path="/pdf-to-png" component={PdfToPng} />
              <Route path="/pdf-to-tiff" component={PdfToTiff} />

              <Route path="/rotate-pdf" component={RotatePdf} />
              <Route path="/add-page-numbers" component={AddPageNumbers} />
              <Route path="/add-header-footer" component={AddHeaderFooter} />
              <Route path="/watermark-pdf" component={WatermarkPdf} />
              <Route path="/crop-pdf" component={CropPdf} />
              <Route path="/edit-pdf" component={EditPdf} />
              <Route path="/unlock-pdf" component={UnlockPdf} />
              <Route path="/protect-pdf" component={ProtectPdf} />
              <Route path="/sign-pdf" component={SignPdf} />
              <Route path="/redact-pdf" component={RedactPdf} />
              <Route path="/compare-pdf" component={ComparePdf} />
              <Route path="/extract-images" component={ExtractImages} />
              <Route path="/extract-text" component={ExtractText} />
              <Route path="/encrypt-pdf" component={EncryptPdf} />
              <Route path="/metadata-editor" component={MetadataEditor} />
              <Route path="/bookmarks-editor" component={BookmarksEditor} />
              <Route path="/batch-process" component={BatchProcess} />
              <Route path="/form-filler" component={FormFiller} />
              <Route path="/pdf-templates" component={PdfTemplates} />
              <Route path="/image-collage" component={ImageCollage} />
              <Route path="/annotate-pdf" component={AnnotatePdf} />
              <Route path="/about" component={About} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/terms" component={Terms} />
              <Route path="/contact" component={Contact} />
              <Route path="/blog" component={Blog} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />
              <Route path="/forgot-password" component={ForgotPassword} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route path="/profile" component={Profile} />
              <Route path="/history" component={History} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/share/:token" component={SharePage} />

              <Route component={NotFound} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
              <OfflineBanner />
              <Toaster />
              <ScrollToTop />
              <ToolUsageTracker />
              <Router />
              <BottomNav />
              <PWAInstallPrompt />
            </TooltipProvider>
          </QueryClientProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
