import { useState } from "react";
import { motion } from "framer-motion";
import { ToolLayout } from "@/components/ToolLayout";
import { useToast } from "@/hooks/use-toast";
import { pdfFetch } from "@/lib/pdfApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Briefcase,
  ScrollText,
  Award,
  Plus,
  Trash2,
  Loader2,
  Download,
} from "lucide-react";

type Category = "All" | "Invoices" | "Resumes" | "Contracts" | "Certificates";

interface TemplateField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date";
  placeholder?: string;
  defaultValue?: string;
}

interface TemplateItemField {
  keys: { key: string; label: string; type: "text" | "number"; placeholder?: string }[];
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: Category;
  icon: typeof FileText;
  fields: TemplateField[];
  items?: TemplateItemField;
  generateHtml: (values: Record<string, string>, items?: Record<string, string>[]) => string;
}

const templates: Template[] = [
  {
    id: "invoice-simple",
    title: "Invoice (Simple)",
    description: "A clean, minimal invoice for freelancers and small businesses.",
    category: "Invoices",
    icon: FileText,
    fields: [
      { key: "companyName", label: "Company Name", type: "text", placeholder: "Your Company" },
      { key: "clientName", label: "Client Name", type: "text", placeholder: "Client Name" },
      { key: "invoiceNumber", label: "Invoice Number", type: "text", placeholder: "INV-001" },
      { key: "date", label: "Date", type: "date" },
    ],
    items: {
      keys: [
        { key: "description", label: "Description", type: "text", placeholder: "Service or product" },
        { key: "amount", label: "Amount", type: "number", placeholder: "0.00" },
      ],
    },
    generateHtml: (v, items = []) => {
      const rows = items.map(i => `<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${i.description || ""}</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${parseFloat(i.amount || "0").toFixed(2)}</td></tr>`).join("");
      const total = items.reduce((s, i) => s + parseFloat(i.amount || "0"), 0);
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica,Arial,sans-serif;margin:0;padding:40px;color:#1f2937;">
        <div style="max-width:700px;margin:0 auto;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
            <div><h1 style="margin:0;font-size:28px;color:#111827;">${v.companyName || "Company"}</h1></div>
            <div style="text-align:right;"><h2 style="margin:0;font-size:24px;color:#6366f1;">INVOICE</h2><p style="margin:4px 0 0;color:#6b7280;">${v.invoiceNumber || "INV-001"}</p><p style="margin:4px 0 0;color:#6b7280;">${v.date || ""}</p></div>
          </div>
          <div style="margin-bottom:30px;"><p style="margin:0;color:#6b7280;">Bill To:</p><p style="margin:4px 0 0;font-size:18px;font-weight:600;">${v.clientName || "Client"}</p></div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">
            <thead><tr style="background:#f3f4f6;"><th style="padding:10px 12px;text-align:left;font-weight:600;border-bottom:2px solid #e5e7eb;">Description</th><th style="padding:10px 12px;text-align:right;font-weight:600;border-bottom:2px solid #e5e7eb;">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="text-align:right;"><p style="font-size:20px;font-weight:700;color:#111827;">Total: $${total.toFixed(2)}</p></div>
        </div>
      </body></html>`;
    },
  },
  {
    id: "invoice-professional",
    title: "Invoice (Professional)",
    description: "Detailed invoice with tax, notes, and itemized billing.",
    category: "Invoices",
    icon: FileText,
    fields: [
      { key: "companyName", label: "Company Name", type: "text", placeholder: "Your Company" },
      { key: "companyAddress", label: "Company Address", type: "text", placeholder: "123 Main St, City" },
      { key: "clientName", label: "Client Name", type: "text", placeholder: "Client Name" },
      { key: "clientAddress", label: "Client Address", type: "text", placeholder: "456 Oak Ave, Town" },
      { key: "invoiceNumber", label: "Invoice Number", type: "text", placeholder: "INV-001" },
      { key: "date", label: "Date", type: "date" },
      { key: "tax", label: "Tax (%)", type: "number", placeholder: "0" },
      { key: "notes", label: "Notes", type: "textarea", placeholder: "Payment terms, bank details..." },
    ],
    items: {
      keys: [
        { key: "description", label: "Description", type: "text", placeholder: "Item description" },
        { key: "quantity", label: "Qty", type: "number", placeholder: "1" },
        { key: "rate", label: "Rate", type: "number", placeholder: "0.00" },
      ],
    },
    generateHtml: (v, items = []) => {
      const rows = items.map(i => {
        const qty = parseFloat(i.quantity || "1");
        const rate = parseFloat(i.rate || "0");
        const amt = qty * rate;
        return `<tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${i.description || ""}</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">${qty}</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;">$${rate.toFixed(2)}</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;">$${amt.toFixed(2)}</td></tr>`;
      }).join("");
      const subtotal = items.reduce((s, i) => s + parseFloat(i.quantity || "1") * parseFloat(i.rate || "0"), 0);
      const taxRate = parseFloat(v.tax || "0") / 100;
      const taxAmt = subtotal * taxRate;
      const total = subtotal + taxAmt;
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica,Arial,sans-serif;margin:0;padding:40px;color:#1f2937;">
        <div style="max-width:700px;margin:0 auto;">
          <div style="display:flex;justify-content:space-between;margin-bottom:40px;padding-bottom:20px;border-bottom:3px solid #4f46e5;">
            <div><h1 style="margin:0;font-size:26px;color:#4f46e5;">${v.companyName || "Company"}</h1><p style="margin:4px 0 0;color:#6b7280;font-size:13px;">${v.companyAddress || ""}</p></div>
            <div style="text-align:right;"><h2 style="margin:0;font-size:22px;color:#111827;">INVOICE</h2><p style="margin:4px 0 0;color:#6b7280;font-size:13px;">#${v.invoiceNumber || "INV-001"}</p><p style="margin:2px 0 0;color:#6b7280;font-size:13px;">${v.date || ""}</p></div>
          </div>
          <div style="margin-bottom:30px;"><p style="margin:0;font-weight:600;color:#4f46e5;">Bill To:</p><p style="margin:4px 0 0;font-size:16px;font-weight:600;">${v.clientName || "Client"}</p><p style="margin:2px 0 0;color:#6b7280;font-size:13px;">${v.clientAddress || ""}</p></div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <thead><tr style="background:#4f46e5;color:white;"><th style="padding:10px 14px;text-align:left;">Description</th><th style="padding:10px 14px;text-align:center;">Qty</th><th style="padding:10px 14px;text-align:right;">Rate</th><th style="padding:10px 14px;text-align:right;">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="text-align:right;margin-bottom:30px;">
            <p style="margin:4px 0;color:#6b7280;">Subtotal: $${subtotal.toFixed(2)}</p>
            <p style="margin:4px 0;color:#6b7280;">Tax (${v.tax || "0"}%): $${taxAmt.toFixed(2)}</p>
            <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#4f46e5;">Total: $${total.toFixed(2)}</p>
          </div>
          ${v.notes ? `<div style="background:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #4f46e5;"><p style="margin:0;font-weight:600;font-size:13px;color:#4f46e5;">Notes</p><p style="margin:6px 0 0;color:#6b7280;font-size:13px;">${v.notes}</p></div>` : ""}
        </div>
      </body></html>`;
    },
  },
  {
    id: "resume-modern",
    title: "Resume (Modern)",
    description: "Contemporary two-column resume with a professional look.",
    category: "Resumes",
    icon: Briefcase,
    fields: [
      { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
      { key: "title", label: "Professional Title", type: "text", placeholder: "Software Engineer" },
      { key: "email", label: "Email", type: "text", placeholder: "john@example.com" },
      { key: "phone", label: "Phone", type: "text", placeholder: "+1 234 567 8900" },
      { key: "summary", label: "Professional Summary", type: "textarea", placeholder: "Brief overview of your experience..." },
      { key: "experience", label: "Experience (Company | Role | Dates — one per line)", type: "textarea", placeholder: "Acme Corp | Senior Dev | 2020-2023\nStartup Inc | Developer | 2018-2020" },
      { key: "education", label: "Education", type: "textarea", placeholder: "BS Computer Science, MIT, 2018" },
      { key: "skills", label: "Skills (comma-separated)", type: "textarea", placeholder: "JavaScript, React, Node.js, Python" },
    ],
    generateHtml: (v) => {
      const expLines = (v.experience || "").split("\n").filter(Boolean).map(line => {
        const parts = line.split("|").map(s => s.trim());
        return `<div style="margin-bottom:14px;"><p style="margin:0;font-weight:600;font-size:14px;">${parts[1] || ""}</p><p style="margin:2px 0;color:#6366f1;font-size:13px;">${parts[0] || ""}</p><p style="margin:0;color:#9ca3af;font-size:12px;">${parts[2] || ""}</p></div>`;
      }).join("");
      const skills = (v.skills || "").split(",").map(s => s.trim()).filter(Boolean).map(s => `<span style="display:inline-block;background:#eef2ff;color:#4f46e5;padding:4px 12px;border-radius:20px;font-size:12px;margin:3px 4px;">${s}</span>`).join("");
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica,Arial,sans-serif;margin:0;padding:0;color:#1f2937;">
        <div style="max-width:700px;margin:0 auto;">
          <div style="background:#4f46e5;color:white;padding:40px;text-align:center;">
            <h1 style="margin:0;font-size:32px;letter-spacing:1px;">${v.name || "Your Name"}</h1>
            <p style="margin:8px 0 0;font-size:16px;opacity:0.9;">${v.title || "Professional Title"}</p>
            <p style="margin:8px 0 0;font-size:13px;opacity:0.8;">${v.email || ""} ${v.phone ? "• " + v.phone : ""}</p>
          </div>
          <div style="padding:30px 40px;">
            ${v.summary ? `<div style="margin-bottom:24px;"><h3 style="margin:0 0 8px;font-size:15px;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #4f46e5;padding-bottom:6px;">Summary</h3><p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">${v.summary}</p></div>` : ""}
            ${expLines ? `<div style="margin-bottom:24px;"><h3 style="margin:0 0 8px;font-size:15px;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #4f46e5;padding-bottom:6px;">Experience</h3>${expLines}</div>` : ""}
            ${v.education ? `<div style="margin-bottom:24px;"><h3 style="margin:0 0 8px;font-size:15px;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #4f46e5;padding-bottom:6px;">Education</h3><p style="margin:0;color:#6b7280;font-size:13px;">${v.education}</p></div>` : ""}
            ${skills ? `<div><h3 style="margin:0 0 8px;font-size:15px;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #4f46e5;padding-bottom:6px;">Skills</h3><div>${skills}</div></div>` : ""}
          </div>
        </div>
      </body></html>`;
    },
  },
  {
    id: "resume-classic",
    title: "Resume (Classic)",
    description: "Traditional single-column resume with timeless styling.",
    category: "Resumes",
    icon: Briefcase,
    fields: [
      { key: "name", label: "Full Name", type: "text", placeholder: "Jane Smith" },
      { key: "title", label: "Professional Title", type: "text", placeholder: "Marketing Manager" },
      { key: "email", label: "Email", type: "text", placeholder: "jane@example.com" },
      { key: "phone", label: "Phone", type: "text", placeholder: "+1 234 567 8900" },
      { key: "summary", label: "Professional Summary", type: "textarea", placeholder: "Experienced professional with..." },
      { key: "experience", label: "Experience (Company | Role | Dates — one per line)", type: "textarea", placeholder: "Corp Inc | Manager | 2019-Present" },
      { key: "education", label: "Education", type: "textarea", placeholder: "MBA, Harvard Business School, 2019" },
      { key: "skills", label: "Skills (comma-separated)", type: "textarea", placeholder: "Leadership, Strategy, Analytics" },
    ],
    generateHtml: (v) => {
      const expLines = (v.experience || "").split("\n").filter(Boolean).map(line => {
        const parts = line.split("|").map(s => s.trim());
        return `<div style="margin-bottom:12px;padding-left:14px;border-left:3px solid #1f2937;"><p style="margin:0;font-weight:700;font-size:14px;">${parts[1] || ""}</p><p style="margin:2px 0;font-size:13px;color:#374151;">${parts[0] || ""}</p><p style="margin:0;font-size:12px;color:#9ca3af;font-style:italic;">${parts[2] || ""}</p></div>`;
      }).join("");
      const skills = (v.skills || "").split(",").map(s => s.trim()).filter(Boolean).map(s => `<span style="display:inline-block;border:1px solid #d1d5db;padding:4px 12px;border-radius:4px;font-size:12px;margin:3px 4px;color:#374151;">${s}</span>`).join("");
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Georgia,'Times New Roman',serif;margin:0;padding:40px;color:#1f2937;">
        <div style="max-width:700px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #1f2937;padding-bottom:20px;">
            <h1 style="margin:0;font-size:30px;letter-spacing:2px;text-transform:uppercase;">${v.name || "Your Name"}</h1>
            <p style="margin:6px 0 0;font-size:15px;color:#6b7280;">${v.title || "Professional Title"}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">${v.email || ""} ${v.phone ? "| " + v.phone : ""}</p>
          </div>
          ${v.summary ? `<div style="margin-bottom:24px;"><h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#1f2937;">Professional Summary</h3><p style="margin:0;color:#4b5563;font-size:13px;line-height:1.7;">${v.summary}</p></div>` : ""}
          ${expLines ? `<div style="margin-bottom:24px;"><h3 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#1f2937;">Experience</h3>${expLines}</div>` : ""}
          ${v.education ? `<div style="margin-bottom:24px;"><h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#1f2937;">Education</h3><p style="margin:0;color:#4b5563;font-size:13px;">${v.education}</p></div>` : ""}
          ${skills ? `<div><h3 style="margin:0 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#1f2937;">Skills</h3><div>${skills}</div></div>` : ""}
        </div>
      </body></html>`;
    },
  },
  {
    id: "contract-service",
    title: "Contract (Service Agreement)",
    description: "Professional service agreement for consulting and freelance work.",
    category: "Contracts",
    icon: ScrollText,
    fields: [
      { key: "partyA", label: "Service Provider", type: "text", placeholder: "Provider Name / Company" },
      { key: "partyB", label: "Client", type: "text", placeholder: "Client Name / Company" },
      { key: "serviceDescription", label: "Service Description", type: "textarea", placeholder: "Describe the services to be provided..." },
      { key: "term", label: "Term / Duration", type: "text", placeholder: "12 months" },
      { key: "payment", label: "Payment Terms", type: "textarea", placeholder: "$5,000 per month, due on the 1st..." },
      { key: "date", label: "Effective Date", type: "date" },
    ],
    generateHtml: (v) => {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica,Arial,sans-serif;margin:0;padding:40px;color:#1f2937;">
        <div style="max-width:700px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:40px;border-bottom:3px double #1f2937;padding-bottom:20px;">
            <h1 style="margin:0;font-size:26px;text-transform:uppercase;letter-spacing:2px;">Service Agreement</h1>
            <p style="margin:8px 0 0;color:#6b7280;">Effective Date: ${v.date || "___________"}</p>
          </div>
          <div style="margin-bottom:24px;"><h3 style="margin:0 0 8px;font-size:14px;color:#4f46e5;">PARTIES</h3><p style="margin:0;font-size:13px;line-height:1.8;">This Service Agreement is entered into between <strong>${v.partyA || "___________"}</strong> ("Service Provider") and <strong>${v.partyB || "___________"}</strong> ("Client").</p></div>
          <div style="margin-bottom:24px;"><h3 style="margin:0 0 8px;font-size:14px;color:#4f46e5;">SCOPE OF SERVICES</h3><p style="margin:0;font-size:13px;line-height:1.8;">${v.serviceDescription || "___________"}</p></div>
          <div style="margin-bottom:24px;"><h3 style="margin:0 0 8px;font-size:14px;color:#4f46e5;">TERM</h3><p style="margin:0;font-size:13px;line-height:1.8;">This agreement shall remain in effect for a period of <strong>${v.term || "___________"}</strong> from the effective date.</p></div>
          <div style="margin-bottom:24px;"><h3 style="margin:0 0 8px;font-size:14px;color:#4f46e5;">PAYMENT</h3><p style="margin:0;font-size:13px;line-height:1.8;">${v.payment || "___________"}</p></div>
          <div style="margin-top:60px;display:flex;justify-content:space-between;">
            <div style="width:45%;"><div style="border-top:1px solid #1f2937;padding-top:8px;"><p style="margin:0;font-size:13px;font-weight:600;">${v.partyA || "Service Provider"}</p><p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">Signature / Date</p></div></div>
            <div style="width:45%;"><div style="border-top:1px solid #1f2937;padding-top:8px;"><p style="margin:0;font-size:13px;font-weight:600;">${v.partyB || "Client"}</p><p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">Signature / Date</p></div></div>
          </div>
        </div>
      </body></html>`;
    },
  },
  {
    id: "contract-nda",
    title: "Contract (NDA)",
    description: "Non-Disclosure Agreement to protect confidential information.",
    category: "Contracts",
    icon: ScrollText,
    fields: [
      { key: "disclosingParty", label: "Disclosing Party", type: "text", placeholder: "Company / Person name" },
      { key: "receivingParty", label: "Receiving Party", type: "text", placeholder: "Company / Person name" },
      { key: "purpose", label: "Purpose", type: "textarea", placeholder: "Business partnership discussion..." },
      { key: "duration", label: "Duration", type: "text", placeholder: "2 years" },
      { key: "date", label: "Effective Date", type: "date" },
    ],
    generateHtml: (v) => {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica,Arial,sans-serif;margin:0;padding:40px;color:#1f2937;">
        <div style="max-width:700px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:40px;">
            <h1 style="margin:0;font-size:26px;text-transform:uppercase;letter-spacing:2px;color:#dc2626;">Non-Disclosure Agreement</h1>
            <div style="width:60px;height:3px;background:#dc2626;margin:12px auto 0;"></div>
            <p style="margin:12px 0 0;color:#6b7280;">Date: ${v.date || "___________"}</p>
          </div>
          <div style="margin-bottom:20px;background:#fef2f2;padding:16px;border-radius:6px;"><p style="margin:0;font-size:13px;line-height:1.8;">This Non-Disclosure Agreement ("Agreement") is entered into by and between <strong>${v.disclosingParty || "___________"}</strong> ("Disclosing Party") and <strong>${v.receivingParty || "___________"}</strong> ("Receiving Party").</p></div>
          <div style="margin-bottom:20px;"><h3 style="margin:0 0 8px;font-size:14px;color:#dc2626;">1. PURPOSE</h3><p style="margin:0;font-size:13px;line-height:1.8;">${v.purpose || "___________"}</p></div>
          <div style="margin-bottom:20px;"><h3 style="margin:0 0 8px;font-size:14px;color:#dc2626;">2. CONFIDENTIAL INFORMATION</h3><p style="margin:0;font-size:13px;line-height:1.8;">All non-public, proprietary, or confidential information disclosed by the Disclosing Party, whether orally, in writing, or by any other means, shall be considered confidential.</p></div>
          <div style="margin-bottom:20px;"><h3 style="margin:0 0 8px;font-size:14px;color:#dc2626;">3. OBLIGATIONS</h3><p style="margin:0;font-size:13px;line-height:1.8;">The Receiving Party agrees to hold all confidential information in strict confidence and not disclose it to any third party without prior written consent.</p></div>
          <div style="margin-bottom:20px;"><h3 style="margin:0 0 8px;font-size:14px;color:#dc2626;">4. DURATION</h3><p style="margin:0;font-size:13px;line-height:1.8;">This Agreement shall remain in effect for <strong>${v.duration || "___________"}</strong> from the effective date.</p></div>
          <div style="margin-top:60px;display:flex;justify-content:space-between;">
            <div style="width:45%;"><div style="border-top:1px solid #1f2937;padding-top:8px;"><p style="margin:0;font-size:13px;font-weight:600;">${v.disclosingParty || "Disclosing Party"}</p><p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">Signature / Date</p></div></div>
            <div style="width:45%;"><div style="border-top:1px solid #1f2937;padding-top:8px;"><p style="margin:0;font-size:13px;font-weight:600;">${v.receivingParty || "Receiving Party"}</p><p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">Signature / Date</p></div></div>
          </div>
        </div>
      </body></html>`;
    },
  },
  {
    id: "certificate-achievement",
    title: "Certificate (Achievement)",
    description: "Award certificate for recognizing outstanding achievements.",
    category: "Certificates",
    icon: Award,
    fields: [
      { key: "recipientName", label: "Recipient Name", type: "text", placeholder: "John Doe" },
      { key: "achievement", label: "Achievement", type: "textarea", placeholder: "Outstanding performance in..." },
      { key: "organization", label: "Organization", type: "text", placeholder: "Your Organization" },
      { key: "date", label: "Date", type: "date" },
      { key: "signature", label: "Signed By", type: "text", placeholder: "Director's Name" },
    ],
    generateHtml: (v) => {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Georgia,'Times New Roman',serif;margin:0;padding:0;color:#1f2937;">
        <div style="max-width:700px;margin:0 auto;border:8px double #b8860b;padding:50px;text-align:center;background:linear-gradient(135deg,#fffbeb 0%,#ffffff 50%,#fffbeb 100%);">
          <p style="margin:0;font-size:14px;text-transform:uppercase;letter-spacing:4px;color:#b8860b;">Certificate of</p>
          <h1 style="margin:10px 0 20px;font-size:42px;color:#92400e;font-weight:400;">Achievement</h1>
          <div style="width:100px;height:1px;background:#b8860b;margin:0 auto 24px;"></div>
          <p style="margin:0;font-size:14px;color:#6b7280;">This is proudly presented to</p>
          <h2 style="margin:14px 0;font-size:32px;color:#1f2937;font-style:italic;border-bottom:2px solid #b8860b;display:inline-block;padding-bottom:6px;">${v.recipientName || "Recipient Name"}</h2>
          <p style="margin:16px auto;font-size:14px;color:#6b7280;max-width:500px;line-height:1.6;">${v.achievement || "For outstanding achievement"}</p>
          <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">${v.organization || "Organization"}</p>
          <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">${v.date || ""}</p>
          <div style="margin-top:50px;"><div style="border-top:1px solid #b8860b;display:inline-block;padding-top:8px;min-width:200px;"><p style="margin:0;font-size:14px;font-weight:600;">${v.signature || ""}</p><p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Authorized Signature</p></div></div>
        </div>
      </body></html>`;
    },
  },
  {
    id: "certificate-completion",
    title: "Certificate (Completion)",
    description: "Course or program completion certificate for training.",
    category: "Certificates",
    icon: Award,
    fields: [
      { key: "recipientName", label: "Recipient Name", type: "text", placeholder: "Jane Smith" },
      { key: "course", label: "Course / Program", type: "text", placeholder: "Advanced Web Development" },
      { key: "date", label: "Completion Date", type: "date" },
      { key: "instructor", label: "Instructor", type: "text", placeholder: "Dr. James Wilson" },
      { key: "organization", label: "Organization", type: "text", placeholder: "Learning Academy" },
    ],
    generateHtml: (v) => {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica,Arial,sans-serif;margin:0;padding:0;color:#1f2937;">
        <div style="max-width:700px;margin:0 auto;position:relative;padding:50px;text-align:center;">
          <div style="position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899);"></div>
          <div style="position:absolute;bottom:0;left:0;right:0;height:8px;background:linear-gradient(90deg,#3b82f6,#8b5cf6,#ec4899);"></div>
          <p style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:4px;color:#8b5cf6;">Certificate of</p>
          <h1 style="margin:10px 0 24px;font-size:38px;color:#1f2937;font-weight:300;">Completion</h1>
          <p style="margin:0;font-size:14px;color:#6b7280;">This certifies that</p>
          <h2 style="margin:14px 0;font-size:30px;color:#3b82f6;font-weight:600;">${v.recipientName || "Recipient Name"}</h2>
          <p style="margin:0;font-size:14px;color:#6b7280;">has successfully completed</p>
          <h3 style="margin:14px 0;font-size:22px;color:#1f2937;font-weight:600;">${v.course || "Course Name"}</h3>
          <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">${v.date || ""}</p>
          <div style="margin-top:50px;display:flex;justify-content:center;gap:80px;">
            <div><div style="border-top:1px solid #d1d5db;padding-top:8px;min-width:160px;"><p style="margin:0;font-size:13px;font-weight:600;">${v.instructor || ""}</p><p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Instructor</p></div></div>
            <div><div style="border-top:1px solid #d1d5db;padding-top:8px;min-width:160px;"><p style="margin:0;font-size:13px;font-weight:600;">${v.organization || ""}</p><p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Organization</p></div></div>
          </div>
        </div>
      </body></html>`;
    },
  },
];

const categories: Category[] = ["All", "Invoices", "Resumes", "Contracts", "Certificates"];

const categoryColors: Record<string, string> = {
  Invoices: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Resumes: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  Contracts: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Certificates: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
};

export default function PdfTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [items, setItems] = useState<Record<string, string>[]>([{}]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const filteredTemplates = activeCategory === "All"
    ? templates
    : templates.filter(t => t.category === activeCategory);

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormValues({});
    setItems([{}]);
  };

  const updateField = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const updateItem = (index: number, key: string, value: string) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addItem = () => setItems(prev => [...prev, {}]);

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    try {
      const htmlContent = selectedTemplate.items
        ? selectedTemplate.generateHtml(formValues, items)
        : selectedTemplate.generateHtml(formValues);

      const formData = new FormData();
      formData.append("html", htmlContent);
      const response = await pdfFetch("/api/pdf/html-to-pdf", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${selectedTemplate.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast({ title: "PDF Generated!", description: "Your document has been downloaded." });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (selectedTemplate) {
    const Icon = selectedTemplate.icon;
    return (
      <ToolLayout title={selectedTemplate.title} description={selectedTemplate.description}>
        <div className="p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTemplate(null)}
            className="mb-6"
            data-testid="button-back-to-gallery"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>

          <div className="flex flex-col lg:flex-row gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 space-y-5"
            >
              <h3 className="text-lg font-semibold">Fill in the details</h3>
              {selectedTemplate.fields.map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.key}
                      placeholder={field.placeholder}
                      value={formValues[field.key] || ""}
                      onChange={e => updateField(field.key, e.target.value)}
                      rows={3}
                      data-testid={`input-${field.key}`}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formValues[field.key] || ""}
                      onChange={e => updateField(field.key, e.target.value)}
                      data-testid={`input-${field.key}`}
                    />
                  )}
                </div>
              ))}

              {selectedTemplate.items && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button variant="outline" size="sm" onClick={addItem} data-testid="button-add-item">
                      <Plus className="mr-1 h-3 w-3" /> Add Item
                    </Button>
                  </div>
                  {items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 items-end"
                    >
                      {selectedTemplate.items!.keys.map(k => (
                        <div key={k.key} className="flex-1 space-y-1">
                          {idx === 0 && <Label className="text-xs">{k.label}</Label>}
                          <Input
                            type={k.type}
                            placeholder={k.placeholder}
                            value={item[k.key] || ""}
                            onChange={e => updateItem(idx, k.key, e.target.value)}
                            data-testid={`input-item-${k.key}-${idx}`}
                          />
                        </div>
                      ))}
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive"
                          onClick={() => removeItem(idx)}
                          data-testid={`button-remove-item-${idx}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating}
                data-testid="button-generate-pdf"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate PDF
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 hidden lg:flex flex-col items-center justify-center bg-muted/40 rounded-lg p-8 border"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{selectedTemplate.title}</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Fill in the form fields on the left and click "Generate PDF" to create your document.
                </p>
                <Badge className={categoryColors[selectedTemplate.category]}>
                  {selectedTemplate.category}
                </Badge>
              </div>
            </motion.div>
          </div>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="PDF Templates" description="Choose a template, fill in the details, and generate a professional PDF instantly.">
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-8" data-testid="category-tabs">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              data-testid={`tab-${cat.toLowerCase()}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredTemplates.map((template, index) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card
                  className="h-full hover:shadow-md transition-shadow cursor-pointer group"
                  data-testid={`card-template-${template.id}`}
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="secondary" className={categoryColors[template.category]}>
                        {template.category}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-1" data-testid={`text-title-${template.id}`}>
                      {template.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1" data-testid={`text-desc-${template.id}`}>
                      {template.description}
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => selectTemplate(template)}
                      data-testid={`button-use-template-${template.id}`}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </ToolLayout>
  );
}
