# Multi-Detector AI Review Dashboard

A secure, academic-focused web application where teachers/administrators can manage AI-detection provider credentials, customize student permission policies, and audit uploads. Student reviewers can upload documents (PDF, Word, TXT), perform consolidated scans against enabled providers, and download official assessment reports.

The platform relies **only** on official APIs (no scraping) and provides a highly polished, premium minimalist UI.

---

## 🚀 Key Features

* **Consolidated Scoring**: Automatically calculates a simple average of completed provider checks to generate an **AI-risk indicator**. Excludes offline, missing-key, or failed provider scans and flags single-platform results.
* **Security at Rest**: Provider API keys are encrypted at rest using AES-256-GCM and never exposed to the frontend.
* **Asynchronous Scanning**: Splits scans into separate provider jobs processed in the background, preventing connection timeouts.
* **Role-Based Access Control**: Strict middleware filters separating admin settings (credentials, student permissions, system configs) from student upload workspaces.
* **Detailed Audit Trails**: Implements an immutable log ledger tracking student logins, credential updates, account changes, and scan details.
* **Hybrid Text Extraction**: Direct Node-based extractors for PDF (`pdf-parse`) and DOCX (`mammoth`), plus an optional Python FastAPI extractor service.
* **Simulator/Mock Mode**: Full platform evaluation can run locally with simulated provider latency and deterministic scores without paid API credentials.

---

## 🛠️ Tech Stack

* **Frontend & Backend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Lucide React
* **Database & ORM**: PostgreSQL (SQLite fallback for dev), Prisma ORM
* **Authentication**: Custom signed JWTs stored in secure, HttpOnly session cookies
* **PDF Report Generation**: jsPDF (client-side) & ReportLab (operations guide compiler)

---

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma           # Active Prisma schema (Postgres default)
│   ├── schema.sqlite.prisma    # SQLite fallback schema
│   └── seed.ts                 # Database seeder (creates default admin & student accounts)
├── src/
│   ├── middleware.ts           # Route guard & RBAC cookie check
│   ├── app/
│   │   ├── page.tsx            # Redirection router
│   │   ├── login/              # Secure credentials login page
│   │   ├── admin/              # Teacher dashboards & settings
│   │   ├── student/            # Student upload panels & progress tracking
│   │   ├── reports/            # Consolidated scan reports
│   │   └── api/                # REST endpoints (auth, admins, scans)
│   ├── components/
│   │   ├── ui/                 # Custom Tailwind UI component kit (Button, Card, Table, etc.)
│   │   └── Sidebar.tsx         # Sidebar navigation
│   └── lib/
│       ├── db.ts               # Prisma client singleton
│       ├── encryption.ts       # AES-255-GCM API key encryption
│       ├── session.ts          # JWT session sign/verify utilities
│       ├── extractor.ts        # Server-side text parser
│       ├── queue.ts            # Database-backed background worker
│       └── adapters/           # API integration adapters (GPTZero, Copyleaks, etc.)
├── doc/
│   └── manual.pdf              # Compiled operations guide PDF
├── extractor-service/          # Optional Python FastAPI extraction service
└── scripts/
    └── generate_manual_pdf.py  # ReportLab script to compile the manual
```

---

## ⚙️ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: Version 20 or higher (Node 24 is fully supported)
- **Database**: PostgreSQL (or SQLite, see step 3)

### 2. Install Dependencies
Run the package installer in the project root:
```bash
npm install
```

### 3. Choose Your Database Provider
By default, the project is configured for **PostgreSQL**. A `docker-compose.yml` file is provided in the root to boot a local container easily:
```bash
docker-compose up -d
```

#### Fallback to SQLite (No Setup Required):
If you do not have PostgreSQL or Docker running, you can switch the project to use a local **SQLite** file by running the included utility:
```bash
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\switch-to-sqlite.ps1
```
This automatically updates your active schema and configures the connection string in your `.env`.

### 4. Setup Environment Config
Create your `.env` file (copied automatically if using the SQLite switch script):
```bash
cp .env.example .env
```
Ensure `JWT_SECRET` and `ENCRYPTION_KEY` (32-byte hex string) are configured.

### 5. Initialize the Database
Push the schema structure and run the seeder:
```bash
# Push schema structure
npx prisma db push

# Seed default credentials and provider list
npx prisma db seed
```

### 6. Run the Next.js App
Start the local development server:
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

---

## 🔐 Seed Credentials

The seeder creates three default profiles with **Mock Mode** pre-configured:

* **Teacher/Admin Account**:
  - Email: `admin@school.edu`
  - Password: `AdminPass123`
* **Student Reviewer 1**:
  - Email: `student1@school.edu`
  - Password: `StudentPass123`
* **Student Reviewer 2**:
  - Email: `student2@school.edu`
  - Password: `StudentPass123`

---

## 📖 PDF Manual & Documentation

A complete operations guide explaining keys configuration, combined scoring mathematics, and student workflows has been compiled to:
- [manual.pdf](file:///F:/UNCP_Reaserch/dr. mohan honors ai detection/doc/manual.pdf) (ReportLab Compiled PDF)
- [manual.md](file:///F:/UNCP_Reaserch/dr. mohan honors ai detection/doc/manual.md) (Source Markdown text)

To recompile the manual PDF at any time, run:
```bash
python scripts/generate_manual_pdf.py
```
