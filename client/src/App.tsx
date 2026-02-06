import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MergePdf from "@/pages/MergePdf";
import SplitPdf from "@/pages/SplitPdf";
import CompressPdf from "@/pages/CompressPdf";
import PdfToWord from "@/pages/PdfToWord";
import PdfToPowerpoint from "@/pages/PdfToPowerpoint";
import PdfToExcel from "@/pages/PdfToExcel";
import WordToPdf from "@/pages/WordToPdf";
import PowerpointToPdf from "@/pages/PowerpointToPdf";
import RotatePdf from "@/pages/RotatePdf";
import UnlockPdf from "@/pages/UnlockPdf";
import ProtectPdf from "@/pages/ProtectPdf";
import WatermarkPdf from "@/pages/WatermarkPdf";

// New Pages
import RemovePages from "@/pages/RemovePages";
import OrganizePdf from "@/pages/OrganizePdf";
import RepairPdf from "@/pages/RepairPdf";
import OcrPdf from "@/pages/OcrPdf";
import JpgToPdf from "@/pages/JpgToPdf";
import ExcelToPdf from "@/pages/ExcelToPdf";
import HtmlToPdf from "@/pages/HtmlToPdf";
import PdfToJpg from "@/pages/PdfToJpg";
import PdfToPdfA from "@/pages/PdfToPdfA";
import AddPageNumbers from "@/pages/AddPageNumbers";
import AddHeaderFooter from "@/pages/AddHeaderFooter";
import CropPdf from "@/pages/CropPdf";
import EditPdf from "@/pages/EditPdf";
import SignPdf from "@/pages/SignPdf";
import RedactPdf from "@/pages/RedactPdf";
import ComparePdf from "@/pages/ComparePdf";
import FlattenPdf from "@/pages/FlattenPdf";
import ExtractImages from "@/pages/ExtractImages";
import ExtractText from "@/pages/ExtractText";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/AdminDashboard";
import PngToPdf from "@/pages/PngToPdf";
import PdfToPng from "@/pages/PdfToPng";
import PdfToTiff from "@/pages/PdfToTiff";
import BmpToPdf from "@/pages/BmpToPdf";
import EncryptPdf from "@/pages/EncryptPdf";
import MetadataEditor from "@/pages/MetadataEditor";
import BookmarksEditor from "@/pages/BookmarksEditor";
import BatchProcess from "@/pages/BatchProcess";
import FormFiller from "@/pages/FormFiller";
import MarkdownToPdf from "@/pages/MarkdownToPdf";
import UrlToPdf from "@/pages/UrlToPdf";
import Dashboard from "@/pages/Dashboard";
import { AuthProvider } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useRecentTools, getToolByHref } from "@/hooks/use-tools";

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Organize */}
      <Route path="/merge-pdf" component={MergePdf} />
      <Route path="/split-pdf" component={SplitPdf} />
      <Route path="/remove-pages" component={RemovePages} />
      <Route path="/organize-pdf" component={OrganizePdf} />
      
      {/* Optimize */}
      <Route path="/compress-pdf" component={CompressPdf} />
      <Route path="/repair-pdf" component={RepairPdf} />
      <Route path="/ocr-pdf" component={OcrPdf} />
      <Route path="/flatten-pdf" component={FlattenPdf} />

      {/* Convert To PDF */}
      <Route path="/jpg-to-pdf" component={JpgToPdf} />
      <Route path="/word-to-pdf" component={WordToPdf} />
      <Route path="/powerpoint-to-pdf" component={PowerpointToPdf} />
      <Route path="/excel-to-pdf" component={ExcelToPdf} />
      <Route path="/html-to-pdf" component={HtmlToPdf} />
      <Route path="/png-to-pdf" component={PngToPdf} />
      <Route path="/bmp-to-pdf" component={BmpToPdf} />
      <Route path="/markdown-to-pdf" component={MarkdownToPdf} />
      <Route path="/url-to-pdf" component={UrlToPdf} />

      {/* Convert From PDF */}
      <Route path="/pdf-to-jpg" component={PdfToJpg} />
      <Route path="/pdf-to-word" component={PdfToWord} />
      <Route path="/pdf-to-powerpoint" component={PdfToPowerpoint} />
      <Route path="/pdf-to-excel" component={PdfToExcel} />
      <Route path="/pdf-to-pdfa" component={PdfToPdfA} />
      <Route path="/pdf-to-png" component={PdfToPng} />
      <Route path="/pdf-to-tiff" component={PdfToTiff} />

      {/* Edit & Security */}
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
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={AdminDashboard} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <ToolUsageTracker />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;