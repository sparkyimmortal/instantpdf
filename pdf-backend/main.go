package main

import (
        "archive/zip"
        "bytes"
        "context"
        "encoding/base64"
        "encoding/binary"
        "encoding/json"
        "fmt"
        "hash/crc32"
        "io"
        "log"
        "mime/multipart"
        "net/http"
        "os"
        "os/exec"
        "path/filepath"
        "sort"
        "strconv"
        "strings"
        "time"

        "github.com/google/uuid"
)

var baseWorkDir = "./work"  // Will be converted to absolute path in main()

const defaultFilename = "output.pdf"

type downloadResponse struct {
        DownloadURL string `json:"downloadUrl"`
}

type previewPage struct {
        PageNumber int    `json:"pageNumber"`
        ImageURL   string `json:"imageUrl"`
}

type previewResponse struct {
        Pages []previewPage `json:"pages"`
}

func main() {
        // Convert baseWorkDir to absolute path
        absWorkDir, err := filepath.Abs(baseWorkDir)
        if err != nil {
                log.Fatalf("failed to get absolute path for work dir: %v", err)
        }
        baseWorkDir = absWorkDir
        
        if err := os.MkdirAll(baseWorkDir, 0o755); err != nil {
                log.Fatalf("failed to create work dir: %v", err)
        }

        mux := http.NewServeMux()

        mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
                w.WriteHeader(http.StatusOK)
                _, _ = w.Write([]byte("ok"))
        })

        // Backwards-compatible routes:
        mux.HandleFunc("/pdf/merge", handleMerge)
        mux.HandleFunc("/pdf/split", handleSplit)
        mux.HandleFunc("/pdf/remove-pages", handleRemovePages)
        mux.HandleFunc("/pdf/extract-pages", handleExtractPages)
        mux.HandleFunc("/pdf/compress", handleCompress)
        mux.HandleFunc("/pdf/repair", handleRepair)
        mux.HandleFunc("/pdf/ocr", handleOCR)
        mux.HandleFunc("/pdf/convert-to-pdfa", handleConvertToPDFA)
        mux.HandleFunc("/pdf/image-to-pdf", handleImageToPDF)
        mux.HandleFunc("/pdf/word-to-pdf", handleWordToPDF)
        mux.HandleFunc("/pdf/preview", handlePreview)
        mux.HandleFunc("/pdf/organize", handleOrganize)
        mux.HandleFunc("/pdf/rotate", handleRotate)
        mux.HandleFunc("/pdf/crop", handleCrop)
        mux.HandleFunc("/pdf/page-numbers", handlePageNumbers)
        mux.HandleFunc("/pdf/watermark", handleWatermark)

        // Preferred API base for the frontend: VITE_PDF_API_BASE_URL="/api/pdf"
        mux.HandleFunc("/api/pdf/merge", handleMerge)
        mux.HandleFunc("/api/pdf/split", handleSplit)
        mux.HandleFunc("/api/pdf/remove-pages", handleRemovePages)
        mux.HandleFunc("/api/pdf/extract-pages", handleExtractPages)
        mux.HandleFunc("/api/pdf/compress", handleCompress)
        mux.HandleFunc("/api/pdf/repair", handleRepair)
        mux.HandleFunc("/api/pdf/ocr", handleOCR)
        mux.HandleFunc("/api/pdf/convert-to-pdfa", handleConvertToPDFA)
        mux.HandleFunc("/api/pdf/image-to-pdf", handleImageToPDF)
        mux.HandleFunc("/api/pdf/word-to-pdf", handleWordToPDF)
        mux.HandleFunc("/api/pdf/preview", handlePreview)
        mux.HandleFunc("/api/pdf/organize", handleOrganize)
        mux.HandleFunc("/api/pdf/rotate", handleRotate)
        mux.HandleFunc("/api/pdf/crop", handleCrop)
        mux.HandleFunc("/api/pdf/page-numbers", handlePageNumbers)
        mux.HandleFunc("/api/pdf/watermark", handleWatermark)

        // PDF Security Tools
        mux.HandleFunc("/api/pdf/protect", handleProtectPDF)
        mux.HandleFunc("/pdf/protect", handleProtectPDF)
        mux.HandleFunc("/api/pdf/unlock", handleUnlockPDF)
        mux.HandleFunc("/pdf/unlock", handleUnlockPDF)
        mux.HandleFunc("/api/pdf/redact", handleRedactPDF)
        mux.HandleFunc("/pdf/redact", handleRedactPDF)
        mux.HandleFunc("/api/pdf/flatten", handleFlattenPDF)
        mux.HandleFunc("/pdf/flatten", handleFlattenPDF)

        // PDF Conversion Tools
        mux.HandleFunc("/api/pdf/pdf-to-word", handlePDFToWord)
        mux.HandleFunc("/pdf/pdf-to-word", handlePDFToWord)
        mux.HandleFunc("/api/pdf/pdf-to-excel", handlePDFToExcel)
        mux.HandleFunc("/pdf/pdf-to-excel", handlePDFToExcel)
        mux.HandleFunc("/api/pdf/pdf-to-powerpoint", handlePDFToPowerPoint)
        mux.HandleFunc("/pdf/pdf-to-powerpoint", handlePDFToPowerPoint)
        mux.HandleFunc("/api/pdf/pdf-to-jpg", handlePDFToJPG)
        mux.HandleFunc("/pdf/pdf-to-jpg", handlePDFToJPG)
        mux.HandleFunc("/api/pdf/extract-text", handleExtractText)
        mux.HandleFunc("/pdf/extract-text", handleExtractText)
        mux.HandleFunc("/api/pdf/extract-images", handleExtractImages)
        mux.HandleFunc("/pdf/extract-images", handleExtractImages)
        mux.HandleFunc("/api/pdf/html-to-pdf", handleHTMLToPDF)
        mux.HandleFunc("/pdf/html-to-pdf", handleHTMLToPDF)
        mux.HandleFunc("/api/pdf/excel-to-pdf", handleExcelToPDF)
        mux.HandleFunc("/pdf/excel-to-pdf", handleExcelToPDF)
        mux.HandleFunc("/api/pdf/powerpoint-to-pdf", handlePowerPointToPDF)
        mux.HandleFunc("/pdf/powerpoint-to-pdf", handlePowerPointToPDF)

        // Advanced PDF Tools
        mux.HandleFunc("/api/pdf/compare", handleComparePDFs)
        mux.HandleFunc("/pdf/compare", handleComparePDFs)
        mux.HandleFunc("/api/pdf/digital-signature", handleDigitalSignature)
        mux.HandleFunc("/pdf/digital-signature", handleDigitalSignature)
        mux.HandleFunc("/api/pdf/sign", handleSignPDF)
        mux.HandleFunc("/pdf/sign", handleSignPDF)
        mux.HandleFunc("/api/pdf/add-text", handleAddTextAnnotation)
        mux.HandleFunc("/pdf/add-text", handleAddTextAnnotation)
        mux.HandleFunc("/api/pdf/edit", handleEditPDF)
        mux.HandleFunc("/pdf/edit", handleEditPDF)
        mux.HandleFunc("/api/pdf/validate-pdfa", handleValidatePDFA)
        mux.HandleFunc("/pdf/validate-pdfa", handleValidatePDFA)
        mux.HandleFunc("/api/pdf/pdf-to-html", handlePDFToHTML)
        mux.HandleFunc("/pdf/pdf-to-html", handlePDFToHTML)
        mux.HandleFunc("/api/pdf/add-header-footer", handleHeaderFooter)
        mux.HandleFunc("/pdf/add-header-footer", handleHeaderFooter)

        mux.HandleFunc("/api/pdf/png-to-pdf", handlePNGToPDF)
        mux.HandleFunc("/pdf/png-to-pdf", handlePNGToPDF)
        mux.HandleFunc("/api/pdf/pdf-to-png", handlePDFToPNG)
        mux.HandleFunc("/pdf/pdf-to-png", handlePDFToPNG)
        mux.HandleFunc("/api/pdf/pdf-to-tiff", handlePDFToTIFF)
        mux.HandleFunc("/pdf/pdf-to-tiff", handlePDFToTIFF)
        mux.HandleFunc("/api/pdf/bmp-to-pdf", handleBMPToPDF)
        mux.HandleFunc("/pdf/bmp-to-pdf", handleBMPToPDF)

        mux.HandleFunc("/api/pdf/encrypt-pdf", handleEncryptPDF)
        mux.HandleFunc("/pdf/encrypt-pdf", handleEncryptPDF)

        mux.HandleFunc("/api/pdf/metadata", handleMetadataEditor)
        mux.HandleFunc("/pdf/metadata", handleMetadataEditor)
        mux.HandleFunc("/api/pdf/bookmarks", handleBookmarksEditor)
        mux.HandleFunc("/pdf/bookmarks", handleBookmarksEditor)
        mux.HandleFunc("/api/pdf/batch", handleBatchProcess)
        mux.HandleFunc("/pdf/batch", handleBatchProcess)
        mux.HandleFunc("/api/pdf/form-fill", handleFormFill)
        mux.HandleFunc("/pdf/form-fill", handleFormFill)

        mux.HandleFunc("/api/pdf/markdown-to-pdf", handleMarkdownToPDF)
        mux.HandleFunc("/pdf/markdown-to-pdf", handleMarkdownToPDF)
        mux.HandleFunc("/api/pdf/url-to-pdf", handleURLToPDF)
        mux.HandleFunc("/pdf/url-to-pdf", handleURLToPDF)

        mux.HandleFunc("/downloads/", serveDownload)
        mux.HandleFunc("/api/pdf/downloads/", serveDownload)
        mux.HandleFunc("/previews/", servePreview)
        mux.HandleFunc("/api/pdf/previews/", servePreview)

        // Simple background cleanup for old jobs.
        go func() {
                ticker := time.NewTicker(30 * time.Minute)
                defer ticker.Stop()
                for range ticker.C {
                        cleanupOldJobs(2 * time.Hour) // adjust retention as needed
                }
        }()

        addr := ":8080"
        log.Printf("PDF backend listening on %s", addr)
        if err := http.ListenAndServe(addr, mux); err != nil {
                log.Fatalf("server error: %v", err)
        }
}

func parseIntDefault(s string, def int) int {
        s = strings.TrimSpace(s)
        if s == "" {
                return def
        }
        n, err := strconv.Atoi(s)
        if err != nil {
                return def
        }
        return n
}

func parseFloatDefault(s string, def float64) float64 {
        s = strings.TrimSpace(s)
        if s == "" {
                return def
        }
        f, err := strconv.ParseFloat(s, 64)
        if err != nil {
                return def
        }
        return f
}

func sanitizeFilename(name string) string {
        name = filepath.Base(strings.TrimSpace(name))
        // Replace path separators just in case.
        name = strings.ReplaceAll(name, "/", "_")
        name = strings.ReplaceAll(name, "\\", "_")
        name = strings.TrimSpace(name)
        if name == "" {
                return "file"
        }
        return name
}

func baseNameWithoutExt(filename string) string {
        filename = sanitizeFilename(filename)
        return strings.TrimSuffix(filename, filepath.Ext(filename))
}

// buildOutputName creates a smart output filename based on original name and operation
func buildOutputName(originalName, operation string) string {
        base := baseNameWithoutExt(originalName)
        if base == "" || base == "input" || base == "file" {
                base = "output"
        }
        return fmt.Sprintf("%s_%s.pdf", base, operation)
}

// appendPNGTextChunk adds a tEXt chunk to a PNG to make it unique
// This prevents pdfcpu from de-duplicating identical images at different positions
func appendPNGTextChunk(pngData []byte, keyword, text string) []byte {
        // PNG structure: signature (8 bytes) + chunks
        // Each chunk: length (4 bytes) + type (4 bytes) + data (length bytes) + CRC (4 bytes)
        // We need to insert a tEXt chunk before IEND

        if len(pngData) < 12 {
                return pngData
        }

        // Find IEND chunk (should be at the end)
        // IEND is the last 12 bytes: length(0) + "IEND" + CRC
        iendPos := len(pngData) - 12
        if iendPos < 8 {
                return pngData
        }

        // Create tEXt chunk: keyword + null + text
        textData := append([]byte(keyword), 0)
        textData = append(textData, []byte(text)...)

        // Calculate CRC for tEXt chunk
        chunkType := []byte("tEXt")
        crcData := append(chunkType, textData...)
        crc := crc32.ChecksumIEEE(crcData)

        // Build the chunk
        var chunk bytes.Buffer
        binary.Write(&chunk, binary.BigEndian, uint32(len(textData)))
        chunk.Write(chunkType)
        chunk.Write(textData)
        binary.Write(&chunk, binary.BigEndian, crc)

        // Insert before IEND
        result := make([]byte, 0, len(pngData)+chunk.Len())
        result = append(result, pngData[:iendPos]...)
        result = append(result, chunk.Bytes()...)
        result = append(result, pngData[iendPos:]...)

        return result
}

func pageCountPoppler(dir, inPath string) (int, error) {
        // Uses poppler-utils (pdfinfo), which is already a required dependency for previews.
        out, err := runCommandOutput(dir, "pdfinfo", inPath)
        if err != nil {
                return 0, fmt.Errorf("pdfinfo failed: %w", err)
        }
        for _, line := range strings.Split(out, "\n") {
                trim := strings.TrimSpace(line)
                if strings.HasPrefix(trim, "Pages:") {
                        parts := strings.Fields(trim)
                        if len(parts) >= 2 {
                                n, err := strconv.Atoi(parts[len(parts)-1])
                                if err == nil && n > 0 {
                                        return n, nil
                                }
                        }
                }
        }
        return 0, fmt.Errorf("could not parse page count")
}

func pageCountPDF(dir, inPath string) (int, error) {
        out, err := runCommandOutput(dir, "pdfcpu", "info", inPath)
        if err != nil {
                return 0, fmt.Errorf("pdfcpu info failed: %w", err)
        }
        // Typical line: "Pages:             12"
        for _, line := range strings.Split(out, "\n") {
                if strings.HasPrefix(strings.TrimSpace(line), "Pages:") {
                        parts := strings.Fields(line)
                        // Fields: [Pages: 12]
                        if len(parts) >= 2 {
                                n, err := strconv.Atoi(parts[len(parts)-1])
                                if err == nil {
                                        return n, nil
                                }
                        }
                }
        }
        return 0, fmt.Errorf("could not parse page count")
}

func handleRotate(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        degrees := parseIntDefault(r.FormValue("degrees"), 90)
        if degrees != 90 && degrees != 180 && degrees != 270 {
                errorJSON(w, http.StatusBadRequest, "degrees must be 90, 180, or 270")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        outName := buildOutputName(header.Filename, "rotated")
        outPath := filepath.Join(dir, outName)

        if err := runCommand(dir, "pdfcpu", "rotate", inPath, strconv.Itoa(degrees), outPath); err != nil {
                log.Printf("rotate error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to rotate PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleCrop(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        desc := strings.TrimSpace(r.FormValue("description"))
        unit := strings.TrimSpace(r.FormValue("unit"))
        if unit == "" {
                unit = "po"
        }
        
        // Parse margin values from form
        marginLeft := parseIntDefault(r.FormValue("marginLeft"), 0)
        marginRight := parseIntDefault(r.FormValue("marginRight"), 0)
        marginTop := parseIntDefault(r.FormValue("marginTop"), 0)
        marginBottom := parseIntDefault(r.FormValue("marginBottom"), 0)

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        outName := buildOutputName(header.Filename, "cropped")
        outPath := filepath.Join(dir, outName)

        // Use margin-based cropping if margins are specified
        var cropDesc string
        if marginLeft > 0 || marginRight > 0 || marginTop > 0 || marginBottom > 0 {
                // pdfcpu crop format: "left bottom right top" (margins to remove)
                cropDesc = fmt.Sprintf("%d %d %d %d", marginLeft, marginBottom, marginRight, marginTop)
        } else if desc != "" {
                cropDesc = desc
        } else {
                // Default small margin crop
                cropDesc = "10 10 10 10"
        }

        args := []string{"crop", "-u", unit, "--", cropDesc, inPath, outPath}
        if err := runCommand(dir, "pdfcpu", args...); err != nil {
                log.Printf("crop error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to crop PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handlePageNumbers(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        pos := strings.TrimSpace(r.FormValue("position"))
        if pos == "" {
                pos = "bc"
        }
        fontSize := parseIntDefault(r.FormValue("fontSize"), 10)
        if fontSize < 6 {
                fontSize = 6
        }
        if fontSize > 72 {
                fontSize = 72
        }
        opacity := parseFloatDefault(r.FormValue("opacity"), 0.95)
        if opacity < 0 {
                opacity = 0
        }
        if opacity > 1 {
                opacity = 1
        }
        startAt := parseIntDefault(r.FormValue("startAt"), 1)
        if startAt < 1 {
                startAt = 1
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        // iLovePDF-style robustness:
        // Avoid repeatedly stamping the same PDF in-place (pdfcpu may stack stamp resources).
        // Instead:
        // 1) extract pages into single-page PDFs
        // 2) stamp each single-page PDF once
        // 3) merge back into a clean output PDF

        total, err := pageCountPDF(dir, inPath)
        if err != nil {
                // Try poppler-based page count as fallback
                total, err = pageCountPoppler(dir, inPath)
                if err != nil {
                        log.Printf("page numbers: page count error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to read page count")
                        return
                }
        }

        pagesDir := filepath.Join(dir, "pages")
        if err := os.MkdirAll(pagesDir, 0o755); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create pages dir")
                return
        }

        if err := runCommand(dir, "pdfcpu", "extract", "-mode", "page", inPath, pagesDir); err != nil {
                log.Printf("page numbers: extract pages error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to prepare pages")
                return
        }

        // Parse margin parameter for better positioning
        marginStr := strings.TrimSpace(r.FormValue("margin"))
        marginOffset := 20 // default recommended margin in points
        if marginStr == "small" {
                marginOffset = 10
        } else if marginStr == "large" {
                marginOffset = 40
        }
        
        // Calculate vertical offset based on position
        // For bottom positions, offset is positive (move up from edge)
        // For top positions, offset is negative (move down from edge)
        yOffset := marginOffset
        if strings.HasPrefix(pos, "t") {
                yOffset = -marginOffset
        }
        
        // Make stamping deterministic (no default relative scale / diagonal).
        // - scale:1 abs => exact font size in points
        // - rot:0 => no diagonal behavior
        // - fillc => readable neutral gray
        // - off: x y for offset from anchor position
        desc := fmt.Sprintf("pos:%s, off:0 %d, points:%d, scale:1 abs, rot:0, op:%.2f, fillc:.15 .15 .15", pos, yOffset, fontSize, opacity)

        stamped := make([]string, 0, total)
        for i := 1; i <= total; i++ {
                // pdfcpu extract uses pattern: {originalFileName}_page_{i}.pdf
                // e.g., input_page_1.pdf, input_page_2.pdf
                pagePath := filepath.Join(pagesDir, fmt.Sprintf("input_page_%d.pdf", i))
                if _, err := os.Stat(pagePath); err != nil {
                        // Fallback to other naming conventions
                        alt := filepath.Join(pagesDir, fmt.Sprintf("page_%d.pdf", i))
                        if _, err2 := os.Stat(alt); err2 == nil {
                                pagePath = alt
                        } else {
                                // Try scanning directory for any file ending with _page_{i}.pdf
                                files, _ := filepath.Glob(filepath.Join(pagesDir, fmt.Sprintf("*_page_%d.pdf", i)))
                                if len(files) > 0 {
                                        pagePath = files[0]
                                }
                        }
                }

                label := fmt.Sprintf("%d", startAt+(i-1))
                outPage := filepath.Join(dir, fmt.Sprintf("stamped-%04d.pdf", i))
                if err := runCommand(dir, "pdfcpu", "stamp", "add", "-mode", "text", "--", label, desc, pagePath, outPage); err != nil {
                        log.Printf("page numbers: stamp error (page=%d): %v", i, err)
                        errorJSON(w, http.StatusInternalServerError, "failed to add page numbers")
                        return
                }
                stamped = append(stamped, outPage)
        }

        outName := buildOutputName(header.Filename, "numbered")
        outPath := filepath.Join(dir, outName)
        args := append([]string{"merge", outPath}, stamped...)
        if err := runCommand(dir, "pdfcpu", args...); err != nil {
                log.Printf("page numbers: merge error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to write output")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleWatermark(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        text := strings.TrimSpace(r.FormValue("text"))
        if text == "" {
                errorJSON(w, http.StatusBadRequest, "text is required")
                return
        }

        rot := parseIntDefault(r.FormValue("rotation"), 45)
        fontSize := 48
        opacity := parseFloatDefault(r.FormValue("opacity"), 0.25)
        if opacity < 0 {
                opacity = 0
        }
        if opacity > 1 {
                opacity = 1
        }
        layer := strings.TrimSpace(r.FormValue("layer"))
        fromPage := parseIntDefault(r.FormValue("fromPage"), 1)
        toPage := parseIntDefault(r.FormValue("toPage"), 0)

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        outName := buildOutputName(header.Filename, "watermarked")
        outPath := filepath.Join(dir, outName)

        // Build page selection string if specified
        pageSelection := ""
        if fromPage > 0 || toPage > 0 {
                total, _ := pageCountPoppler(dir, inPath)
                if toPage <= 0 || toPage > total {
                        toPage = total
                }
                if fromPage < 1 {
                        fromPage = 1
                }
                if fromPage <= toPage {
                        pageSelection = fmt.Sprintf("%d-%d", fromPage, toPage)
                }
        }

        // Use stamp (foreground) or watermark (background) based on layer setting
        // pos:c for center, scale:1 for readable size
        // Note: pdfcpu rotation is counterclockwise, so we negate for intuitive behavior
        actualRot := -rot
        
        // Parse color parameter - format: "r,g,b" values from 0-255 or hex
        color := strings.TrimSpace(r.FormValue("color"))
        colorDesc := "fillc:.5 .5 .5" // Default gray
        if color != "" {
                // Convert hex color like "#ff0000" or "ff0000" to RGB fractions
                color = strings.TrimPrefix(color, "#")
                if len(color) == 6 {
                        rVal, _ := strconv.ParseInt(color[0:2], 16, 64)
                        gVal, _ := strconv.ParseInt(color[2:4], 16, 64)
                        bVal, _ := strconv.ParseInt(color[4:6], 16, 64)
                        colorDesc = fmt.Sprintf("fillc:%.2f %.2f %.2f", float64(rVal)/255.0, float64(gVal)/255.0, float64(bVal)/255.0)
                }
        }
        
        desc := fmt.Sprintf("pos:c, rot:%d, points:%d, scale:1 abs, op:%.2f, %s", actualRot, fontSize, opacity, colorDesc)
        
        var args []string
        if layer == "over" {
                args = []string{"stamp", "add", "-mode", "text"}
        } else {
                // Use watermark with onTop:false to ensure it's behind content
                args = []string{"watermark", "add", "-mode", "text"}
        }
        
        if pageSelection != "" {
                args = append(args, "-pages", pageSelection)
        }
        args = append(args, "--", text, desc, inPath, outPath)

        if err := runCommand(dir, "pdfcpu", args...); err != nil {
                log.Printf("watermark error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to add watermark")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleHeaderFooter(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        headerText := strings.TrimSpace(r.FormValue("headerText"))
        footerText := strings.TrimSpace(r.FormValue("footerText"))
        if headerText == "" && footerText == "" {
                errorJSON(w, http.StatusBadRequest, "header or footer text is required")
                return
        }

        headerAlign := strings.TrimSpace(r.FormValue("headerAlign"))
        footerAlign := strings.TrimSpace(r.FormValue("footerAlign"))
        fontSize := parseIntDefault(r.FormValue("fontSize"), 12)
        marginStr := strings.TrimSpace(r.FormValue("margin"))
        fromPage := parseIntDefault(r.FormValue("fromPage"), 1)
        toPage := parseIntDefault(r.FormValue("toPage"), 0)

        // Map alignments to pdfcpu positions
        headerPos := "tc"
        switch headerAlign {
        case "left":
                headerPos = "tl"
        case "right":
                headerPos = "tr"
        }
        footerPos := "bc"
        switch footerAlign {
        case "left":
                footerPos = "bl"
        case "right":
                footerPos = "br"
        }

        // Margin offset
        marginOffset := 25
        if marginStr == "small" {
                marginOffset = 15
        } else if marginStr == "large" {
                marginOffset = 45
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        total, err := pageCountPDF(dir, inPath)
        if err != nil {
                total, err = pageCountPoppler(dir, inPath)
                if err != nil {
                        log.Printf("header-footer: page count error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to read page count")
                        return
                }
        }

        if toPage <= 0 || toPage > total {
                toPage = total
        }
        if fromPage < 1 {
                fromPage = 1
        }

        pageSelection := ""
        if fromPage > 1 || toPage < total {
                pageSelection = fmt.Sprintf("%d-%d", fromPage, toPage)
        }

        outName := buildOutputName(header.Filename, "headerfooter")
        workPath := inPath

        // Add header if specified
        if headerText != "" {
                headerOutPath := filepath.Join(dir, "with_header.pdf")
                headerDesc := fmt.Sprintf("pos:%s, off:0 -%d, points:%d, scale:1 abs, rot:0, op:1, fillc:.1 .1 .1", headerPos, marginOffset, fontSize)
                args := []string{"stamp", "add", "-mode", "text"}
                if pageSelection != "" {
                        args = append(args, "-pages", pageSelection)
                }
                args = append(args, "--", headerText, headerDesc, workPath, headerOutPath)
                if err := runCommand(dir, "pdfcpu", args...); err != nil {
                        log.Printf("header-footer: header error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to add header")
                        return
                }
                workPath = headerOutPath
        }

        // Add footer if specified
        if footerText != "" {
                footerOutPath := filepath.Join(dir, outName)
                footerDesc := fmt.Sprintf("pos:%s, off:0 %d, points:%d, scale:1 abs, rot:0, op:1, fillc:.1 .1 .1", footerPos, marginOffset, fontSize)
                args := []string{"stamp", "add", "-mode", "text"}
                if pageSelection != "" {
                        args = append(args, "-pages", pageSelection)
                }
                args = append(args, "--", footerText, footerDesc, workPath, footerOutPath)
                if err := runCommand(dir, "pdfcpu", args...); err != nil {
                        log.Printf("header-footer: footer error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to add footer")
                        return
                }
        } else {
                // Only header was added, rename output
                if err := os.Rename(workPath, filepath.Join(dir, outName)); err != nil {
                        log.Printf("header-footer: rename error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to finalize output")
                        return
                }
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

type organizeRotation struct {
        PageNumber int `json:"pageNumber"`
        Degrees    int `json:"degrees"`
}

func handleOrganize(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        order := strings.TrimSpace(r.FormValue("order"))
        if order == "" {
                errorJSON(w, http.StatusBadRequest, "order is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        workPath := filepath.Join(dir, "work.pdf")
        if b, err := os.ReadFile(inPath); err == nil {
                _ = os.WriteFile(workPath, b, 0o644)
        } else {
                errorJSON(w, http.StatusInternalServerError, "failed to prepare work file")
                return
        }

        // Optional per-page rotations.
        rotationsRaw := strings.TrimSpace(r.FormValue("rotations"))
        if rotationsRaw != "" {
                var rotations []organizeRotation
                if err := json.Unmarshal([]byte(rotationsRaw), &rotations); err != nil {
                        errorJSON(w, http.StatusBadRequest, "invalid rotations")
                        return
                }

                // Group pages by degrees.
                buckets := map[int][]int{90: {}, 180: {}, 270: {}}
                for _, rot := range rotations {
                        deg := ((rot.Degrees % 360) + 360) % 360
                        if deg == 0 {
                                continue
                        }
                        if deg != 90 && deg != 180 && deg != 270 {
                                continue
                        }
                        if rot.PageNumber <= 0 {
                                continue
                        }
                        buckets[deg] = append(buckets[deg], rot.PageNumber)
                }

                for _, deg := range []int{90, 180, 270} {
                        if len(buckets[deg]) == 0 {
                                continue
                        }
                        sort.Ints(buckets[deg])
                        parts := make([]string, 0, len(buckets[deg]))
                        for _, p := range buckets[deg] {
                                parts = append(parts, strconv.Itoa(p))
                        }
                        pagesSpec := strings.Join(parts, ",")

                        // pdfcpu rotate rotates in-place.
                        // Example: pdfcpu rotate -pages 1-2 test.pdf -90
                        if err := runCommand(dir, "pdfcpu", "rotate", "-pages", pagesSpec, workPath, fmt.Sprintf("-%d", deg)); err != nil {
                                log.Printf("organize rotate error: %v", err)
                                errorJSON(w, http.StatusInternalServerError, "failed to rotate pages")
                                return
                        }
                }
        }

        outName := buildOutputName(header.Filename, "organized")
        outPath := filepath.Join(dir, outName)

        // Reorder + delete by collecting pages in the specified order.
        if err := runCommand(dir, "pdfcpu", "collect", "-pages", order, workPath, outPath); err != nil {
                log.Printf("organize collect error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to organize PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func buildPreviewURL(r *http.Request, jobID, filename string) string {
        base := inferBaseURL(r)
        return fmt.Sprintf("%s/previews/%s/%s", base, jobID, filename)
}

func newJobDir() (string, string, error) {
        jobID := uuid.NewString()
        dir := filepath.Join(baseWorkDir, jobID)
        if err := os.MkdirAll(dir, 0o755); err != nil {
                return "", "", err
        }
        return jobID, dir, nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(status)
        _ = json.NewEncoder(w).Encode(v)
}

func errorJSON(w http.ResponseWriter, status int, msg string) {
        writeJSON(w, status, map[string]string{"error": msg})
}

func inferBaseURL(r *http.Request) string {
        scheme := "http"
        if r.Header.Get("X-Forwarded-Proto") == "https" || r.TLS != nil {
                scheme = "https"
        }
        return fmt.Sprintf("%s://%s", scheme, r.Host)
}

func buildDownloadURL(r *http.Request, jobID, filename string) string {
        // Use /downloads/ path to bypass rate limiting middleware on /api/pdf
        return fmt.Sprintf("/downloads/%s/%s", jobID, filename)
}

func saveUploadedFile(fileHeader *multipart.FileHeader, dst string) error {
        src, err := fileHeader.Open()
        if err != nil {
                return err
        }
        defer src.Close()

        out, err := os.Create(dst)
        if err != nil {
                return err
        }
        defer out.Close()

        _, err = io.Copy(out, src)
        return err
}

func runCommand(dir string, name string, args ...string) error {
        ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
        defer cancel()
        cmd := exec.CommandContext(ctx, name, args...)
        cmd.Dir = dir
        out, err := cmd.CombinedOutput()
        if err != nil {
                log.Printf("[runCommand] %s %v failed: %v\nOutput: %s", name, args, err, string(out))
        }
        return err
}

func runCommandOutput(dir string, name string, args ...string) (string, error) {
        cmd := exec.Command(name, args...)
        cmd.Dir = dir
        out, err := cmd.CombinedOutput()
        return string(out), err
}

func runChromiumPDF(dir, outputPath, inputSource string) error {
        scriptContent := fmt.Sprintf(`#!/bin/sh
exec chromium --headless --disable-gpu --no-sandbox --disable-dev-shm-usage --print-to-pdf="%s" --no-pdf-header-footer "%s" 2>/dev/null
`, outputPath, inputSource)
        scriptPath := filepath.Join(dir, "chrome_run.sh")
        if err := os.WriteFile(scriptPath, []byte(scriptContent), 0o755); err != nil {
                return fmt.Errorf("failed to write chrome script: %v", err)
        }
        log.Printf("[chromium] starting: input=%s output=%s", inputSource, outputPath)
        ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
        defer cancel()
        cmd := exec.CommandContext(ctx, "/bin/sh", scriptPath)
        cmd.Dir = dir
        out, err := cmd.CombinedOutput()
        if err != nil {
                log.Printf("[chromium] failed: %v output: %s", err, string(out))
                return fmt.Errorf("chromium failed: %v", err)
        }
        log.Printf("[chromium] success")
        return nil
}

func zipDirectory(srcDir, zipPath string) error {
        f, err := os.Create(zipPath)
        if err != nil {
                return err
        }
        defer f.Close()

        zw := zip.NewWriter(f)
        defer zw.Close()

        return filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
                if err != nil {
                        return err
                }
                if info.IsDir() {
                        return nil
                }

                rel, err := filepath.Rel(srcDir, path)
                if err != nil {
                        return err
                }
                w, err := zw.Create(rel)
                if err != nil {
                        return err
                }
                in, err := os.Open(path)
                if err != nil {
                        return err
                }
                defer in.Close()
                _, err = io.Copy(w, in)
                return err
        })
}

// === Handlers ===

func handleMerge(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }

        if err := r.ParseMultipartForm(64 << 20); err != nil { // 64MB
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        files := r.MultipartForm.File["files"]
        if len(files) == 0 {
                errorJSON(w, http.StatusBadRequest, "no files provided")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        var inputPaths []string
        for i, fh := range files {
                inPath := filepath.Join(dir, fmt.Sprintf("input_%d.pdf", i))
                if err := saveUploadedFile(fh, inPath); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to save input file")
                        return
                }
                inputPaths = append(inputPaths, inPath)
        }

        // Use first file's name as base for merged output
        firstFileName := ""
        if len(files) > 0 {
                firstFileName = files[0].Filename
        }
        outName := buildOutputName(firstFileName, "merged")
        outPath := filepath.Join(dir, outName)

        args := append([]string{"merge", outPath}, inputPaths...)
        if err := runCommand(dir, "pdfcpu", args...); err != nil {
                log.Printf("merge error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to merge PDFs")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleSplit(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        file, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }
        file.Close()

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        origBase := baseNameWithoutExt(header.Filename)
        inPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        mode := r.FormValue("mode")
        ranges := r.FormValue("ranges")
        merge := r.FormValue("merge") == "true"

        // Mode: fixed_parts - split into N equal parts
        if mode == "fixed_parts" && ranges != "" {
                rangeList := strings.Split(ranges, ",")
                partsDir := filepath.Join(dir, "parts")
                if err := os.MkdirAll(partsDir, 0o755); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to create parts dir")
                        return
                }

                for i, rng := range rangeList {
                        outName := fmt.Sprintf("%s_part_%d.pdf", origBase, i+1)
                        outPath := filepath.Join(partsDir, outName)
                        args := []string{inPath, "--pages", inPath, rng, "--", outPath}
                        if err := runCommand(dir, "qpdf", args...); err != nil {
                                log.Printf("fixed_parts split error: %v", err)
                                errorJSON(w, http.StatusInternalServerError, "failed to split PDF into parts")
                                return
                        }
                }

                zipName := fmt.Sprintf("%s_split_parts.zip", origBase)
                zipPath := filepath.Join(dir, zipName)
                if err := zipDirectory(partsDir, zipPath); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to zip parts")
                        return
                }

                writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, zipName)})
                return
        }

        // Mode: extract_merge - extract specific pages and merge into one PDF
        if mode == "extract_merge" && ranges != "" {
                outName := fmt.Sprintf("%s_extracted.pdf", origBase)
                outPath := filepath.Join(dir, outName)
                args := []string{inPath, "--pages", inPath, ranges, "--", outPath}
                if err := runCommand(dir, "qpdf", args...); err != nil {
                        log.Printf("extract_merge error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to extract and merge pages")
                        return
                }
                writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
                return
        }

        // Mode: extract - extract pages into separate PDFs
        if mode == "extract" && ranges != "" {
                pagesDir := filepath.Join(dir, "extracted")
                if err := os.MkdirAll(pagesDir, 0o755); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to create extracted dir")
                        return
                }

                // Parse ranges like "1,5-8" into individual pages
                pageNums := parsePageRanges(ranges)
                for _, pageNum := range pageNums {
                        outName := fmt.Sprintf("%s_page_%d.pdf", origBase, pageNum)
                        outPath := filepath.Join(pagesDir, outName)
                        args := []string{inPath, "--pages", inPath, fmt.Sprintf("%d", pageNum), "--", outPath}
                        if err := runCommand(dir, "qpdf", args...); err != nil {
                                log.Printf("extract page %d error: %v", pageNum, err)
                                continue
                        }
                }

                zipName := fmt.Sprintf("%s_extracted_pages.zip", origBase)
                zipPath := filepath.Join(dir, zipName)
                if err := zipDirectory(pagesDir, zipPath); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to zip extracted pages")
                        return
                }

                writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, zipName)})
                return
        }

        // Mode: ranges with merge option
        if mode == "ranges" && ranges != "" {
                if merge {
                        outName := fmt.Sprintf("%s_merged.pdf", origBase)
                        outPath := filepath.Join(dir, outName)
                        args := []string{inPath, "--pages", inPath, ranges, "--", outPath}
                        if err := runCommand(dir, "qpdf", args...); err != nil {
                                log.Printf("merge ranges error: %v", err)
                                errorJSON(w, http.StatusInternalServerError, "failed to merge ranges")
                                return
                        }
                        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
                        return
                }

                // Split into separate files for each range
                rangeList := strings.Split(ranges, ",")
                partsDir := filepath.Join(dir, "ranges")
                if err := os.MkdirAll(partsDir, 0o755); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to create ranges dir")
                        return
                }

                for i, rng := range rangeList {
                        outName := fmt.Sprintf("%s_range_%d.pdf", origBase, i+1)
                        outPath := filepath.Join(partsDir, outName)
                        args := []string{inPath, "--pages", inPath, rng, "--", outPath}
                        if err := runCommand(dir, "qpdf", args...); err != nil {
                                log.Printf("range split error: %v", err)
                                continue
                        }
                }

                zipName := fmt.Sprintf("%s_split_ranges.zip", origBase)
                zipPath := filepath.Join(dir, zipName)
                if err := zipDirectory(partsDir, zipPath); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to zip ranges")
                        return
                }

                writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, zipName)})
                return
        }

        // Default: split into individual pages and zip them
        pagesDir := filepath.Join(dir, "pages")
        if err := os.MkdirAll(pagesDir, 0o755); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create pages dir")
                return
        }

        args := []string{"extract", "-mode", "page", inPath, pagesDir}

        if err := runCommand(dir, "pdfcpu", args...); err != nil {
                log.Printf("split error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to split PDF")
                return
        }

        zipName := fmt.Sprintf("%s_split_pages.zip", origBase)
        zipPath := filepath.Join(dir, zipName)
        if err := zipDirectory(pagesDir, zipPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to zip pages")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, zipName)})
}

// parsePageRanges parses a string like "1,5-8" into individual page numbers
func parsePageRanges(ranges string) []int {
        var pages []int
        parts := strings.Split(ranges, ",")
        for _, part := range parts {
                part = strings.TrimSpace(part)
                if strings.Contains(part, "-") {
                        rangeParts := strings.Split(part, "-")
                        if len(rangeParts) == 2 {
                                start, _ := strconv.Atoi(strings.TrimSpace(rangeParts[0]))
                                end, _ := strconv.Atoi(strings.TrimSpace(rangeParts[1]))
                                for i := start; i <= end; i++ {
                                        pages = append(pages, i)
                                }
                        }
                } else {
                        if num, err := strconv.Atoi(part); err == nil {
                                pages = append(pages, num)
                        }
                }
        }
        return pages
}

func handleRemovePages(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, header.Filename)
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        pages := r.FormValue("pages")
        if pages == "" {
                errorJSON(w, http.StatusBadRequest, "pages is required")
                return
        }

        outName := buildOutputName(header.Filename, "removedpages")
        outPath := filepath.Join(dir, outName)

        args := []string{"pages", "remove", "-pages", pages, inPath, outPath}
        if err := runCommand(dir, "pdfcpu", args...); err != nil {
                log.Printf("remove pages error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to remove pages")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleExtractPages(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, header.Filename)
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        mode := r.FormValue("mode")
        ranges := r.FormValue("ranges")

        if mode == "ranges" && ranges != "" {
                outName := buildOutputName(header.Filename, "extracted")
                outPath := filepath.Join(dir, outName)
                args := []string{"collect", "-pages", ranges, inPath, outPath}
                if err := runCommand(dir, "pdfcpu", args...); err != nil {
                        log.Printf("extract ranges error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to extract pages")
                        return
                }
                writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
                return
        }

        // mode == all -> ZIP with each page
        pagesDir := filepath.Join(dir, "pages")
        if err := os.MkdirAll(pagesDir, 0o755); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create pages dir")
                return
        }

        args := []string{"extract", "-mode", "page", inPath, pagesDir}
        if err := runCommand(dir, "pdfcpu", args...); err != nil {
                log.Printf("extract all pages error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to extract pages")
                return
        }

        zipPath := filepath.Join(dir, "extracted_pages.zip")
        if err := zipDirectory(pagesDir, zipPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to zip pages")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, "extracted_pages.zip")})
}


func handleCompress(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, header.Filename)
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        level := strings.ToLower(r.FormValue("level"))
        if level == "" {
                level = "medium"
        }
        targetSizeKB := parseIntDefault(r.FormValue("targetSize"), 0)

        outName := buildOutputName(header.Filename, "compressed")
        outPath := filepath.Join(dir, outName)

        // For custom target size, use iterative compression
        if level == "custom" && targetSizeKB > 0 {
                targetBytes := int64(targetSizeKB * 1024)
                settings := []string{"/ebook", "/screen"}
                
                for _, setting := range settings {
                        args := []string{
                                "-sDEVICE=pdfwrite",
                                "-dCompatibilityLevel=1.4",
                                "-dPDFSETTINGS=" + setting,
                                "-dNOPAUSE",
                                "-dQUIET",
                                "-dBATCH",
                                "-sOutputFile=" + outPath,
                                inPath,
                        }
                        if err := runCommand(dir, "gs", args...); err != nil {
                                continue
                        }
                        fi, err := os.Stat(outPath)
                        if err == nil && fi.Size() <= targetBytes {
                                break
                        }
                        // Try more aggressive compression with lower DPI
                        args = []string{
                                "-sDEVICE=pdfwrite",
                                "-dCompatibilityLevel=1.4",
                                "-dPDFSETTINGS=" + setting,
                                "-dDownsampleColorImages=true",
                                "-dColorImageResolution=72",
                                "-dDownsampleGrayImages=true",
                                "-dGrayImageResolution=72",
                                "-dDownsampleMonoImages=true",
                                "-dMonoImageResolution=72",
                                "-dNOPAUSE",
                                "-dQUIET",
                                "-dBATCH",
                                "-sOutputFile=" + outPath,
                                inPath,
                        }
                        if err := runCommand(dir, "gs", args...); err != nil {
                                continue
                        }
                        fi, err = os.Stat(outPath)
                        if err == nil && fi.Size() <= targetBytes {
                                break
                        }
                }
        } else {
                // Map logical levels to Ghostscript PDFSETTINGS
                setting := "/ebook"
                switch level {
                case "high":
                        setting = "/screen"
                case "medium":
                        setting = "/ebook"
                case "low":
                        setting = "/printer"
                }

                args := []string{
                        "-sDEVICE=pdfwrite",
                        "-dCompatibilityLevel=1.4",
                        "-dPDFSETTINGS=" + setting,
                        "-dNOPAUSE",
                        "-dQUIET",
                        "-dBATCH",
                        "-sOutputFile=" + outPath,
                        inPath,
                }

                if err := runCommand(dir, "gs", args...); err != nil {
                        log.Printf("compress error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to compress PDF")
                        return
                }
        }

        // Verify output exists
        if _, err := os.Stat(outPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "compression failed")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleRepair(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, header.Filename)
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        outName := buildOutputName(header.Filename, "repaired")
        outPath := filepath.Join(dir, outName)

        // pdfcpu optimize also repairs many structural issues.
        args := []string{"optimize", inPath, outPath}
        if err := runCommand(dir, "pdfcpu", args...); err != nil {
                log.Printf("repair error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to repair PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleOCR(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, header.Filename)
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        outName := buildOutputName(header.Filename, "ocr")
        outPath := filepath.Join(dir, outName)

        lang := r.FormValue("lang")
        args := []string{"--skip-text"}
        if lang != "" {
                args = append(args, "-l", lang)
        }
        args = append(args, inPath, outPath)

        if err := runCommand(dir, "ocrmypdf", args...); err != nil {
                log.Printf("ocr error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to OCR PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleImageToPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(256 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        files := r.MultipartForm.File["files"]
        if len(files) == 0 {
                errorJSON(w, http.StatusBadRequest, "no files provided")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        var imagePaths []string
        for i, fh := range files {
                inPath := filepath.Join(dir, fmt.Sprintf("image_%d%s", i, filepath.Ext(fh.Filename)))
                if err := saveUploadedFile(fh, inPath); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to save image")
                        return
                }
                imagePaths = append(imagePaths, inPath)
        }

        outName := r.FormValue("outputFilename")
        if outName == "" {
                outName = defaultFilename
        }
        outPath := filepath.Join(dir, outName)

        args := append(imagePaths, outPath)
        if err := runCommand(dir, "convert", args...); err != nil {
                log.Printf("image to pdf error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert images")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleWordToPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(128 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inPath := filepath.Join(dir, header.Filename)
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        // LibreOffice will write the PDF into the same directory.
        if err := runCommand(dir, "libreoffice", "--headless", "--nologo", "--convert-to", "pdf", inPath); err != nil {
                log.Printf("libreoffice error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert document")
                return
        }

        // LibreOffice names the output based on the input file with .pdf extension.
        base := strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename)) + ".pdf"
        outName := base
        outPath := filepath.Join(dir, outName)

        if _, err := os.Stat(outPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "converted PDF not found")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handlePreview(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        // Use a stable filename so the previews handler can reliably locate the source PDF.
        inPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        // Progressive preview (iLovePDF-style):
        // Instead of rendering ALL pages up-front (slow for large PDFs), we:
        // 1) determine total page count
        // 2) return predictable per-page image URLs
        // 3) generate each thumbnail lazily on first request to /previews/*
        previewsDir := filepath.Join(dir, "previews")
        if err := os.MkdirAll(previewsDir, 0o755); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create previews dir")
                return
        }

        // Count pages using poppler (more tolerant + matches preview toolchain).
        // Fallback to pdfcpu info if pdfinfo fails.
        total, err := pageCountPoppler(dir, inPath)
        if err != nil {
                total, err = pageCountPDF(dir, inPath)
                if err != nil {
                        log.Printf("preview: page count error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to read page count")
                        return
                }
        }

        pages := make([]previewPage, 0, total)
        for i := 1; i <= total; i++ {
                // pdftoppm naming: page-<n>.png
                pages = append(pages, previewPage{PageNumber: i, ImageURL: buildPreviewURL(r, jobID, filepath.Join("previews", fmt.Sprintf("page-%d.png", i)))})
        }

        // Render ALL pages synchronously so images are fully written before the
        // frontend starts requesting them. This avoids the race condition where
        // the browser fetches a partially-written PNG (shows half page / blank).
        prefix := filepath.Join(previewsDir, "page")
        if out, renderErr := runCommandOutput(dir, "pdftoppm", "-png", "-r", "110", inPath, prefix); renderErr != nil {
                log.Printf("preview render error: %v output=%s", renderErr, out)
        }

        // pdftoppm may produce zero-padded filenames (page-01.png vs page-1.png).
        // Normalise to the names the frontend expects (page-1.png, page-2.png, …).
        for i := 1; i <= total; i++ {
                expected := filepath.Join(previewsDir, fmt.Sprintf("page-%d.png", i))
                if _, statErr := os.Stat(expected); statErr == nil {
                        continue
                }
                padded := []string{
                        filepath.Join(previewsDir, fmt.Sprintf("page-%02d.png", i)),
                        filepath.Join(previewsDir, fmt.Sprintf("page-%03d.png", i)),
                        filepath.Join(previewsDir, fmt.Sprintf("page-%04d.png", i)),
                }
                for _, p := range padded {
                        if _, statErr := os.Stat(p); statErr == nil {
                                _ = os.Rename(p, expected)
                                break
                        }
                }
        }

        writeJSON(w, http.StatusOK, previewResponse{Pages: pages})
}

func serveDownload(w http.ResponseWriter, r *http.Request) {
        // Handle both /downloads/ and /api/pdf/downloads/ paths
        rel := r.URL.Path
        if strings.HasPrefix(rel, "/api/pdf/downloads/") {
                rel = strings.TrimPrefix(rel, "/api/pdf/downloads/")
        } else {
                rel = strings.TrimPrefix(rel, "/downloads/")
        }
        clean := filepath.Clean(rel)
        if strings.Contains(clean, "..") {
                http.Error(w, "forbidden", http.StatusForbidden)
                return
        }
        full := filepath.Join(baseWorkDir, clean)

        fi, err := os.Stat(full)
        if err != nil || fi.IsDir() {
                http.Error(w, "file not found", http.StatusNotFound)
                return
        }

        w.Header().Set("Content-Disposition", "attachment; filename="+strconv.Quote(fi.Name()))
        http.ServeFile(w, r, full)
}

func servePreview(w http.ResponseWriter, r *http.Request) {
        // Handle both /previews/ and /api/pdf/previews/ paths
        rel := r.URL.Path
        if strings.HasPrefix(rel, "/api/pdf/previews/") {
                rel = strings.TrimPrefix(rel, "/api/pdf/previews/")
        } else {
                rel = strings.TrimPrefix(rel, "/previews/")
        }
        clean := filepath.Clean(rel)
        if strings.Contains(clean, "..") {
                http.Error(w, "forbidden", http.StatusForbidden)
                return
        }
        full := filepath.Join(baseWorkDir, clean)

        fi, err := os.Stat(full)
        if err != nil || fi.IsDir() {
                // Lazy-generate page thumbnails if this looks like a preview page request.
                // Expected: /previews/<jobId>/previews/page-<n>.png
                parts := strings.Split(clean, string(os.PathSeparator))
                if len(parts) >= 3 && parts[1] == "previews" {
                        jobID := parts[0]
                        filename := parts[len(parts)-1]
                        if strings.HasPrefix(filename, "page-") && strings.HasSuffix(strings.ToLower(filename), ".png") {
                                numStr := strings.TrimSuffix(strings.TrimPrefix(filename, "page-"), ".png")
                                n, convErr := strconv.Atoi(numStr)
                                if convErr == nil && n > 0 {
                                        jobDir := filepath.Join(baseWorkDir, jobID)
                                        srcPDF := filepath.Join(jobDir, "input.pdf")
                                        previewsDir := filepath.Join(jobDir, "previews")
                                        _ = os.MkdirAll(previewsDir, 0o755)

                                        prefix := filepath.Join(previewsDir, "page")
                                        // Render just this page.
                                        if out, genErr := runCommandOutput(jobDir, "pdftoppm", "-png", "-r", "110", "-f", strconv.Itoa(n), "-l", strconv.Itoa(n), srcPDF, prefix); genErr != nil {
                                                log.Printf("lazy preview error (job=%s page=%d): %v output=%s", jobID, n, genErr, out)
                                                http.Error(w, "failed to render preview", http.StatusInternalServerError)
                                                return
                                        }

                                        // pdftoppm may generate different filename patterns depending on total pages
                                        // Try multiple patterns: page-1.png, page-01.png, page-001.png, etc.
                                        patterns := []string{
                                                filepath.Join(previewsDir, fmt.Sprintf("page-%d.png", n)),
                                                filepath.Join(previewsDir, fmt.Sprintf("page-%02d.png", n)),
                                                filepath.Join(previewsDir, fmt.Sprintf("page-%03d.png", n)),
                                        }
                                        for _, pat := range patterns {
                                                if _, statErr := os.Stat(pat); statErr == nil && pat != full {
                                                        // Rename to expected name
                                                        _ = os.Rename(pat, full)
                                                        break
                                                }
                                        }

                                        // Retry stat after generation.
                                        fi, err = os.Stat(full)
                                        if err != nil || fi.IsDir() {
                                                http.Error(w, "file not found", http.StatusNotFound)
                                                return
                                        }
                                }
                        }
                }

                if err != nil || fi.IsDir() {
                        http.Error(w, "file not found", http.StatusNotFound)
                        return
                }
        }

        // No attachment header here: we want the browser to render thumbnails inline.
        http.ServeFile(w, r, full)
}

func cleanupOldJobs(maxAge time.Duration) {
        entries, err := os.ReadDir(baseWorkDir)
        if err != nil {
                return
        }
        cutoff := time.Now().Add(-maxAge)
        for _, e := range entries {
                if !e.IsDir() {
                        continue
                }
                p := filepath.Join(baseWorkDir, e.Name())
                info, err := os.Stat(p)
                if err != nil {
                        continue
                }
                if info.ModTime().Before(cutoff) {
                        _ = os.RemoveAll(p)
                }
        }
}

// =============================================================================
// PDF Security Tools: Protect, Unlock, Redact, Flatten
// =============================================================================

// handleProtectPDF encrypts a PDF with a password using 256-bit AES encryption.
func handleProtectPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[protect] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        password := strings.TrimSpace(r.FormValue("password"))
        if password == "" {
                errorJSON(w, http.StatusBadRequest, "password is required")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[protect] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[protect] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[protect] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + "_protected.pdf"
        outputPath := filepath.Join(dir, outputName)

        // qpdf --encrypt <user-pw> <owner-pw> 256 -- input.pdf output.pdf
        if err := runCommand(dir, "qpdf",
                "--warning-exit-0",
                "--encrypt", password, password, "256",
                "--",
                inputPath,
                outputPath,
        ); err != nil {
                log.Printf("[protect] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "qpdf encrypt failed: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleUnlockPDF removes password protection from a PDF.
func handleUnlockPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[unlock] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        password := strings.TrimSpace(r.FormValue("password"))

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[unlock] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[unlock] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[unlock] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + "_unlocked.pdf"
        outputPath := filepath.Join(dir, outputName)

        // qpdf --password=<pw> --decrypt input.pdf output.pdf
        var args []string
        if password != "" {
                args = []string{"--warning-exit-0", "--password=" + password, "--decrypt", inputPath, outputPath}
        } else {
                args = []string{"--warning-exit-0", "--decrypt", inputPath, outputPath}
        }
        if err := runCommand(dir, "qpdf", args...); err != nil {
                log.Printf("[unlock] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "qpdf decrypt failed: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleRedactPDF permanently redacts specified areas from a PDF.
//
// SECURITY NOTE: This implementation performs TRUE PERMANENT REDACTION.
// The PDF is rasterized to images, black rectangles are drawn over the
// sensitive areas, and then converted back to PDF. The original text/vector
// content beneath redacted areas is completely destroyed and cannot be
// recovered. Additionally, metadata is stripped using qpdf to ensure no
// residual information remains.
//
// Request format:
//   - file: PDF file (multipart)
//   - redactions: JSON array of redaction areas
//     [{"page":1,"x":0.1,"y":0.2,"width":0.3,"height":0.1}, ...]
//     Coordinates are percentages (0.0-1.0) relative to page dimensions.
func handleRedactPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[redact] parse form: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        // Parse redactions JSON
        redactionsJSON := strings.TrimSpace(r.FormValue("redactions"))
        if redactionsJSON == "" {
                errorJSON(w, http.StatusBadRequest, "redactions JSON required")
                return
        }

        type redactionArea struct {
                Page   int     `json:"page"`
                X      float64 `json:"x"`
                Y      float64 `json:"y"`
                Width  float64 `json:"width"`
                Height float64 `json:"height"`
        }
        var redactions []redactionArea
        if err := json.Unmarshal([]byte(redactionsJSON), &redactions); err != nil {
                log.Printf("[redact] parse redactions: %v", err)
                errorJSON(w, http.StatusBadRequest, "invalid redactions JSON: "+err.Error())
                return
        }
        if len(redactions) == 0 {
                errorJSON(w, http.StatusBadRequest, "at least one redaction area required")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[redact] file: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[redact] newJobDir: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[redact] save: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        // Step 1: Render all pages to PNG at 300 DPI using pdftoppm
        pngPrefix := filepath.Join(dir, "page")
        if err := runCommand(dir, "pdftoppm", "-png", "-r", "300", inputPath, pngPrefix); err != nil {
                log.Printf("[redact] pdftoppm: %v", err)
                errorJSON(w, http.StatusInternalServerError, "pdftoppm failed: "+err.Error())
                return
        }

        // Group redactions by page number
        pageRedactions := make(map[int][]redactionArea)
        for _, rd := range redactions {
                pageRedactions[rd.Page] = append(pageRedactions[rd.Page], rd)
        }

        // Find all generated PNG files
        pngFiles, err := filepath.Glob(filepath.Join(dir, "page-*.png"))
        if err != nil || len(pngFiles) == 0 {
                log.Printf("[redact] no pages: %v", err)
                errorJSON(w, http.StatusInternalServerError, "no pages generated")
                return
        }
        sort.Strings(pngFiles)

        // Step 2: For each page with redactions, draw black rectangles
        for pageNum, areas := range pageRedactions {
                // pdftoppm names files as page-1.png, page-2.png, etc. (or page-01.png for >9 pages)
                var pngPath string
                for _, p := range pngFiles {
                        base := filepath.Base(p)
                        // Extract page number from filename (page-1.png or page-01.png)
                        var pn int
                        if _, err := fmt.Sscanf(base, "page-%d.png", &pn); err == nil && pn == pageNum {
                                pngPath = p
                                break
                        }
                }
                if pngPath == "" {
                        log.Printf("[redact] page %d not found, skipping", pageNum)
                        continue
                }

                // Get image dimensions using ImageMagick identify
                dimOutput, err := runCommandOutput(dir, "identify", "-format", "%w %h", pngPath)
                if err != nil {
                        log.Printf("[redact] identify: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "identify failed: "+err.Error())
                        return
                }
                var imgWidth, imgHeight int
                if _, err := fmt.Sscanf(strings.TrimSpace(dimOutput), "%d %d", &imgWidth, &imgHeight); err != nil {
                        log.Printf("[redact] parse dimensions: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "parse dimensions failed")
                        return
                }

                // Build draw commands for all redaction areas on this page
                var drawCmds []string
                for _, area := range areas {
                        // Convert percentage coordinates to pixel coordinates
                        x1 := int(area.X * float64(imgWidth))
                        y1 := int(area.Y * float64(imgHeight))
                        x2 := int((area.X + area.Width) * float64(imgWidth))
                        y2 := int((area.Y + area.Height) * float64(imgHeight))
                        drawCmds = append(drawCmds, fmt.Sprintf("rectangle %d,%d %d,%d", x1, y1, x2, y2))
                }

                // Draw black rectangles using ImageMagick convert
                tempPath := pngPath + ".tmp.png"
                convertArgs := []string{pngPath, "-fill", "black"}
                for _, cmd := range drawCmds {
                        convertArgs = append(convertArgs, "-draw", cmd)
                }
                convertArgs = append(convertArgs, tempPath)

                if err := runCommand(dir, "convert", convertArgs...); err != nil {
                        log.Printf("[redact] convert draw: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "convert failed: "+err.Error())
                        return
                }

                // Atomically replace original with redacted version
                if err := os.Rename(tempPath, pngPath); err != nil {
                        log.Printf("[redact] rename: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "rename failed: "+err.Error())
                        return
                }
        }

        // Step 3: Rebuild PDF from images
        tempPdfPath := filepath.Join(dir, "temp_redacted.pdf")
        convertPdfArgs := append(pngFiles, tempPdfPath)
        if err := runCommand(dir, "convert", convertPdfArgs...); err != nil {
                log.Printf("[redact] convert to pdf: %v", err)
                errorJSON(w, http.StatusInternalServerError, "convert to pdf failed: "+err.Error())
                return
        }

        // Step 4: Strip metadata and optimize with qpdf
        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + "_redacted.pdf"
        outputPath := filepath.Join(dir, outputName)

        if err := runCommand(dir, "qpdf",
                "--warning-exit-0",
                "--linearize",
                "--compress-streams=y",
                "--object-streams=disable",
                tempPdfPath,
                outputPath,
        ); err != nil {
                log.Printf("[redact] qpdf optimize: %v", err)
                errorJSON(w, http.StatusInternalServerError, "qpdf optimize failed: "+err.Error())
                return
        }

        // Clean up temporary files
        _ = os.Remove(tempPdfPath)
        for _, p := range pngFiles {
                _ = os.Remove(p)
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleFlattenPDF flattens all annotations and rotations in a PDF.
func handleFlattenPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[flatten] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[flatten] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[flatten] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[flatten] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + "_flattened.pdf"
        outputPath := filepath.Join(dir, outputName)

        // qpdf --flatten-annotations=all --flatten-rotation input.pdf output.pdf
        if err := runCommand(dir, "qpdf",
                "--warning-exit-0",
                "--flatten-annotations=all",
                "--flatten-rotation",
                inputPath,
                outputPath,
        ); err != nil {
                log.Printf("[flatten] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "qpdf flatten failed: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// =============================================================================
// PDF Conversion Tools: PDF to Word, PDF to JPG, Extract Text, Extract Images, HTML to PDF
// =============================================================================

// handlePDFToWord converts a PDF to Word (.docx) using pdftotext + python-docx.
// Extracts text from PDF and creates a formatted Word document.
func handlePDFToWord(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[pdf-to-word] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[pdf-to-word] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[pdf-to-word] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[pdf-to-word] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + ".docx"
        outputPath := filepath.Join(dir, outputName)
        textPath := filepath.Join(dir, "extracted.txt")

        // Extract text using pdftotext with layout preservation
        if err := runCommand(dir, "pdftotext", "-layout", inputPath, textPath); err != nil {
                log.Printf("[pdf-to-word] pdftotext failed: %v", err)
                errorJSON(w, http.StatusInternalServerError, "text extraction failed")
                return
        }

        // Create Python script to convert text to DOCX using python-docx
        pythonScript := `#!/usr/bin/env python3
import sys
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

text_file = sys.argv[1]
docx_file = sys.argv[2]

try:
    doc = Document()
    
    # Set default font
    style = doc.styles['Normal']
    style.font.name = 'Arial'
    style.font.size = Pt(11)
    
    with open(text_file, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # Split by form feed (page breaks) or double newlines
    pages = content.split('\x0c')
    
    for i, page in enumerate(pages):
        if i > 0:
            doc.add_page_break()
        
        # Add paragraphs for each line
        lines = page.split('\n')
        for line in lines:
            if line.strip():
                para = doc.add_paragraph(line)
    
    doc.save(docx_file)
    print("Conversion successful")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`
        scriptPath := filepath.Join(dir, "convert.py")
        if err := os.WriteFile(scriptPath, []byte(pythonScript), 0o755); err != nil {
                log.Printf("[pdf-to-word] error writing script: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create conversion script")
                return
        }

        if err := runCommand(dir, "python3", scriptPath, textPath, outputPath); err != nil {
                log.Printf("[pdf-to-word] python script failed: %v", err)
                errorJSON(w, http.StatusInternalServerError, "document creation failed")
                return
        }

        // Verify output file was created
        if _, err := os.Stat(outputPath); err != nil {
                log.Printf("[pdf-to-word] output not found: %v", err)
                errorJSON(w, http.StatusInternalServerError, "converted file not found")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handlePDFToExcel converts a PDF to Excel (.xlsx) using pdftotext and openpyxl.
// Extracts text from PDF and creates an Excel spreadsheet.
func handlePDFToExcel(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[pdf-to-excel] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[pdf-to-excel] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[pdf-to-excel] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[pdf-to-excel] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + ".xlsx"
        outputPath := filepath.Join(dir, outputName)
        textPath := filepath.Join(dir, "extracted.txt")

        // Extract text using pdftotext with table layout
        if err := runCommand(dir, "pdftotext", "-layout", "-fixed", "3", inputPath, textPath); err != nil {
                log.Printf("[pdf-to-excel] pdftotext failed: %v", err)
                errorJSON(w, http.StatusInternalServerError, "text extraction failed")
                return
        }

        // Create Python conversion script using openpyxl
        pythonScript := `#!/usr/bin/env python3
import sys
import re
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment

text_file = sys.argv[1]
excel_file = sys.argv[2]

try:
    wb = Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    
    with open(text_file, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # Split content by pages (form feed character)
    pages = content.split('\x0c')
    
    row = 1
    for page_num, page in enumerate(pages):
        lines = page.split('\n')
        for line in lines:
            if line.strip():
                # Try to detect columns by multiple spaces
                cells = re.split(r'  +', line)
                for col, cell in enumerate(cells, 1):
                    ws.cell(row=row, column=col, value=cell.strip())
                row += 1
    
    # Auto-adjust column widths
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    wb.save(excel_file)
    print("Conversion successful")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`
        scriptPath := filepath.Join(dir, "convert_excel.py")
        if err := os.WriteFile(scriptPath, []byte(pythonScript), 0o755); err != nil {
                log.Printf("[pdf-to-excel] error writing script: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create conversion script")
                return
        }

        // Execute Python script
        if err := runCommand(dir, "python3", scriptPath, textPath, outputPath); err != nil {
                log.Printf("[pdf-to-excel] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "excel conversion failed: "+err.Error())
                return
        }

        // Verify output file was created
        if _, err := os.Stat(outputPath); err != nil {
                log.Printf("[pdf-to-excel] output not found: %v", err)
                errorJSON(w, http.StatusInternalServerError, "converted file not found")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handlePDFToPowerPoint converts a PDF to PowerPoint (.pptx) by converting pages to images.
func handlePDFToPowerPoint(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[pdf-to-pptx] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[pdf-to-pptx] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[pdf-to-pptx] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[pdf-to-pptx] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + ".pptx"
        outputPath := filepath.Join(dir, outputName)

        // Create Python conversion script using pdf2image and python-pptx
        pythonScript := `#!/usr/bin/env python3
import sys
import os
from pdf2image import convert_from_path
from pptx import Presentation
from pptx.util import Inches

pdf_file = sys.argv[1]
pptx_file = sys.argv[2]
work_dir = os.path.dirname(pdf_file)

try:
    images = convert_from_path(pdf_file, dpi=150)
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)
    
    for i, img in enumerate(images):
        slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout
        img_path = os.path.join(work_dir, f"slide_{i+1}.png")
        img.save(img_path, 'PNG')
        slide.shapes.add_picture(img_path, Inches(0), Inches(0), width=prs.slide_width, height=prs.slide_height)
    
    prs.save(pptx_file)
    print("Conversion successful")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`
        scriptPath := filepath.Join(dir, "convert_pptx.py")
        if err := os.WriteFile(scriptPath, []byte(pythonScript), 0o755); err != nil {
                log.Printf("[pdf-to-pptx] error writing script: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create conversion script")
                return
        }

        // Execute Python script with pdf2image and python-pptx
        if err := runCommand(dir, "python3", scriptPath, inputPath, outputPath); err != nil {
                log.Printf("[pdf-to-pptx] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "pptx convert failed: "+err.Error())
                return
        }

        // Verify output file was created
        if _, err := os.Stat(outputPath); err != nil {
                log.Printf("[pdf-to-pptx] output not found: %v", err)
                errorJSON(w, http.StatusInternalServerError, "converted file not found")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleExcelToPDF converts an Excel file (.xlsx, .xls) to PDF using LibreOffice.
func handleExcelToPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[excel-to-pdf] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[excel-to-pdf] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[excel-to-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        // Keep original extension for LibreOffice
        ext := filepath.Ext(hdr.Filename)
        if ext == "" {
                ext = ".xlsx"
        }
        inputPath := filepath.Join(dir, "input"+ext)
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[excel-to-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        // LibreOffice converts Excel to PDF
        if err := runCommand(dir, "libreoffice", "--headless", "--nologo", "--convert-to", "pdf", "--outdir", dir, inputPath); err != nil {
                log.Printf("[excel-to-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "libreoffice convert failed: "+err.Error())
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + ".pdf"
        outputPath := filepath.Join(dir, outputName)

        // LibreOffice names output based on input filename
        expectedOutput := filepath.Join(dir, "input.pdf")
        if _, err := os.Stat(expectedOutput); err == nil {
                if err := os.Rename(expectedOutput, outputPath); err != nil {
                        log.Printf("[excel-to-pdf] rename error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "rename failed")
                        return
                }
        } else if _, err := os.Stat(outputPath); err != nil {
                log.Printf("[excel-to-pdf] output not found: %v", err)
                errorJSON(w, http.StatusInternalServerError, "converted file not found")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handlePowerPointToPDF converts a PowerPoint file (.pptx, .ppt) to PDF using LibreOffice.
func handlePowerPointToPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(128 << 20); err != nil {
                log.Printf("[pptx-to-pdf] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[pptx-to-pdf] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[pptx-to-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        // Keep original extension for LibreOffice
        ext := filepath.Ext(hdr.Filename)
        if ext == "" {
                ext = ".pptx"
        }
        inputPath := filepath.Join(dir, "input"+ext)
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[pptx-to-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        // LibreOffice converts PowerPoint to PDF
        if err := runCommand(dir, "libreoffice", "--headless", "--nologo", "--convert-to", "pdf", "--outdir", dir, inputPath); err != nil {
                log.Printf("[pptx-to-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "libreoffice convert failed: "+err.Error())
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + ".pdf"
        outputPath := filepath.Join(dir, outputName)

        // LibreOffice names output based on input filename
        expectedOutput := filepath.Join(dir, "input.pdf")
        if _, err := os.Stat(expectedOutput); err == nil {
                if err := os.Rename(expectedOutput, outputPath); err != nil {
                        log.Printf("[pptx-to-pdf] rename error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "rename failed")
                        return
                }
        } else if _, err := os.Stat(outputPath); err != nil {
                log.Printf("[pptx-to-pdf] output not found: %v", err)
                errorJSON(w, http.StatusInternalServerError, "converted file not found")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handlePDFToJPG converts PDF pages to JPG images.
// For single-page PDFs, returns a single JPG file.
// For multi-page PDFs, returns a ZIP containing all JPG files.
func handlePDFToJPG(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[pdf-to-jpg] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[pdf-to-jpg] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        // Optional DPI parameter (default 150)
        dpi := parseIntDefault(r.FormValue("dpi"), 150)
        if dpi < 72 {
                dpi = 72
        }
        if dpi > 600 {
                dpi = 600
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[pdf-to-jpg] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[pdf-to-jpg] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        // Get page count using pdfinfo
        pageCount, err := pageCountPoppler(dir, inputPath)
        if err != nil {
                log.Printf("[pdf-to-jpg] pdfinfo error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to get page count: "+err.Error())
                return
        }

        // Create images directory
        imagesDir := filepath.Join(dir, "images")
        if err := os.MkdirAll(imagesDir, 0o755); err != nil {
                log.Printf("[pdf-to-jpg] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create images dir")
                return
        }

        // Convert PDF to JPG using pdftoppm
        prefix := filepath.Join(imagesDir, "page")
        if err := runCommand(dir, "pdftoppm", "-jpeg", "-r", strconv.Itoa(dpi), inputPath, prefix); err != nil {
                log.Printf("[pdf-to-jpg] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "pdftoppm failed: "+err.Error())
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)

        // Check if user wants a specific page or all pages
        pageStr := r.FormValue("page")
        wantAllPages := r.FormValue("all") == "true"

        // Find all generated JPG files
        jpgFiles, err := filepath.Glob(filepath.Join(imagesDir, "page-*.jpg"))
        if err != nil || len(jpgFiles) == 0 {
                log.Printf("[pdf-to-jpg] error: no JPG files generated")
                errorJSON(w, http.StatusInternalServerError, "no JPG files generated")
                return
        }

        // Sort files to ensure correct order
        sort.Strings(jpgFiles)

        // If user wants all pages as ZIP, create ZIP
        if wantAllPages && pageCount > 1 {
                zipName := baseName + "_images.zip"
                zipPath := filepath.Join(dir, zipName)

                if err := zipDirectory(imagesDir, zipPath); err != nil {
                        log.Printf("[pdf-to-jpg] error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "zip failed: "+err.Error())
                        return
                }

                writeJSON(w, http.StatusOK, downloadResponse{
                        DownloadURL: buildDownloadURL(r, jobID, zipName),
                })
                return
        }

        // Determine which page to return (default: first page, or specified page)
        pageIndex := 0
        if pageStr != "" {
                requestedPage := parseIntDefault(pageStr, 1)
                if requestedPage >= 1 && requestedPage <= len(jpgFiles) {
                        pageIndex = requestedPage - 1
                }
        }

        // Return single JPG file (first page or specified page)
        outputName := baseName + ".jpg"
        if pageStr != "" {
                outputName = fmt.Sprintf("%s_page%s.jpg", baseName, pageStr)
        }
        outputPath := filepath.Join(dir, outputName)
        if err := os.Rename(jpgFiles[pageIndex], outputPath); err != nil {
                log.Printf("[pdf-to-jpg] rename error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "rename failed: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleExtractText extracts plain text from a PDF using pdftotext.
func handleExtractText(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[extract-text] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[extract-text] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[extract-text] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[extract-text] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outputName := baseName + ".txt"
        outputPath := filepath.Join(dir, outputName)

        // pdftotext extracts text from PDF
        // -layout preserves the original layout
        if err := runCommand(dir, "pdftotext", "-layout", inputPath, outputPath); err != nil {
                log.Printf("[extract-text] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "pdftotext failed: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleExtractImages extracts embedded images from a PDF using pdfimages.
func handleExtractImages(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[extract-images] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                log.Printf("[extract-images] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "file required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[extract-images] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[extract-images] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        // Create images directory
        imagesDir := filepath.Join(dir, "images")
        if err := os.MkdirAll(imagesDir, 0o755); err != nil {
                log.Printf("[extract-images] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create images dir")
                return
        }

        // pdfimages extracts embedded images
        // -all extracts all images in their native format
        prefix := filepath.Join(imagesDir, "image")
        if err := runCommand(dir, "pdfimages", "-all", inputPath, prefix); err != nil {
                log.Printf("[extract-images] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "pdfimages failed: "+err.Error())
                return
        }

        // Check if any images were extracted
        entries, err := os.ReadDir(imagesDir)
        if err != nil || len(entries) == 0 {
                errorJSON(w, http.StatusOK, "no images found in PDF")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        zipName := baseName + "_extracted_images.zip"
        zipPath := filepath.Join(dir, zipName)

        if err := zipDirectory(imagesDir, zipPath); err != nil {
                log.Printf("[extract-images] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "zip failed: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, zipName),
        })
}

// handleHTMLToPDF converts an HTML file or URL to PDF using wkhtmltopdf.
func handleHTMLToPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[html-to-pdf] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "parse form failed")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[html-to-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        url := strings.TrimSpace(r.FormValue("url"))
        htmlContent := r.FormValue("html")
        var inputSource string
        var baseName string

        if url != "" {
                inputSource = url
                baseName = "webpage"
        } else if htmlContent != "" {
                inputPath := filepath.Join(dir, "input.html")
                if err := os.WriteFile(inputPath, []byte(htmlContent), 0o644); err != nil {
                        log.Printf("[html-to-pdf] error writing html: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "save failed")
                        return
                }
                inputSource = "file://" + inputPath
                baseName = "document"
        } else {
                _, hdr, err := r.FormFile("file")
                if err != nil {
                        errorJSON(w, http.StatusBadRequest, "file, html content, or url required")
                        return
                }

                inputPath := filepath.Join(dir, "input.html")
                if err := saveUploadedFile(hdr, inputPath); err != nil {
                        log.Printf("[html-to-pdf] error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "save failed")
                        return
                }
                inputSource = "file://" + inputPath
                baseName = baseNameWithoutExt(hdr.Filename)
        }

        outputName := baseName + ".pdf"
        outputPath := filepath.Join(dir, outputName)

        if err := runChromiumPDF(dir, outputPath, inputSource); err != nil {
                log.Printf("[html-to-pdf] chromium error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "HTML to PDF conversion failed")
                return
        }

        if _, err := os.Stat(outputPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "PDF generation failed")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// ─────────────────────────────────────────────────────────────────────────────
// Advanced PDF Tools
// ─────────────────────────────────────────────────────────────────────────────

// handleComparePDFs compares two PDF files and returns a text diff
// Expects two files: "file1" and "file2"
func handleComparePDFs(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, err.Error())
                return
        }

        // Parse multipart form
        if err := r.ParseMultipartForm(100 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "failed to parse form: "+err.Error())
                return
        }

        // Get file1
        file1, _, err := r.FormFile("file1")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file1 is required: "+err.Error())
                return
        }
        defer file1.Close()

        // Get file2
        file2, _, err := r.FormFile("file2")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file2 is required: "+err.Error())
                return
        }
        defer file2.Close()

        // Save both files
        inputPath1 := filepath.Join(dir, "file1.pdf")
        outFile1, err := os.Create(inputPath1)
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create file1: "+err.Error())
                return
        }
        if _, err := io.Copy(outFile1, file1); err != nil {
                outFile1.Close()
                errorJSON(w, http.StatusInternalServerError, "failed to save file1: "+err.Error())
                return
        }
        outFile1.Close()

        inputPath2 := filepath.Join(dir, "file2.pdf")
        outFile2, err := os.Create(inputPath2)
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create file2: "+err.Error())
                return
        }
        if _, err := io.Copy(outFile2, file2); err != nil {
                outFile2.Close()
                errorJSON(w, http.StatusInternalServerError, "failed to save file2: "+err.Error())
                return
        }
        outFile2.Close()

        // Extract text from both PDFs
        text1Path := filepath.Join(dir, "file1.txt")
        text2Path := filepath.Join(dir, "file2.txt")

        if err := runCommand(dir, "pdftotext", inputPath1, text1Path); err != nil {
                log.Printf("[compare] pdftotext file1 error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to extract text from file1: "+err.Error())
                return
        }

        if err := runCommand(dir, "pdftotext", inputPath2, text2Path); err != nil {
                log.Printf("[compare] pdftotext file2 error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to extract text from file2: "+err.Error())
                return
        }

        // Compare using diff (diff returns exit code 1 if files differ, which is normal)
        outputName := "differences.txt"
        outputPath := filepath.Join(dir, outputName)

        // Run diff and capture output (ignore exit code since diff returns 1 when files differ)
        cmd := exec.Command("diff", "-u", text1Path, text2Path)
        cmd.Dir = dir
        diffOutput, _ := cmd.Output() // Ignore error - diff exits 1 when files differ

        // Write diff output to file
        if len(diffOutput) == 0 {
                diffOutput = []byte("No differences found between the two PDF files.\n")
        }
        if err := os.WriteFile(outputPath, diffOutput, 0644); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to write diff output: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleDigitalSignature processes PDF and adds signature overlay
func handleDigitalSignature(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }

        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        signature := r.FormValue("signature")
        page := parseIntDefault(r.FormValue("page"), 1)
        xOff := parseIntDefault(r.FormValue("x"), 20)
        yOff := parseIntDefault(r.FormValue("y"), 20)

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, err.Error())
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inputPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        baseName := baseNameWithoutExt(header.Filename)
        outputName := baseName + "_signed.pdf"
        outputPath := filepath.Join(dir, outputName)

        // If signature provided, overlay it on the PDF
        if signature != "" && strings.HasPrefix(signature, "data:image") {
                // Extract base64 part
                parts := strings.SplitN(signature, ",", 2)
                if len(parts) != 2 {
                        log.Printf("[digital-signature] invalid signature format")
                        errorJSON(w, http.StatusBadRequest, "invalid signature format")
                        return
                }
                
                decoded, err := base64.StdEncoding.DecodeString(parts[1])
                if err != nil {
                        log.Printf("[digital-signature] base64 decode error: %v", err)
                        errorJSON(w, http.StatusBadRequest, "invalid signature encoding")
                        return
                }
                
                sigPath := filepath.Join(dir, "signature.png")
                if err := os.WriteFile(sigPath, decoded, 0644); err != nil {
                        log.Printf("[digital-signature] write signature error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to save signature")
                        return
                }
                
                // Use pdfcpu stamp to overlay signature
                // pos:br (bottom right) with offset, scale:0.3 for reasonable signature size
                desc := fmt.Sprintf("pos:br, off:%d %d, scale:0.3", xOff, yOff)
                args := []string{"stamp", "add", "-mode", "image", "-pages", fmt.Sprintf("%d", page), "--", sigPath, desc, inputPath, outputPath}
                
                if err := runCommand(dir, "pdfcpu", args...); err != nil {
                        log.Printf("[digital-signature] pdfcpu stamp error: %v", err)
                        // Fall back to simple qpdf processing
                        if err2 := runCommand(dir, "qpdf", "--linearize", "--warning-exit-0", inputPath, outputPath); err2 != nil {
                                errorJSON(w, http.StatusInternalServerError, "failed to add signature: "+err.Error())
                                return
                        }
                }
        } else {
                // Just linearize and process PDF
                if err := runCommand(dir, "qpdf",
                        "--linearize",
                        "--warning-exit-0",
                        inputPath,
                        outputPath,
                ); err != nil {
                        log.Printf("[digital-signature] qpdf error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to process PDF: "+err.Error())
                        return
                }
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleSignPDF processes PDF with multiple placed signatures
func handleSignPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }

        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        signaturesJSON := r.FormValue("signatures")
        log.Printf("[sign] Received signatures JSON (length %d): %s", len(signaturesJSON), signaturesJSON)

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, err.Error())
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inputPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        baseName := baseNameWithoutExt(header.Filename)
        outputName := baseName + "_signed.pdf"
        outputPath := filepath.Join(dir, outputName)

        // Parse signatures
        type PlacedSignature struct {
                ID        string  `json:"id"`
                Page      int     `json:"page"`
                X         float64 `json:"x"`
                Y         float64 `json:"y"`
                Width     float64 `json:"width"`
                Height    float64 `json:"height"`
                ImageData string  `json:"imageData"`
        }

        var signatures []PlacedSignature
        if signaturesJSON != "" {
                if err := json.Unmarshal([]byte(signaturesJSON), &signatures); err != nil {
                        log.Printf("[sign] failed to parse signatures: %v", err)
                        errorJSON(w, http.StatusBadRequest, "invalid signatures format")
                        return
                }
        }

        if len(signatures) == 0 {
                errorJSON(w, http.StatusBadRequest, "no signatures provided")
                return
        }

        // Group signatures by page
        pageSignatures := make(map[int][]PlacedSignature)
        for _, sig := range signatures {
                if sig.ImageData == "" || !strings.HasPrefix(sig.ImageData, "data:image") {
                        continue
                }
                pageSignatures[sig.Page] = append(pageSignatures[sig.Page], sig)
        }

        // Get actual page dimensions using pdfinfo
        pageWidthPx := 612  // Default Letter width in points
        pageHeightPx := 792 // Default Letter height in points

        cmd := exec.Command("pdfinfo", inputPath)
        cmd.Dir = dir
        infoOutput, err := cmd.Output()
        if err == nil {
                lines := strings.Split(string(infoOutput), "\n")
                for _, line := range lines {
                        if strings.HasPrefix(line, "Page size:") {
                                // Format: "Page size:      612 x 792 pts (letter)"
                                parts := strings.Fields(line)
                                if len(parts) >= 5 {
                                        if w, err := strconv.ParseFloat(parts[2], 64); err == nil {
                                                pageWidthPx = int(w)
                                        }
                                        if h, err := strconv.ParseFloat(parts[4], 64); err == nil {
                                                pageHeightPx = int(h)
                                        }
                                }
                                break
                        }
                }
        }
        log.Printf("[sign] PDF page dimensions: %dx%d", pageWidthPx, pageHeightPx)

        currentInput := inputPath
        tempCounter := 0

        // Process each page's signatures by compositing them into a single overlay
        for pageNum, sigs := range pageSignatures {
                // Create a transparent overlay image for this page
                overlayPath := filepath.Join(dir, fmt.Sprintf("overlay_%d.png", pageNum))
                
                // Start with a transparent canvas
                compositeArgs := []string{"-size", fmt.Sprintf("%dx%d", pageWidthPx, pageHeightPx), "xc:none"}
                
                // Add each signature to the composite
                for i, sig := range sigs {
                        parts := strings.SplitN(sig.ImageData, ",", 2)
                        if len(parts) != 2 {
                                log.Printf("[sign] invalid signature format for %s", sig.ID)
                                continue
                        }

                        decoded, err := base64.StdEncoding.DecodeString(parts[1])
                        if err != nil {
                                log.Printf("[sign] base64 decode error: %v", err)
                                continue
                        }

                        sigPath := filepath.Join(dir, fmt.Sprintf("sig_p%d_%d.png", pageNum, i))
                        if err := os.WriteFile(sigPath, decoded, 0644); err != nil {
                                log.Printf("[sign] write signature error: %v", err)
                                continue
                        }

                        // Calculate position in pixels (HTML coordinates, origin top-left)
                        xPos := int(sig.X / 100.0 * float64(pageWidthPx))
                        yPos := int(sig.Y / 100.0 * float64(pageHeightPx))
                        
                        // Calculate signature size in pixels
                        sigWidth := int(sig.Width / 100.0 * float64(pageWidthPx))
                        sigHeight := int(sig.Height / 100.0 * float64(pageHeightPx))
                        
                        // Add this signature to the composite command
                        compositeArgs = append(compositeArgs,
                                "(", sigPath, "-resize", fmt.Sprintf("%dx%d!", sigWidth, sigHeight), ")",
                                "-geometry", fmt.Sprintf("+%d+%d", xPos, yPos),
                                "-composite",
                        )
                }
                
                compositeArgs = append(compositeArgs, "PNG32:"+overlayPath)
                
                // Run ImageMagick to create the composite overlay
                log.Printf("[sign] Creating overlay for page %d with args: convert %v", pageNum, compositeArgs)
                if err := runCommand(dir, "convert", compositeArgs...); err != nil {
                        log.Printf("[sign] ImageMagick composite error: %v", err)
                        continue
                }

                // Now stamp this overlay onto the PDF page
                tempOutput := filepath.Join(dir, fmt.Sprintf("temp_%d.pdf", tempCounter))
                tempCounter++

                // Use pdfcpu to stamp the overlay - position at top-left, full page
                // The overlay is already positioned correctly, so we just need to place it at 0,0
                desc := "pos:tl, off:0 0, scale:1.0 abs, rot:0"
                args := []string{"stamp", "add", "-mode", "image", "-pages", fmt.Sprintf("%d", pageNum), "--", overlayPath, desc, currentInput, tempOutput}

                log.Printf("[sign] Running pdfcpu with args: %v", args)
                if err := runCommand(dir, "pdfcpu", args...); err != nil {
                        log.Printf("[sign] pdfcpu stamp error: %v", err)
                        continue
                }
                currentInput = tempOutput
        }

        // Copy final result
        if currentInput != inputPath {
                if err := copyFileEdit(currentInput, outputPath); err != nil {
                        log.Printf("[sign] copy error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to finalize PDF")
                        return
                }
        } else {
                errorJSON(w, http.StatusInternalServerError, "no signatures could be applied")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleAddTextAnnotation adds text overlay to a PDF
func handleAddTextAnnotation(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }

        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        text := r.FormValue("text")
        if text == "" {
                errorJSON(w, http.StatusBadRequest, "text is required")
                return
        }

        page := r.FormValue("page")
        if page == "" {
                page = "1"
        }
        pageNum, _ := strconv.Atoi(page)
        if pageNum < 1 {
                pageNum = 1
        }

        x := r.FormValue("x")
        if x == "" {
                x = "50"
        }
        y := r.FormValue("y")
        if y == "" {
                y = "50"
        }

        fontSize := r.FormValue("fontSize")
        if fontSize == "" {
                fontSize = "12"
        }

        color := r.FormValue("color")
        if color == "" {
                color = "#000000"
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, err.Error())
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inputPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        baseName := baseNameWithoutExt(header.Filename)
        outputName := baseName + "_annotated.pdf"
        outputPath := filepath.Join(dir, outputName)

        // Get total page count
        pdfInfoCmd := exec.Command("pdfinfo", inputPath)
        pdfInfoCmd.Dir = dir
        pdfInfoOutput, err := pdfInfoCmd.Output()
        if err != nil {
                log.Printf("[add-text] pdfinfo error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to analyze PDF")
                return
        }

        totalPages := 1
        for _, line := range strings.Split(string(pdfInfoOutput), "\n") {
                if strings.HasPrefix(line, "Pages:") {
                        fmt.Sscanf(line, "Pages: %d", &totalPages)
                        break
                }
        }

        if pageNum > totalPages {
                pageNum = totalPages
        }

        // Create annotation overlay using ImageMagick
        // First convert specified page to image
        pageImagePath := filepath.Join(dir, "page.png")
        if err := runCommand(dir, "pdftoppm",
                "-png",
                "-singlefile",
                "-f", strconv.Itoa(pageNum),
                "-l", strconv.Itoa(pageNum),
                "-r", "150",
                inputPath,
                filepath.Join(dir, "page"),
        ); err != nil {
                log.Printf("[add-text] pdftoppm error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert page")
                return
        }

        // Add text to the image using ImageMagick
        annotatedImagePath := filepath.Join(dir, "annotated.png")
        fontSizeStr := fmt.Sprintf("%s", fontSize)
        if err := runCommand(dir, "convert",
                pageImagePath,
                "-font", "DejaVu-Sans",
                "-fill", color,
                "-pointsize", fontSizeStr,
                "-annotate", fmt.Sprintf("+%s+%s", x, y),
                text,
                annotatedImagePath,
        ); err != nil {
                log.Printf("[add-text] convert error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to add text")
                return
        }

        // Convert annotated image back to PDF
        annotatedPDFPath := filepath.Join(dir, "annotated_page.pdf")
        if err := runCommand(dir, "convert",
                annotatedImagePath,
                annotatedPDFPath,
        ); err != nil {
                log.Printf("[add-text] convert to pdf error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create annotated PDF")
                return
        }

        // If single page, use the annotated page directly
        if totalPages == 1 {
                if err := runCommand(dir, "cp", annotatedPDFPath, outputPath); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to copy result")
                        return
                }
        } else {
                // Extract pages before and after the annotated page, then combine
                beforePath := filepath.Join(dir, "before.pdf")
                afterPath := filepath.Join(dir, "after.pdf")

                // Pages before annotated page
                if pageNum > 1 {
                        runCommand(dir, "qpdf", inputPath,
                                "--pages", inputPath, fmt.Sprintf("1-%d", pageNum-1), "--",
                                beforePath)
                }

                // Pages after annotated page
                if pageNum < totalPages {
                        runCommand(dir, "qpdf", inputPath,
                                "--pages", inputPath, fmt.Sprintf("%d-%d", pageNum+1, totalPages), "--",
                                afterPath)
                }

                // Combine all parts
                args := []string{inputPath, "--pages"}
                if pageNum > 1 {
                        args = append(args, beforePath, fmt.Sprintf("1-%d", pageNum-1))
                }
                args = append(args, annotatedPDFPath, "1")
                if pageNum < totalPages {
                        args = append(args, afterPath, fmt.Sprintf("1-%d", totalPages-pageNum))
                }
                args = append(args, "--", outputPath)

                if err := runCommand(dir, "qpdf", args...); err != nil {
                        log.Printf("[add-text] qpdf combine error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to combine pages")
                        return
                }
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleValidatePDFA validates PDF/A compliance using verapdf
func handleValidatePDFA(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }

        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, err.Error())
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inputPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        baseName := baseNameWithoutExt(header.Filename)
        outputName := baseName + "_validation.txt"
        outputPath := filepath.Join(dir, outputName)

        // Build validation report using qpdf and pdfinfo
        var reportBuilder strings.Builder

        // Run qpdf --check to validate PDF structure
        reportBuilder.WriteString("=== PDF Structure Validation (qpdf --check) ===\n\n")
        cmd := exec.Command("qpdf", "--check", "--warning-exit-0", inputPath)
        cmd.Dir = dir
        qpdfOutput, err := cmd.CombinedOutput()
        if err != nil {
                reportBuilder.WriteString(fmt.Sprintf("qpdf check failed: %v\n", err))
        }
        if len(qpdfOutput) > 0 {
                reportBuilder.Write(qpdfOutput)
        } else {
                reportBuilder.WriteString("No issues found.\n")
        }

        // Run pdfinfo to get PDF version and metadata
        reportBuilder.WriteString("\n=== PDF Metadata (pdfinfo) ===\n\n")
        cmd2 := exec.Command("pdfinfo", inputPath)
        cmd2.Dir = dir
        pdfinfoOutput, err := cmd2.CombinedOutput()
        if err != nil {
                reportBuilder.WriteString(fmt.Sprintf("pdfinfo failed: %v\n", err))
        }
        if len(pdfinfoOutput) > 0 {
                reportBuilder.Write(pdfinfoOutput)
        } else {
                reportBuilder.WriteString("No metadata available.\n")
        }

        // Write combined validation output to file
        if err := os.WriteFile(outputPath, []byte(reportBuilder.String()), 0644); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to write validation report: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handlePDFToHTML converts PDF to HTML using pdftohtml
func handlePDFToHTML(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }

        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, err.Error())
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inputPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        baseName := baseNameWithoutExt(header.Filename)

        // pdftohtml with -s creates a single HTML file
        // The output will be named baseName.html (pdftohtml adds suffix automatically)
        if err := runCommand(dir, "pdftohtml",
                "-s",            // single HTML file
                "-noframes",     // no frame structure
                "-enc", "UTF-8", // UTF-8 encoding
                inputPath,
                filepath.Join(dir, baseName),
        ); err != nil {
                log.Printf("[pdf-to-html] pdftohtml error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "pdftohtml failed: "+err.Error())
                return
        }

        // pdftohtml creates baseName-html.html or baseName.html
        // Check which file was created
        outputName := baseName + ".html"
        outputPath := filepath.Join(dir, outputName)

        // If the standard output doesn't exist, try the -html suffix
        if _, err := os.Stat(outputPath); os.IsNotExist(err) {
                altName := baseName + "-html.html"
                altPath := filepath.Join(dir, altName)
                if _, err := os.Stat(altPath); err == nil {
                        outputName = altName
                        outputPath = altPath
                } else {
                        // Try baseName.html (pdftohtml sometimes just uses original name + .html)
                        suffixName := baseName + "s.html"
                        suffixPath := filepath.Join(dir, suffixName)
                        if _, err := os.Stat(suffixPath); err == nil {
                                outputName = suffixName
                                outputPath = suffixPath
                        }
                }
        }

        // Verify output exists
        if _, err := os.Stat(outputPath); os.IsNotExist(err) {
                // List directory to find HTML files
                entries, _ := os.ReadDir(dir)
                for _, entry := range entries {
                        if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".html") {
                                outputName = entry.Name()
                                outputPath = filepath.Join(dir, outputName)
                                break
                        }
                }
        }

        if _, err := os.Stat(outputPath); os.IsNotExist(err) {
                errorJSON(w, http.StatusInternalServerError, "HTML output not found")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleAddHeaderFooter adds headers and footers to PDF using Ghostscript
func handleAddHeaderFooter(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }

        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, err.Error())
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inputPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        // Get header and footer text from form values
        headerText := r.FormValue("headerText")
        footerText := r.FormValue("footerText")

        if headerText == "" && footerText == "" {
                errorJSON(w, http.StatusBadRequest, "at least one of headerText or footerText is required")
                return
        }

        baseName := baseNameWithoutExt(header.Filename)
        outputName := baseName + "_headerfooter.pdf"
        outputPath := filepath.Join(dir, outputName)

        // Get page dimensions using pdfinfo
        pageWidth := 612.0  // Default Letter width in points
        pageHeight := 792.0 // Default Letter height in points

        cmd := exec.Command("pdfinfo", inputPath)
        cmd.Dir = dir
        infoOutput, err := cmd.Output()
        if err == nil {
                // Parse page size from pdfinfo output
                lines := strings.Split(string(infoOutput), "\n")
                for _, line := range lines {
                        if strings.HasPrefix(line, "Page size:") {
                                // Format: "Page size:      612 x 792 pts (letter)"
                                parts := strings.Fields(line)
                                if len(parts) >= 4 {
                                        if w, err := strconv.ParseFloat(parts[2], 64); err == nil {
                                                pageWidth = w
                                        }
                                        if h, err := strconv.ParseFloat(parts[4], 64); err == nil {
                                                pageHeight = h
                                        }
                                }
                                break
                        }
                }
        }

        // Calculate positions
        headerY := pageHeight - 25 // 25 points from top
        footerY := 20.0            // 20 points from bottom
        centerX := pageWidth / 2   // Center of page

        // Build PostScript commands for header and footer overlay
        var psCommands strings.Builder
        psCommands.WriteString("/Helvetica findfont 12 scalefont setfont\n")
        psCommands.WriteString("0.5 0.5 0.5 setrgbcolor\n") // Gray color

        if headerText != "" {
                // Center the header text
                psCommands.WriteString(fmt.Sprintf("%.1f %.1f moveto (%s) dup stringwidth pop 2 div neg 0 rmoveto show\n",
                        centerX, headerY, headerText))
        }

        if footerText != "" {
                // Center the footer text
                psCommands.WriteString(fmt.Sprintf("%.1f %.1f moveto (%s) dup stringwidth pop 2 div neg 0 rmoveto show\n",
                        centerX, footerY, footerText))
        }

        // Create PostScript file that adds header/footer to each page
        psPath := filepath.Join(dir, "overlay.ps")
        psContent := fmt.Sprintf(`%%!PS-Adobe-3.0
<< /EndPage {
  exch pop
  0 eq {
    %s
    true
  } { false } ifelse
} bind >> setpagedevice
`, psCommands.String())

        if err := os.WriteFile(psPath, []byte(psContent), 0644); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create overlay script")
                return
        }

        // Use Ghostscript to apply header/footer overlay to each page
        if err := runCommand(dir, "gs",
                "-dBATCH",
                "-dNOPAUSE",
                "-dQUIET",
                "-sDEVICE=pdfwrite",
                "-dPDFSETTINGS=/prepress",
                "-sOutputFile="+outputPath,
                psPath,
                inputPath,
        ); err != nil {
                log.Printf("[add-header-footer] ghostscript error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to add header/footer: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleConvertToPDFA converts PDF to PDF/A-2b format using Ghostscript
func handleConvertToPDFA(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }

        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, err.Error())
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inputPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        baseName := baseNameWithoutExt(header.Filename)
        outputName := baseName + "_pdfa.pdf"
        outputPath := filepath.Join(dir, outputName)

        // Convert to PDF/A-2b using Ghostscript
        if err := runCommand(dir, "gs",
                "-dBATCH",
                "-dNOPAUSE",
                "-dQUIET",
                "-sDEVICE=pdfwrite",
                "-dPDFA=2",
                "-dPDFACompatibilityPolicy=1",
                "-sOutputFile="+outputPath,
                inputPath,
        ); err != nil {
                log.Printf("[convert-to-pdfa] ghostscript error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert to PDF/A: "+err.Error())
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// handleEditPDF processes PDF with multiple annotations (text, images, drawings)
func handleEditPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "POST required")
                return
        }

        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, header, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        annotationsJSON := r.FormValue("annotations")
        
        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, err.Error())
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(header, inputPath); err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to save file")
                return
        }

        baseName := baseNameWithoutExt(header.Filename)
        outputName := baseName + "_edited.pdf"
        outputPath := filepath.Join(dir, outputName)

        // Parse annotations
        type Annotation struct {
                ID          string                   `json:"id"`
                Type        string                   `json:"type"`
                Page        int                      `json:"page"`
                X           float64                  `json:"x"`
                Y           float64                  `json:"y"`
                Width       float64                  `json:"width,omitempty"`
                Height      float64                  `json:"height,omitempty"`
                Content     string                   `json:"content,omitempty"`
                FontSize    int                      `json:"fontSize,omitempty"`
                Color       string                   `json:"color,omitempty"`
                ImageData   string                   `json:"imageData,omitempty"`
                DrawingPath []map[string]float64     `json:"drawingPath,omitempty"`
        }

        var annotations []Annotation
        if annotationsJSON != "" {
                if err := json.Unmarshal([]byte(annotationsJSON), &annotations); err != nil {
                        log.Printf("[edit] failed to parse annotations: %v", err)
                        errorJSON(w, http.StatusBadRequest, "invalid annotations format")
                        return
                }
        }

        if len(annotations) == 0 {
                errorJSON(w, http.StatusBadRequest, "no annotations provided")
                return
        }

        pageWidthPts := 612.0
        pageHeightPts := 792.0

        cmd := exec.Command("pdfinfo", inputPath)
        cmd.Dir = dir
        infoOutput, err := cmd.Output()
        if err == nil {
                lines := strings.Split(string(infoOutput), "\n")
                for _, line := range lines {
                        if strings.HasPrefix(line, "Page size:") {
                                parts := strings.Fields(line)
                                if len(parts) >= 5 {
                                        if w, err := strconv.ParseFloat(parts[2], 64); err == nil {
                                                pageWidthPts = w
                                        }
                                        if h, err := strconv.ParseFloat(parts[4], 64); err == nil {
                                                pageHeightPts = h
                                        }
                                }
                                break
                        }
                }
        }
        log.Printf("[edit] PDF page dimensions: %.0fx%.0f pts", pageWidthPts, pageHeightPts)

        currentInput := inputPath
        tempCounter := 0
        appliedCount := 0

        pageGroups := make(map[int][]Annotation)
        for _, ann := range annotations {
                pageGroups[ann.Page] = append(pageGroups[ann.Page], ann)
        }

        for pageNum, pageAnns := range pageGroups {
                overlayFile := filepath.Join(dir, fmt.Sprintf("edit_overlay_%d.png", pageNum))
                overlayArgs := []string{"-size", fmt.Sprintf("%dx%d", int(pageWidthPts), int(pageHeightPts)), "xc:none"}

                hasContent := false

                for i, ann := range pageAnns {
                        xPts := ann.X / 100.0 * pageWidthPts
                        yPts := ann.Y / 100.0 * pageHeightPts

                        if ann.Type == "text" && ann.Content != "" {
                                fontSize := ann.FontSize
                                if fontSize < 8 {
                                        fontSize = 16
                                }
                                color := ann.Color
                                if color == "" {
                                        color = "#000000"
                                }

                                escapedContent := strings.ReplaceAll(ann.Content, "'", "\\'")
                                escapedContent = strings.ReplaceAll(escapedContent, "\"", "\\\"")

                                overlayArgs = append(overlayArgs,
                                        "-font", "DejaVu-Sans",
                                        "-fill", color,
                                        "-pointsize", fmt.Sprintf("%d", fontSize),
                                        "-draw", fmt.Sprintf("text %d,%d '%s'", int(xPts), int(yPts)+fontSize, escapedContent),
                                )
                                hasContent = true
                        }

                        if ann.Type == "image" && ann.ImageData != "" && strings.HasPrefix(ann.ImageData, "data:image") {
                                parts := strings.SplitN(ann.ImageData, ",", 2)
                                if len(parts) == 2 {
                                        decoded, decErr := base64.StdEncoding.DecodeString(parts[1])
                                        if decErr != nil {
                                                log.Printf("[edit] base64 decode error: %v", decErr)
                                                continue
                                        }

                                        imgPath := filepath.Join(dir, fmt.Sprintf("img_%d_%d.png", pageNum, i))
                                        if wErr := os.WriteFile(imgPath, decoded, 0644); wErr != nil {
                                                log.Printf("[edit] write image error: %v", wErr)
                                                continue
                                        }

                                        imgWidth := int(ann.Width / 100.0 * pageWidthPts)
                                        imgHeight := int(ann.Height / 100.0 * pageHeightPts)
                                        if imgWidth < 10 {
                                                imgWidth = int(pageWidthPts * 0.3)
                                        }
                                        if imgHeight < 10 {
                                                imgHeight = int(pageHeightPts * 0.3)
                                        }

                                        imgOverlayPath := filepath.Join(dir, fmt.Sprintf("img_overlay_%d_%d.png", pageNum, i))
                                        imgOverlayArgs := []string{
                                                "-size", fmt.Sprintf("%dx%d", int(pageWidthPts), int(pageHeightPts)),
                                                "xc:none",
                                                "(", imgPath, "-resize", fmt.Sprintf("%dx%d!", imgWidth, imgHeight), ")",
                                                "-geometry", fmt.Sprintf("+%d+%d", int(xPts), int(yPts)),
                                                "-composite",
                                                "PNG32:" + imgOverlayPath,
                                        }
                                        if err := runCommand(dir, "convert", imgOverlayArgs...); err != nil {
                                                log.Printf("[edit] image overlay error: %v", err)
                                                continue
                                        }

                                        overlayArgs = append(overlayArgs,
                                                imgOverlayPath, "-composite",
                                        )
                                        hasContent = true
                                }
                        }

                        if ann.Type == "drawing" && len(ann.DrawingPath) > 1 {
                                drawColor := ann.Color
                                if drawColor == "" {
                                        drawColor = "#000000"
                                }

                                strokeWidth := "3"
                                isHighlight := drawColor == "#FFFF00"
                                if isHighlight {
                                        strokeWidth = "12"
                                }

                                var drawPoints strings.Builder
                                for j, point := range ann.DrawingPath {
                                        px := point["x"] / 100.0 * pageWidthPts
                                        py := point["y"] / 100.0 * pageHeightPts
                                        if j > 0 {
                                                drawPoints.WriteString(" ")
                                        }
                                        drawPoints.WriteString(fmt.Sprintf("%.1f,%.1f", px, py))
                                }

                                strokeColor := drawColor
                                if isHighlight {
                                        strokeColor = "#FFFF0080"
                                }
                                overlayArgs = append(overlayArgs,
                                        "-stroke", strokeColor,
                                        "-strokewidth", strokeWidth,
                                        "-fill", "none",
                                        "-draw", fmt.Sprintf("polyline %s", drawPoints.String()),
                                )
                                hasContent = true
                        }
                }

                if !hasContent {
                        continue
                }

                overlayArgs = append(overlayArgs, "PNG32:"+overlayFile)

                log.Printf("[edit] Creating overlay for page %d", pageNum)
                if err := runCommand(dir, "convert", overlayArgs...); err != nil {
                        log.Printf("[edit] ImageMagick overlay error for page %d: %v", pageNum, err)
                        continue
                }

                tempOutput := filepath.Join(dir, fmt.Sprintf("temp_%d.pdf", tempCounter))
                tempCounter++

                desc := "pos:tl, off:0 0, scale:1.0 abs, rot:0"
                args := []string{"stamp", "add", "-mode", "image", "-pages", fmt.Sprintf("%d", pageNum), "--", overlayFile, desc, currentInput, tempOutput}

                log.Printf("[edit] Stamping overlay on page %d", pageNum)
                if err := runCommand(dir, "pdfcpu", args...); err != nil {
                        log.Printf("[edit] pdfcpu stamp error for page %d: %v", pageNum, err)
                        continue
                }
                currentInput = tempOutput
                appliedCount++
        }

        if appliedCount == 0 {
                log.Printf("[edit] No annotations could be applied")
                errorJSON(w, http.StatusInternalServerError, "failed to apply annotations to PDF")
                return
        }

        if err := copyFileEdit(currentInput, outputPath); err != nil {
                log.Printf("[edit] copy error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to finalize PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{
                DownloadURL: buildDownloadURL(r, jobID, outputName),
        })
}

// hexToRGB converts hex color to pdfcpu RGB format (0-1 range)
func hexToRGB(hex string) string {
        if hex == "" || hex == "#000000" {
                return "0 0 0"
        }
        hex = strings.TrimPrefix(hex, "#")
        if len(hex) != 6 {
                return "0 0 0"
        }
        rVal, _ := strconv.ParseInt(hex[0:2], 16, 64)
        gVal, _ := strconv.ParseInt(hex[2:4], 16, 64)
        bVal, _ := strconv.ParseInt(hex[4:6], 16, 64)
        return fmt.Sprintf("%.2f %.2f %.2f", float64(rVal)/255, float64(gVal)/255, float64(bVal)/255)
}

// copyFileEdit copies a file from src to dst
func copyFileEdit(src, dst string) error {
        source, err := os.Open(src)
        if err != nil {
                return err
        }
        defer source.Close()

        destination, err := os.Create(dst)
        if err != nil {
                return err
        }
        defer destination.Close()

        _, err = io.Copy(destination, source)
        return err
}

type metadataResponse struct {
        Title    string `json:"title"`
        Author   string `json:"author"`
        Subject  string `json:"subject"`
        Keywords string `json:"keywords"`
        Creator  string `json:"creator"`
        Producer string `json:"producer"`
        Pages    string `json:"pages"`
}

type formFieldsResponse struct {
        Fields []formField `json:"fields"`
}

type formField struct {
        Name  string `json:"name"`
        Type  string `json:"type"`
        Value string `json:"value"`
}

type bookmarkEntry struct {
        Title string `json:"title"`
        Page  int    `json:"page"`
}

func handlePNGToPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(256 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        files := r.MultipartForm.File["files"]
        if len(files) == 0 {
                errorJSON(w, http.StatusBadRequest, "no files provided")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        var imagePaths []string
        for i, fh := range files {
                inPath := filepath.Join(dir, fmt.Sprintf("image_%d.png", i))
                if err := saveUploadedFile(fh, inPath); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to save image")
                        return
                }
                imagePaths = append(imagePaths, inPath)
        }

        outName := "output.pdf"
        outPath := filepath.Join(dir, outName)

        args := append(imagePaths, outPath)
        if err := runCommand(dir, "convert", args...); err != nil {
                log.Printf("[png-to-pdf] convert error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert PNG to PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handlePDFToPNG(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        dpi := parseIntDefault(r.FormValue("dpi"), 300)
        if dpi < 72 {
                dpi = 72
        }
        if dpi > 600 {
                dpi = 600
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[pdf-to-png] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[pdf-to-png] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        imagesDir := filepath.Join(dir, "images")
        if err := os.MkdirAll(imagesDir, 0o755); err != nil {
                log.Printf("[pdf-to-png] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create images dir")
                return
        }

        prefix := filepath.Join(imagesDir, "page")
        if err := runCommand(dir, "pdftoppm", "-png", "-r", strconv.Itoa(dpi), inputPath, prefix); err != nil {
                log.Printf("[pdf-to-png] pdftoppm error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert PDF to PNG")
                return
        }

        pngFiles, err := filepath.Glob(filepath.Join(imagesDir, "page-*.png"))
        if err != nil || len(pngFiles) == 0 {
                log.Printf("[pdf-to-png] no PNG files generated")
                errorJSON(w, http.StatusInternalServerError, "no PNG files generated")
                return
        }
        sort.Strings(pngFiles)

        baseName := baseNameWithoutExt(hdr.Filename)
        zipName := baseName + "_png.zip"
        zipPath := filepath.Join(dir, zipName)

        if err := zipDirectory(imagesDir, zipPath); err != nil {
                log.Printf("[pdf-to-png] zip error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create zip")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, zipName)})
}

func handlePDFToTIFF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[pdf-to-tiff] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[pdf-to-tiff] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outName := baseName + ".tiff"
        outPath := filepath.Join(dir, outName)

        dpi := r.FormValue("dpi")
        if dpi == "" {
                dpi = "150"
        }

        if err := runCommand(dir, "gs",
                "-dNOPAUSE", "-dBATCH", "-dQUIET",
                "-sDEVICE=tiff24nc",
                "-r"+dpi,
                fmt.Sprintf("-sOutputFile=%s", outPath),
                inputPath,
        ); err != nil {
                log.Printf("[pdf-to-tiff] gs error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert PDF to TIFF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleBMPToPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(256 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        files := r.MultipartForm.File["files"]
        if len(files) == 0 {
                errorJSON(w, http.StatusBadRequest, "no files provided")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        var imagePaths []string
        for i, fh := range files {
                inPath := filepath.Join(dir, fmt.Sprintf("image_%d.bmp", i))
                if err := saveUploadedFile(fh, inPath); err != nil {
                        errorJSON(w, http.StatusInternalServerError, "failed to save image")
                        return
                }
                imagePaths = append(imagePaths, inPath)
        }

        outName := "output.pdf"
        outPath := filepath.Join(dir, outName)

        args := append(imagePaths, outPath)
        if err := runCommand(dir, "convert", args...); err != nil {
                log.Printf("[bmp-to-pdf] convert error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert BMP to PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleEncryptPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                log.Printf("[encrypt-pdf] error: %v", err)
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        password := strings.TrimSpace(r.FormValue("password"))
        if password == "" {
                errorJSON(w, http.StatusBadRequest, "password is required")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        permissions := strings.TrimSpace(r.FormValue("permissions"))

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[encrypt-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[encrypt-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outName := baseName + "_encrypted.pdf"
        outPath := filepath.Join(dir, outName)

        args := []string{"--warning-exit-0", "--encrypt", password, password, "256"}

        if permissions != "" {
                perms := strings.Split(permissions, ",")
                permSet := make(map[string]bool)
                for _, p := range perms {
                        permSet[strings.TrimSpace(strings.ToLower(p))] = true
                }
                if !permSet["print"] {
                        args = append(args, "--print=none")
                }
                if !permSet["modify"] {
                        args = append(args, "--modify=none")
                }
                if !permSet["copy"] {
                        args = append(args, "--extract=n")
                }
        }

        args = append(args, "--", inputPath, outPath)

        if err := runCommand(dir, "qpdf", args...); err != nil {
                log.Printf("[encrypt-pdf] qpdf error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to encrypt PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleMetadataEditor(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        action := strings.TrimSpace(r.FormValue("action"))
        if action == "" {
                action = "read"
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[metadata] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[metadata] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        if action == "read" {
                out, err := runCommandOutput(dir, "pdfcpu", "info", inputPath)
                if err != nil {
                        log.Printf("[metadata] pdfcpu info error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to read metadata")
                        return
                }

                meta := metadataResponse{}
                for _, line := range strings.Split(out, "\n") {
                        line = strings.TrimSpace(line)
                        if idx := strings.Index(line, ":"); idx > 0 {
                                key := strings.TrimSpace(line[:idx])
                                val := strings.TrimSpace(line[idx+1:])
                                switch strings.ToLower(key) {
                                case "title":
                                        meta.Title = val
                                case "author":
                                        meta.Author = val
                                case "subject":
                                        meta.Subject = val
                                case "keywords":
                                        meta.Keywords = val
                                case "creator":
                                        meta.Creator = val
                                case "producer":
                                        meta.Producer = val
                                case "pages", "page count":
                                        meta.Pages = val
                                }
                        }
                }

                writeJSON(w, http.StatusOK, meta)
                return
        }

        title := strings.TrimSpace(r.FormValue("title"))
        author := strings.TrimSpace(r.FormValue("author"))
        subject := strings.TrimSpace(r.FormValue("subject"))
        keywords := strings.TrimSpace(r.FormValue("keywords"))

        var propArgs []string
        if title != "" {
                propArgs = append(propArgs, fmt.Sprintf("Title = %s", title))
        }
        if author != "" {
                propArgs = append(propArgs, fmt.Sprintf("Author = %s", author))
        }
        if subject != "" {
                propArgs = append(propArgs, fmt.Sprintf("Subject = %s", subject))
        }
        if keywords != "" {
                propArgs = append(propArgs, fmt.Sprintf("Keywords = %s", keywords))
        }

        if len(propArgs) == 0 {
                errorJSON(w, http.StatusBadRequest, "no metadata fields provided")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outName := baseName + "_metadata.pdf"
        outPath := filepath.Join(dir, outName)

        if err := copyFileEdit(inputPath, outPath); err != nil {
                log.Printf("[metadata] copy error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to prepare output")
                return
        }

        args := []string{"properties", "add", outPath}
        args = append(args, propArgs...)
        if err := runCommand(dir, "pdfcpu", args...); err != nil {
                log.Printf("[metadata] pdfcpu properties error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to update metadata")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleBookmarksEditor(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        bookmarksJSON := strings.TrimSpace(r.FormValue("bookmarks"))
        if bookmarksJSON == "" {
                errorJSON(w, http.StatusBadRequest, "bookmarks JSON is required")
                return
        }

        var bookmarks []bookmarkEntry
        if err := json.Unmarshal([]byte(bookmarksJSON), &bookmarks); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid bookmarks JSON")
                return
        }

        if len(bookmarks) == 0 {
                errorJSON(w, http.StatusBadRequest, "at least one bookmark is required")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[bookmarks] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[bookmarks] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outName := baseName + "_bookmarked.pdf"

        bmJSON, err := json.Marshal(bookmarks)
        if err != nil {
                log.Printf("[bookmarks] marshal error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to encode bookmarks")
                return
        }
        bmFile := filepath.Join(dir, "bookmarks.json")
        if err := os.WriteFile(bmFile, bmJSON, 0o644); err != nil {
                log.Printf("[bookmarks] write json error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to write bookmarks file")
                return
        }
        outPath := filepath.Join(dir, outName)

        pythonScript := `#!/usr/bin/env python3
import sys, json
from pypdf import PdfReader, PdfWriter

pdf_in = sys.argv[1]
bm_json = sys.argv[2]
pdf_out = sys.argv[3]

with open(bm_json, 'r') as f:
    bookmarks = json.load(f)

reader = PdfReader(pdf_in)
writer = PdfWriter()
for page in reader.pages:
    writer.add_page(page)

for bm in bookmarks:
    page_num = bm.get('page', 1) - 1
    if page_num < 0:
        page_num = 0
    if page_num >= len(reader.pages):
        page_num = len(reader.pages) - 1
    writer.add_outline_item(bm['title'], page_num)

with open(pdf_out, 'wb') as f:
    writer.write(f)
print("Bookmarks added successfully")
`
        scriptPath := filepath.Join(dir, "add_bookmarks.py")
        if err := os.WriteFile(scriptPath, []byte(pythonScript), 0o755); err != nil {
                log.Printf("[bookmarks] write script error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create script")
                return
        }
        if err := runCommand(dir, "python3", scriptPath, inputPath, bmFile, outPath); err != nil {
                log.Printf("[bookmarks] python script error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to add bookmarks")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleBatchProcess(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(256 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        files := r.MultipartForm.File["files"]
        if len(files) == 0 {
                errorJSON(w, http.StatusBadRequest, "no files provided")
                return
        }

        operation := strings.TrimSpace(r.FormValue("operation"))
        if operation == "" {
                errorJSON(w, http.StatusBadRequest, "operation is required")
                return
        }

        degrees := parseIntDefault(r.FormValue("degrees"), 90)
        text := strings.TrimSpace(r.FormValue("text"))

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[batch] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        outputDir := filepath.Join(dir, "output")
        if err := os.MkdirAll(outputDir, 0o755); err != nil {
                log.Printf("[batch] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create output dir")
                return
        }

        for i, fh := range files {
                inPath := filepath.Join(dir, fmt.Sprintf("input_%d.pdf", i))
                if err := saveUploadedFile(fh, inPath); err != nil {
                        log.Printf("[batch] save error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to save file")
                        return
                }

                outName := buildOutputName(fh.Filename, operation)
                outPath := filepath.Join(outputDir, outName)

                var cmdErr error
                switch operation {
                case "compress":
                        cmdErr = runCommand(dir, "gs",
                                "-sDEVICE=pdfwrite",
                                "-dCompatibilityLevel=1.4",
                                "-dPDFSETTINGS=/ebook",
                                "-dNOPAUSE", "-dBATCH", "-dQUIET",
                                fmt.Sprintf("-sOutputFile=%s", outPath),
                                inPath,
                        )
                case "rotate":
                        if degrees != 90 && degrees != 180 && degrees != 270 {
                                degrees = 90
                        }
                        cmdErr = runCommand(dir, "pdfcpu", "rotate", inPath, strconv.Itoa(degrees), outPath)
                case "flatten":
                        if err := copyFileEdit(inPath, outPath); err != nil {
                                log.Printf("[batch] copy error: %v", err)
                                errorJSON(w, http.StatusInternalServerError, "failed to prepare file")
                                return
                        }
                        cmdErr = runCommand(dir, "pdfcpu", "flatten", outPath)
                case "watermark":
                        if text == "" {
                                text = "WATERMARK"
                        }
                        desc := "pos:c, rot:45, points:48, scale:1 abs, op:0.25, fillc:.5 .5 .5"
                        cmdErr = runCommand(dir, "pdfcpu", "watermark", "add", "-mode", "text", "--", text, desc, inPath, outPath)
                default:
                        errorJSON(w, http.StatusBadRequest, "unsupported operation: "+operation)
                        return
                }

                if cmdErr != nil {
                        log.Printf("[batch] %s error for file %d: %v", operation, i, cmdErr)
                        errorJSON(w, http.StatusInternalServerError, fmt.Sprintf("failed to %s file %d", operation, i+1))
                        return
                }
        }

        zipName := fmt.Sprintf("batch_%s.zip", operation)
        zipPath := filepath.Join(dir, zipName)
        if err := zipDirectory(outputDir, zipPath); err != nil {
                log.Printf("[batch] zip error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create zip")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, zipName)})
}

func handleFormFill(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        _, hdr, err := r.FormFile("file")
        if err != nil {
                errorJSON(w, http.StatusBadRequest, "file is required")
                return
        }

        action := strings.TrimSpace(r.FormValue("action"))
        if action == "" {
                action = "fill"
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[form-fill] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        inputPath := filepath.Join(dir, "input.pdf")
        if err := saveUploadedFile(hdr, inputPath); err != nil {
                log.Printf("[form-fill] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "save failed")
                return
        }

        if action == "read" {
                out, err := runCommandOutput(dir, "pdfcpu", "form", "list", inputPath)
                if err != nil {
                        out, err = runCommandOutput(dir, "pdftk", inputPath, "dump_data_fields")
                        if err != nil {
                                writeJSON(w, http.StatusOK, formFieldsResponse{Fields: []formField{}})
                                return
                        }

                        var fields []formField
                        var current formField
                        for _, line := range strings.Split(out, "\n") {
                                line = strings.TrimSpace(line)
                                if line == "---" {
                                        if current.Name != "" {
                                                fields = append(fields, current)
                                        }
                                        current = formField{}
                                        continue
                                }
                                if strings.HasPrefix(line, "FieldName:") {
                                        current.Name = strings.TrimSpace(strings.TrimPrefix(line, "FieldName:"))
                                } else if strings.HasPrefix(line, "FieldType:") {
                                        current.Type = strings.TrimSpace(strings.TrimPrefix(line, "FieldType:"))
                                } else if strings.HasPrefix(line, "FieldValue:") {
                                        current.Value = strings.TrimSpace(strings.TrimPrefix(line, "FieldValue:"))
                                }
                        }
                        if current.Name != "" {
                                fields = append(fields, current)
                        }

                        writeJSON(w, http.StatusOK, formFieldsResponse{Fields: fields})
                        return
                }

                var fields []formField
                for _, line := range strings.Split(out, "\n") {
                        line = strings.TrimSpace(line)
                        if line == "" || strings.HasPrefix(line, "Pages") || strings.HasPrefix(line, "---") {
                                continue
                        }
                        parts := strings.SplitN(line, "|", 3)
                        if len(parts) >= 2 {
                                f := formField{
                                        Name: strings.TrimSpace(parts[0]),
                                        Type: strings.TrimSpace(parts[1]),
                                }
                                if len(parts) >= 3 {
                                        f.Value = strings.TrimSpace(parts[2])
                                }
                                fields = append(fields, f)
                        }
                }

                writeJSON(w, http.StatusOK, formFieldsResponse{Fields: fields})
                return
        }

        fieldsJSON := strings.TrimSpace(r.FormValue("fields"))
        if fieldsJSON == "" {
                errorJSON(w, http.StatusBadRequest, "fields JSON is required")
                return
        }

        var fieldsMap map[string]string
        if err := json.Unmarshal([]byte(fieldsJSON), &fieldsMap); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid fields JSON")
                return
        }

        baseName := baseNameWithoutExt(hdr.Filename)
        outName := baseName + "_filled.pdf"
        outPath := filepath.Join(dir, outName)

        formDataPath := filepath.Join(dir, "formdata.json")
        formDataContent, _ := json.Marshal(fieldsMap)
        if err := os.WriteFile(formDataPath, formDataContent, 0o644); err != nil {
                log.Printf("[form-fill] write formdata error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to prepare form data")
                return
        }

        err = runCommand(dir, "pdfcpu", "form", "fill", inputPath, formDataPath, outPath)
        if err != nil {
                log.Printf("[form-fill] pdfcpu form fill failed, trying pdftk: %v", err)

                fdfContent := "%FDF-1.2\n1 0 obj\n<< /FDF << /Fields [\n"
                for k, v := range fieldsMap {
                        fdfContent += fmt.Sprintf("<< /T (%s) /V (%s) >>\n", k, v)
                }
                fdfContent += "] >> >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"

                fdfPath := filepath.Join(dir, "data.fdf")
                if err := os.WriteFile(fdfPath, []byte(fdfContent), 0o644); err != nil {
                        log.Printf("[form-fill] write fdf error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to prepare FDF")
                        return
                }

                if err := runCommand(dir, "pdftk", inputPath, "fill_form", fdfPath, "output", outPath); err != nil {
                        log.Printf("[form-fill] pdftk error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to fill form")
                        return
                }
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func handleMarkdownToPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(64 << 20); err != nil {
                errorJSON(w, http.StatusBadRequest, "invalid multipart form")
                return
        }

        markdown := strings.TrimSpace(r.FormValue("markdown"))

        if markdown == "" {
                _, hdr, err := r.FormFile("file")
                if err != nil {
                        errorJSON(w, http.StatusBadRequest, "markdown text or file is required")
                        return
                }

                jobID, dir, err := newJobDir()
                if err != nil {
                        log.Printf("[markdown-to-pdf] error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to create job")
                        return
                }

                mdPath := filepath.Join(dir, "input.md")
                if err := saveUploadedFile(hdr, mdPath); err != nil {
                        log.Printf("[markdown-to-pdf] error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "save failed")
                        return
                }

                mdBytes, err := os.ReadFile(mdPath)
                if err != nil {
                        log.Printf("[markdown-to-pdf] read error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to read markdown file")
                        return
                }
                markdown = string(mdBytes)

                html := convertMarkdownToHTML(markdown)
                htmlPath := filepath.Join(dir, "input.html")
                if err := os.WriteFile(htmlPath, []byte(html), 0o644); err != nil {
                        log.Printf("[markdown-to-pdf] write html error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to create HTML")
                        return
                }

                outName := "output.pdf"
                outPath := filepath.Join(dir, outName)

                if err := runChromiumPDF(dir, outPath, "file://"+htmlPath); err != nil {
                        log.Printf("[markdown-to-pdf] chrome error: %v", err)
                        errorJSON(w, http.StatusInternalServerError, "failed to convert to PDF")
                        return
                }

                writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[markdown-to-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        html := convertMarkdownToHTML(markdown)
        htmlPath := filepath.Join(dir, "input.html")
        if err := os.WriteFile(htmlPath, []byte(html), 0o644); err != nil {
                log.Printf("[markdown-to-pdf] write html error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create HTML")
                return
        }

        outName := "output.pdf"
        outPath := filepath.Join(dir, outName)

        if err := runChromiumPDF(dir, outPath, "file://"+htmlPath); err != nil {
                log.Printf("[markdown-to-pdf] chrome error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert to PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}

func convertMarkdownToHTML(md string) string {
        lines := strings.Split(md, "\n")
        var body strings.Builder
        inCodeBlock := false
        inList := false

        for _, line := range lines {
                if strings.HasPrefix(line, "```") {
                        if inCodeBlock {
                                body.WriteString("</code></pre>\n")
                                inCodeBlock = false
                        } else {
                                if inList {
                                        body.WriteString("</ul>\n")
                                        inList = false
                                }
                                body.WriteString("<pre><code>")
                                inCodeBlock = true
                        }
                        continue
                }
                if inCodeBlock {
                        body.WriteString(strings.ReplaceAll(strings.ReplaceAll(line, "<", "&lt;"), ">", "&gt;"))
                        body.WriteString("\n")
                        continue
                }

                trimmed := strings.TrimSpace(line)
                if trimmed == "" {
                        if inList {
                                body.WriteString("</ul>\n")
                                inList = false
                        }
                        body.WriteString("<br>\n")
                        continue
                }

                if strings.HasPrefix(trimmed, "- ") || strings.HasPrefix(trimmed, "* ") {
                        if !inList {
                                body.WriteString("<ul>\n")
                                inList = true
                        }
                        body.WriteString("<li>")
                        body.WriteString(applyInlineMarkdown(trimmed[2:]))
                        body.WriteString("</li>\n")
                        continue
                }

                if inList {
                        body.WriteString("</ul>\n")
                        inList = false
                }

                if strings.HasPrefix(trimmed, "### ") {
                        body.WriteString("<h3>")
                        body.WriteString(applyInlineMarkdown(trimmed[4:]))
                        body.WriteString("</h3>\n")
                } else if strings.HasPrefix(trimmed, "## ") {
                        body.WriteString("<h2>")
                        body.WriteString(applyInlineMarkdown(trimmed[3:]))
                        body.WriteString("</h2>\n")
                } else if strings.HasPrefix(trimmed, "# ") {
                        body.WriteString("<h1>")
                        body.WriteString(applyInlineMarkdown(trimmed[2:]))
                        body.WriteString("</h1>\n")
                } else {
                        body.WriteString("<p>")
                        body.WriteString(applyInlineMarkdown(trimmed))
                        body.WriteString("</p>\n")
                }
        }

        if inList {
                body.WriteString("</ul>\n")
        }
        if inCodeBlock {
                body.WriteString("</code></pre>\n")
        }

        return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
h1, h2, h3 { color: #111; }
pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
pre code { background: none; padding: 0; }
ul { padding-left: 24px; }
</style>
</head>
<body>
%s
</body>
</html>`, body.String())
}

func applyInlineMarkdown(s string) string {
        result := s
        for {
                start := strings.Index(result, "**")
                if start < 0 {
                        break
                }
                end := strings.Index(result[start+2:], "**")
                if end < 0 {
                        break
                }
                end += start + 2
                inner := result[start+2 : end]
                result = result[:start] + "<strong>" + inner + "</strong>" + result[end+2:]
        }
        for {
                start := strings.Index(result, "*")
                if start < 0 {
                        break
                }
                end := strings.Index(result[start+1:], "*")
                if end < 0 {
                        break
                }
                end += start + 1
                inner := result[start+1 : end]
                result = result[:start] + "<em>" + inner + "</em>" + result[end+1:]
        }
        for {
                start := strings.Index(result, "`")
                if start < 0 {
                        break
                }
                end := strings.Index(result[start+1:], "`")
                if end < 0 {
                        break
                }
                end += start + 1
                inner := result[start+1 : end]
                result = result[:start] + "<code>" + inner + "</code>" + result[end+1:]
        }
        return result
}

func handleURLToPDF(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
                errorJSON(w, http.StatusMethodNotAllowed, "method not allowed")
                return
        }
        if err := r.ParseMultipartForm(10 << 20); err != nil {
                if err := r.ParseForm(); err != nil {
                        errorJSON(w, http.StatusBadRequest, "invalid form data")
                        return
                }
        }

        url := strings.TrimSpace(r.FormValue("url"))
        if url == "" {
                errorJSON(w, http.StatusBadRequest, "url is required")
                return
        }

        if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
                errorJSON(w, http.StatusBadRequest, "url must start with http:// or https://")
                return
        }

        jobID, dir, err := newJobDir()
        if err != nil {
                log.Printf("[url-to-pdf] error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to create job")
                return
        }

        outName := "output.pdf"
        outPath := filepath.Join(dir, outName)

        if err := runChromiumPDF(dir, outPath, url); err != nil {
                log.Printf("[url-to-pdf] chrome error: %v", err)
                errorJSON(w, http.StatusInternalServerError, "failed to convert URL to PDF")
                return
        }

        writeJSON(w, http.StatusOK, downloadResponse{DownloadURL: buildDownloadURL(r, jobID, outName)})
}
