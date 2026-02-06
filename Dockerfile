FROM node:20-bookworm

# System & PDF dependencies
RUN apt-get update && apt-get install -y \
    golang-go \
    imagemagick \
    ghostscript \
    poppler-utils \
    libreoffice \
    qpdf \
    python3 \
    python3-pip \
    chromium \
    ocrmypdf \
    tesseract-ocr \
    tesseract-ocr-eng \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# Python libs
RUN pip3 install --break-system-packages \
    python-docx \
    openpyxl \
    python-pptx \
    pdf2image \
    PyPDF2

# Chromium compatibility
RUN ln -sf /usr/bin/chromium /usr/bin/chromium-browser || true

# pdfcpu
RUN go install github.com/pdfcpu/pdfcpu/cmd/pdfcpu@v0.8.1 && \
    cp /root/go/bin/pdfcpu /usr/local/bin/pdfcpu

WORKDIR /app

# Node deps
COPY package.json package-lock.json* ./
RUN npm install

# Go deps
COPY pdf-backend/go.mod pdf-backend/go.sum ./pdf-backend/
RUN cd pdf-backend && go mod download

# App source
COPY . .

# Build Go backend
RUN cd pdf-backend && go build -o pdf-backend .

# Build Node app
RUN npm run build

# Environment
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["npm", "start"]
