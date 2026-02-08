export interface ToolPageData {
  steps: string[];
  faqs: { question: string; answer: string }[];
}

export const toolPageData: Record<string, ToolPageData> = {
  "compress-pdf": {
    steps: [
      "Upload your PDF file by dragging it into the upload area or clicking to browse.",
      "Our engine analyzes and compresses images, fonts, and metadata to reduce file size.",
      "Download your compressed PDF — smaller file, same visual quality."
    ],
    faqs: [
      {
        question: "Will compressing my PDF reduce the quality?",
        answer: "Our compression algorithm is designed to maintain visual quality while significantly reducing file size. Text remains crisp and images are optimized using smart compression that preserves clarity for on-screen viewing and printing."
      },
      {
        question: "How much can I reduce the file size?",
        answer: "Results vary depending on the content. PDFs with large images typically see 50–80% size reduction. Text-heavy documents with few images may see a 10–30% reduction. Scanned documents usually compress the most."
      },
      {
        question: "Is there a file size limit for compression?",
        answer: "Free users can compress PDFs up to 11 MB. Pro users have no file size limits. For very large files, consider splitting the document first and compressing each part separately."
      },
      {
        question: "Can I compress password-protected PDFs?",
        answer: "You will need to remove the password protection before compressing. Use our Unlock PDF tool first, then compress the resulting file."
      }
    ]
  },
  "merge-pdf": {
    steps: [
      "Upload two or more PDF files you want to combine into one document.",
      "Arrange the files in your desired order by dragging and dropping.",
      "Click Merge and download your combined PDF with all pages in order."
    ],
    faqs: [
      {
        question: "Is there a limit to how many PDFs I can merge?",
        answer: "Free users can merge multiple PDF files at once within their 11 MB per-file limit. Pro users have no file size restrictions. Each file must be within the size limit for your plan."
      },
      {
        question: "Will the formatting of my PDFs change after merging?",
        answer: "No. Merging simply combines the pages from each PDF into one file. All formatting, fonts, images, and layouts within each original document remain exactly as they were."
      },
      {
        question: "Can I rearrange the order of pages?",
        answer: "The merge tool combines files in the order you arrange them. If you need to rearrange individual pages within the merged result, use our Organize PDF tool after merging."
      },
      {
        question: "Can I merge PDFs with different page sizes?",
        answer: "Yes. Each page retains its original dimensions. For example, you can merge a letter-size report with an A4 document — both will keep their respective page sizes in the combined file."
      }
    ]
  },
  "split-pdf": {
    steps: [
      "Upload the PDF file you want to split into separate documents.",
      "Choose how to split: by page range, extract specific pages, or split every N pages.",
      "Download your split PDF files individually or as a single ZIP archive."
    ],
    faqs: [
      {
        question: "Can I extract specific pages from a PDF?",
        answer: "Yes. You can specify exact page numbers (e.g., 1, 3, 5) or ranges (e.g., 1–5, 10–15). This lets you pull out exactly the pages you need into a new document."
      },
      {
        question: "Will splitting affect the quality of my PDF?",
        answer: "No. Splitting a PDF is a lossless operation — it simply separates existing pages into new files without re-encoding or compressing any content. Quality remains identical to the original."
      },
      {
        question: "Can I split a password-protected PDF?",
        answer: "You'll need to unlock the PDF first using our Unlock PDF tool, then split the unprotected version. This ensures you have the proper authorization to modify the document."
      }
    ]
  },
  "rotate-pdf": {
    steps: [
      "Upload the PDF file containing pages you want to rotate.",
      "Select which pages to rotate and choose the rotation angle (90°, 180°, or 270°).",
      "Download your PDF with the corrected page orientations."
    ],
    faqs: [
      {
        question: "Can I rotate individual pages instead of the whole document?",
        answer: "Yes. You can select specific pages to rotate while leaving others unchanged. This is useful when scanned documents have a mix of portrait and landscape pages."
      },
      {
        question: "What rotation angles are supported?",
        answer: "You can rotate pages by 90° clockwise, 90° counter-clockwise (270°), or 180°. This covers all common orientation corrections needed for scanned or misaligned documents."
      },
      {
        question: "Will rotating pages affect text or image quality?",
        answer: "No. Rotation is a metadata-level change that instructs the PDF viewer to display the page at a different angle. The actual content is not re-rendered or compressed, so quality stays the same."
      }
    ]
  },
  "pdf-to-word": {
    steps: [
      "Upload the PDF you want to convert to a Word document.",
      "Our converter extracts text, images, and formatting to build an editable .docx file.",
      "Download the Word document and open it in Microsoft Word, Google Docs, or any compatible editor."
    ],
    faqs: [
      {
        question: "Will the formatting be preserved exactly?",
        answer: "We do our best to match the original layout, fonts, and styling. Simple documents convert with high fidelity. Complex layouts with columns, tables, and custom fonts may require minor manual adjustments in Word."
      },
      {
        question: "Can I convert scanned PDFs to editable Word documents?",
        answer: "Scanned PDFs contain images of text rather than actual text. For best results with scanned documents, use our OCR PDF tool first to extract the text, then convert the resulting PDF to Word."
      },
      {
        question: "What about embedded fonts?",
        answer: "If the PDF uses standard fonts, they'll map directly to your system fonts. Custom or embedded fonts are substituted with the closest available match. You may need to install specific fonts if exact matching is required."
      },
      {
        question: "Is there a page limit for conversion?",
        answer: "Free users can convert PDFs up to 40 pages. Pro users enjoy unlimited page counts. For very large documents, processing may take a bit longer but the quality remains consistent."
      }
    ]
  },
  "pdf-to-jpg": {
    steps: [
      "Upload the PDF you want to convert to JPG images.",
      "Each page is rendered as a high-quality JPG image.",
      "Download all images as a ZIP file or individually."
    ],
    faqs: [
      {
        question: "What resolution are the output images?",
        answer: "Pages are rendered at 150 DPI by default, which provides a good balance between quality and file size. This is suitable for on-screen viewing, presentations, and web use."
      },
      {
        question: "Can I convert only specific pages to JPG?",
        answer: "The tool converts all pages in the uploaded PDF. If you only need specific pages, use our Split PDF tool first to extract the pages you want, then convert them to JPG."
      },
      {
        question: "Why JPG instead of PNG?",
        answer: "JPG files are significantly smaller than PNG, making them ideal for sharing and web use. If you need lossless quality or transparency support, check out our PDF to PNG tool instead."
      }
    ]
  },
  "jpg-to-pdf": {
    steps: [
      "Upload one or more JPG images you want to convert to PDF.",
      "Images are placed on individual pages and assembled into a single PDF.",
      "Download your new PDF file with all images included."
    ],
    faqs: [
      {
        question: "Can I convert multiple images into one PDF?",
        answer: "Yes. Upload multiple JPG files and they will be combined into a single PDF, with each image on its own page. The pages appear in the order you upload them."
      },
      {
        question: "Will the image quality be reduced?",
        answer: "No. Images are embedded into the PDF at their original resolution and quality. There is no additional compression applied during the conversion process."
      },
      {
        question: "What image formats are supported besides JPG?",
        answer: "This tool is optimized for JPG/JPEG images. For PNG files, use our PNG to PDF tool. We also support BMP to PDF conversion with a dedicated tool."
      },
      {
        question: "Can I set the page size for the output PDF?",
        answer: "Each page is automatically sized to match the dimensions of the corresponding image. This ensures no cropping or stretching occurs during conversion."
      }
    ]
  },
  "word-to-pdf": {
    steps: [
      "Upload your Word document (.doc or .docx) for conversion.",
      "Our converter processes the document, preserving formatting, images, and fonts.",
      "Download the resulting PDF, ready for sharing or printing."
    ],
    faqs: [
      {
        question: "Will my document look the same as it does in Word?",
        answer: "The converter preserves text formatting, images, tables, headers, footers, and page layout. Minor differences may occur with very specialized Word features like macros or ActiveX controls, which don't apply to PDFs."
      },
      {
        question: "Are hyperlinks preserved in the PDF?",
        answer: "Yes. Clickable links, table of contents links, and cross-references in your Word document are preserved as active hyperlinks in the resulting PDF."
      },
      {
        question: "Can I convert older .doc files?",
        answer: "Yes, both .doc (legacy Word format) and .docx (modern format) files are supported. The converter handles both formats and produces a standards-compliant PDF."
      }
    ]
  },
  "watermark-pdf": {
    steps: [
      "Upload the PDF you want to watermark.",
      "Enter your watermark text (e.g., 'CONFIDENTIAL', 'DRAFT', or your company name).",
      "Download the watermarked PDF with your text applied across all pages."
    ],
    faqs: [
      {
        question: "Can I customize the watermark appearance?",
        answer: "The watermark is applied as semi-transparent diagonal text across each page. This standard style ensures the watermark is visible without obscuring the document content."
      },
      {
        question: "Will the watermark appear on every page?",
        answer: "Yes, the watermark is applied consistently across all pages in the document. This ensures complete coverage for confidential or draft documents."
      },
      {
        question: "Can the watermark be removed later?",
        answer: "Watermarks added by this tool are embedded into the PDF content. They cannot be easily removed with standard PDF viewers. For temporary watermarks, consider keeping a copy of the original unwatermarked file."
      },
      {
        question: "Does watermarking increase the file size?",
        answer: "The increase is minimal — typically less than 1% of the original file size. Watermarks are rendered as vector text, which takes very little space compared to images."
      }
    ]
  },
  "protect-pdf": {
    steps: [
      "Upload the PDF you want to password-protect.",
      "Set a strong password that recipients will need to open the file.",
      "Download your encrypted PDF — only people with the password can view it."
    ],
    faqs: [
      {
        question: "How secure is the password protection?",
        answer: "We use AES-256 encryption, which is the industry standard for document security. Choose a strong password with a mix of letters, numbers, and special characters for maximum protection."
      },
      {
        question: "Can I set different permissions (e.g., prevent printing)?",
        answer: "The tool applies full open-password protection, meaning the entire document is encrypted. Anyone with the password gets full access. For granular permissions, consider using professional PDF software."
      },
      {
        question: "What happens if I forget the password?",
        answer: "There is no way to recover a forgotten password. The encryption is designed to be unbreakable without the correct password. Always store your passwords securely and keep a backup of the unprotected original."
      }
    ]
  },
  "unlock-pdf": {
    steps: [
      "Upload the password-protected PDF you want to unlock.",
      "Enter the current password for the document.",
      "Download the unlocked PDF with password protection removed."
    ],
    faqs: [
      {
        question: "Can I unlock a PDF without knowing the password?",
        answer: "No. You must provide the correct password to unlock the document. This tool removes the password requirement from the file so it can be opened freely in the future, but the original password is needed to authorize this."
      },
      {
        question: "Will unlocking change the content of my PDF?",
        answer: "No. Unlocking simply removes the encryption layer. All text, images, formatting, and other content remain exactly as they were in the original document."
      },
      {
        question: "Is it legal to unlock a PDF?",
        answer: "Unlocking PDFs you own or have authorization to access is perfectly legal. This tool is designed for legitimate use cases like removing forgotten passwords from your own documents or preparing files for editing."
      }
    ]
  },
  "ocr-pdf": {
    steps: [
      "Upload a scanned PDF or image-based PDF that contains text you need to extract.",
      "Our OCR engine analyzes the document and recognizes text in the images.",
      "Download the searchable PDF with an invisible text layer, making it fully searchable and selectable."
    ],
    faqs: [
      {
        question: "How accurate is the OCR recognition?",
        answer: "Our OCR engine typically achieves 95–99% accuracy on clearly scanned documents with standard fonts. Accuracy depends on scan quality, font clarity, and language. Higher resolution scans (300 DPI+) produce the best results."
      },
      {
        question: "What languages are supported?",
        answer: "The OCR engine supports English and most Latin-alphabet languages. For documents in other scripts, accuracy may vary. Ensure the document is clearly scanned for the best recognition results."
      },
      {
        question: "Will OCR change the appearance of my document?",
        answer: "No. The original scanned images remain visually unchanged. OCR adds an invisible text layer behind the images, allowing you to search, select, and copy text without altering the document's appearance."
      },
      {
        question: "Can I OCR a multi-page document?",
        answer: "Yes. All pages in the uploaded PDF are processed. Processing time increases with the number of pages — expect roughly 2–5 seconds per page depending on complexity."
      }
    ]
  },
  "extract-text": {
    steps: [
      "Upload the PDF from which you want to extract text content.",
      "Our engine reads all text elements from every page of the document.",
      "Download the extracted text as a plain text file."
    ],
    faqs: [
      {
        question: "Can I extract text from scanned PDFs?",
        answer: "This tool works best with digitally created PDFs that contain actual text data. For scanned documents or image-based PDFs, use our OCR PDF tool first to recognize the text, then extract it."
      },
      {
        question: "Is the text formatting preserved?",
        answer: "The output is plain text, so visual formatting like bold, italic, and colors is not preserved. However, paragraph structure and reading order are maintained as closely as possible."
      },
      {
        question: "Can I extract text from specific pages only?",
        answer: "The tool extracts text from all pages. If you only need text from certain pages, use our Split PDF tool first to isolate those pages, then extract text from the smaller file."
      }
    ]
  },
  "extract-images": {
    steps: [
      "Upload the PDF containing images you want to extract.",
      "Our engine scans every page and identifies all embedded images.",
      "Download the extracted images as individual files in a ZIP archive."
    ],
    faqs: [
      {
        question: "What image formats are extracted?",
        answer: "Images are extracted in their original embedded format when possible (typically JPG or PNG). This ensures you get the highest quality version of each image without any re-compression."
      },
      {
        question: "Will background images and logos be extracted too?",
        answer: "Yes. The tool extracts all embedded image objects from the PDF, including logos, photos, charts, and background images. Very small decorative elements may also be included."
      },
      {
        question: "Can I extract images from a specific page?",
        answer: "The tool processes all pages in the document. To extract images from specific pages, first use our Split PDF tool to isolate those pages, then extract images from the resulting file."
      }
    ]
  },
  "repair-pdf": {
    steps: [
      "Upload the corrupted or damaged PDF file you need to repair.",
      "Our repair engine analyzes the file structure and fixes common issues like broken cross-references and invalid objects.",
      "Download the repaired PDF, ready to open in any standard PDF viewer."
    ],
    faqs: [
      {
        question: "What types of PDF damage can be repaired?",
        answer: "The tool can fix broken cross-reference tables, corrupted object streams, missing page trees, and invalid metadata. These are the most common causes of 'unable to open' or 'file is damaged' errors."
      },
      {
        question: "Is data loss possible during repair?",
        answer: "The repair process attempts to preserve all content. In cases of severe corruption, some elements (like annotations or bookmarks) may not be recoverable, but the core text and images are prioritized."
      },
      {
        question: "What if the repair doesn't work?",
        answer: "Severely corrupted files where large portions of data are missing or overwritten may not be fully recoverable. In such cases, try to obtain a fresh copy of the original file or restore from a backup."
      }
    ]
  },
  "flatten-pdf": {
    steps: [
      "Upload the PDF containing form fields, annotations, or layers you want to flatten.",
      "The tool merges all interactive elements into the static page content.",
      "Download the flattened PDF — all form fields and annotations are now permanent and uneditable."
    ],
    faqs: [
      {
        question: "What does flattening a PDF mean?",
        answer: "Flattening converts interactive elements like fillable form fields, comments, annotations, and layers into static content that becomes part of the page itself. The visual appearance stays the same, but the elements can no longer be edited."
      },
      {
        question: "Why would I want to flatten a PDF?",
        answer: "Common reasons include: preparing forms for archival after they've been filled out, ensuring annotations are permanently visible, preventing further edits to submitted documents, and fixing display issues in certain PDF viewers."
      },
      {
        question: "Can I unflatten a PDF after flattening?",
        answer: "No. Flattening is a one-way operation. Once interactive elements are merged into the page content, they cannot be separated back into editable fields. Always keep a copy of the original if you may need to edit it later."
      },
      {
        question: "Will flattening change how the PDF looks?",
        answer: "No. The visual appearance remains identical. The only difference is that previously interactive elements (form fields, annotations) become static parts of the page and can no longer be clicked or edited."
      }
    ]
  }
};
