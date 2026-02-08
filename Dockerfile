FROM node:20-bookworm

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

RUN pip3 install --break-system-packages \
    python-docx \
    openpyxl \
    python-pptx \
    pdf2image \
    PyPDF2

RUN ln -sf /usr/bin/chromium /usr/bin/chromium-browser || true

RUN go install github.com/pdfcpu/pdfcpu/cmd/pdfcpu@v0.8.1 && \
    cp /root/go/bin/pdfcpu /usr/local/bin/pdfcpu

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production=false

COPY pdf-backend/go.mod pdf-backend/go.sum ./pdf-backend/
RUN cd pdf-backend && go mod download

COPY . .

RUN cd pdf-backend && go build -o pdf-backend .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

CMD ["/app/docker-entrypoint.sh"]