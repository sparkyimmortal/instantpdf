# InstantPDF

## After Downloading ZIP

Delete these files/folders before deploying:
- `.replit` - Replit configuration
- `replit.md` - Replit documentation
- `.local/` - Replit state files
- `.cache/` - Cache directory
- `node_modules/` - Run `npm install` to regenerate

In `vite.config.ts`, remove these imports and plugin entries:
```ts
// Remove these imports:
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { cartographer } from "@replit/vite-plugin-cartographer";
import devBanner from "@replit/vite-plugin-dev-banner";

// Remove from plugins array:
runtimeErrorOverlay(),
cartographer(),
devBanner({ bannerColor: '#0ea5e9' }),
```

In `package.json`, remove these devDependencies:
```json
"@replit/vite-plugin-cartographer": "...",
"@replit/vite-plugin-dev-banner": "...",
"@replit/vite-plugin-runtime-error-modal": "..."
```

## Overview

InstantPDF is a full-stack web application providing a comprehensive suite of PDF manipulation tools. Users can merge, split, compress, convert, rotate, unlock, watermark, and perform many other PDF operations directly in the browser. The application follows a privacy-first approach where PDF files are processed in-memory and never stored on the server.

**Domain**: instantpdf.in

## Features

- 25+ PDF manipulation tools
- Modern responsive UI with dark/light theme
- User authentication with role-based access
- Usage limits (anonymous: 8/day, free: 15/day, pro: unlimited)
- Admin dashboard with analytics
- Privacy-first: No PDF files stored on server

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui with Radix UI primitives
- **Animations**: Framer Motion
- **Build Tool**: Vite

### Backend
- **Node.js Server**: Express.js for API routing and static files
- **PDF Processing**: Go backend (`pdf-backend/`) for all PDF operations
- **Proxy Pattern**: Express proxies `/api/pdf/*` to Go backend on port 8080

### Database
- **PostgreSQL** with Drizzle ORM
- Tables: users, pdf_usage, pdf_operations, billing_settings
- PDF Files: Processed in-memory only (never stored)

## Deployment Guide

### Prerequisites
- Node.js 18+
- Go 1.21+
- PostgreSQL 14+
- System dependencies: Ghostscript, Poppler-utils

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:5432/instantpdf
SESSION_SECRET=your-random-secret-here
NODE_ENV=production
```

### Installation Steps

1. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

2. **Build Go backend**:
   ```bash
   cd pdf-backend
   go build -o pdf-backend
   cd ..
   ```

3. **Run database migrations**:
   ```bash
   npm run db:push
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Start the server**:
   ```bash
   npm start
   ```

### Port Configuration
- Frontend: Port 5000 (configurable)
- Go Backend: Port 8080 (internal)

## Admin Setup

To create an admin user, first register normally, then update via SQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/:id/plan` - Update user plan
- `POST /api/admin/users/:id/disable` - Disable user
- `POST /api/admin/users/:id/enable` - Enable user

## Future Integrations

### Stripe (Billing)
- `billing_settings` table prepared with `stripe_enabled` flag (default: false)
- Enable via admin endpoint when Stripe is configured

### Email (Contact Form)
- Contact form shows success message but doesn't send emails yet
- Add Resend or SendGrid when ready

## AWS Disaster Recovery

See `docs/AWS_DISASTER_RECOVERY.md` for:
- Daily encrypted PostgreSQL backups
- Cross-account S3 storage
- Restore procedures

## API Reference

PDF operations at `/api/pdf/`:
- `/api/pdf/merge` - Combine PDFs
- `/api/pdf/split` - Split PDF
- `/api/pdf/compress` - Reduce file size
- `/api/pdf/rotate` - Rotate pages
- `/api/pdf/protect` - Add password
- `/api/pdf/unlock` - Remove password
- And 20+ more operations

## License

MIT
