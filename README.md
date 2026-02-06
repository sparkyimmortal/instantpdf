# InstantPDF – Full-Stack PDF Tools Platform

InstantPDF is a production-ready web application offering 20+ PDF tools such as merge, split, compress, OCR, convert, organize, watermark, rotate, and sign PDFs.

This project is built as a real-world backend + DevOps showcase and is deployed on AWS EC2.

---

## Tech Stack

Frontend:
- React
- Vite
- Tailwind CSS
- React Query

Backend:
- Node.js
- Express
- Go (PDF processing engine)

Database:
- PostgreSQL
- Drizzle ORM

Infrastructure:
- AWS EC2 (Ubuntu)
- Linux system dependencies
- GitHub (version control)

---

## Authentication & User Plans

- JWT-based authentication
- Password hashing using bcrypt
- User roles:
  - Anonymous
  - Free
  - Pro (expiry-based)
  - Admin

Usage limits:

Anonymous:
- 8 operations per day
- 5 MB max file size
- 25 pages max

Free:
- 15 operations per day
- 10 MB max file size
- 40 pages max

Pro:
- Unlimited operations
- Unlimited file size
- Unlimited pages

---

## PDF Processing Engine (Go)

Heavy PDF operations are handled by a dedicated Go backend using:

- pdfcpu
- Ghostscript
- Poppler-utils
- OCRmyPDF
- Tesseract OCR
- LibreOffice
- Chromium (headless)

This separation ensures high performance and stability.

---

## Project Structure

client/        - Frontend (React)
server/        - Node.js API and authentication
pdf-backend/   - Go PDF engine
shared/        - Shared schemas and types

---

## Environment Variables

Create a .env file with:

DATABASE_URL=postgresql://user:password@localhost:5432/instantpdf
JWT_SECRET=your-secret
PORT=3000

---

## Deployment

- Deployed on AWS EC2
- PostgreSQL hosted on the same server
- Linux system dependencies installed manually
- Git-based deployment workflow

---

## DevOps Highlights

- Linux server provisioning
- Secure authentication and rate limiting
- Database migrations
- Process management ready (PM2)
- CI/CD pipeline ready (GitHub Actions)

---

## Author

Gourav  
DevOps & Backend focused project
