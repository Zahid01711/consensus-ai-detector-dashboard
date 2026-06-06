# Consensus AI Detector Dashboard (Unified Multi-Detector AI Review Platform)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-blue.svg)](https://nextjs.org/)

An open-source, highly polished **Unified AI Detector Consensus Dashboard** that aggregates writing reviews from multiple AI detection providers (such as Sapling, WasItAIGenerated, GPTZero, and Copyleaks) into a single, cohesive consensus score. 

Originally developed as an Honors Research Project, this platform has been fully open-sourced to provide educators, researchers, and students with a fair, multi-perspective evaluation tool that reduces false-positives and statistical biases inherent in single-detector models.

---

## 🚀 Key Features

* **Consolidated Consensus Scoring**: Automatically averages results from active detector APIs (e.g., perplexity, burstiness, and probability classifiers) to calculate a **Consolidated AI Risk Score**. Offline or failed scans are dynamically filtered out.
* **Out-of-the-Box Demo / Mock Mode**: No API keys? No problem. The seeder defaults all providers to **Mock Mode**, allowing you to instantly test file uploads, queue tasks, and view final reports with simulated latency and deterministic results.
* **Background Asynchronous Scanning**: Avoids HTTP timeout failures. Spawns database-backed background jobs processed asynchronously outside the main request thread.
* **AES-256-GCM Encryption at Rest**: Fully secures provider credentials in memory. API keys are encrypted at rest and never exposed to the frontend.
* **Hybrid Text Extraction**: Direct server-side parsers for PDFs (utilizing `pdf-parse` classes), Word Documents (`mammoth`), and plain text.
* **Role-Based Access Control (RBAC)**: Custom signed JWT cookies separating student reviewer workspaces from admin dashboard controls.
* **Detailed Audit Trails**: Keeps an immutable, admin-viewable audit log tracking logins, setting changes, permission updates, and scan jobs.

---

## 🛠️ Tech Stack

* **Frontend & Backend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons
* **Database & ORM**: SQLite (Default for local testing) or PostgreSQL (Production fallback), mapped via Prisma ORM
* **Authentication**: Custom signed JWTs stored in secure, HttpOnly session cookies
* **PDF Report Generation**: jsPDF (client-side) & ReportLab (operations report compiler)

---

## ⚙️ Quick Start (Local Setup)

### 1. Prerequisites
* **Node.js**: Version 20 or higher (Node 24 fully supported)
* **Git**: To clone the project

### 2. Clone the Repository
```bash
git clone https://github.com/Zahid01711/consensus-ai-detector-dashboard.git
cd consensus-ai-detector-dashboard
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Switch to local SQLite (Recommended for testing)
To run without setting up Docker or a PostgreSQL instance, configure the project to use a local SQLite file database:
```bash
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\switch-to-sqlite.ps1
```
This automatically updates the Prisma schema and creates your local `.env` configuration.

### 5. Setup Environment File
Copy the example template to create your environment variables:
```bash
cp .env.example .env
```
*(Optionally edit `.env` to input your live `SAPLING_API_KEY`, `COPYLEAKS_API_KEY`, or `WASITAIGENERATED_API_KEY` to test in Live mode instead of Mock mode).*

### 6. Initialize & Seed Database
Build the database tables and populate the default demo accounts:
```bash
npx prisma db push
npx prisma db seed
```

### 7. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔐 Default Demo Login Credentials
The seeder creates default profiles pre-configured in **Mock Mode** for immediate verification:

* **Teacher / Admin Account**:
  * **Email**: `admin@school.edu`
  * **Password**: `AdminPass123`
* **Student Reviewer Account 1**:
  * **Email**: `student1@school.edu`
  * **Password**: `StudentPass123`
* **Student Reviewer Account 2**:
  * **Email**: `student2@school.edu`
  * **Password**: `StudentPass123`

---

## 🚀 Deployment & Production Hosting

### Deploying to Vercel + Neon (PostgreSQL)
To host the dashboard online for team access:
1. Create a free PostgreSQL instance on **Neon.tech** or **Supabase.com** and copy the database connection URI.
2. Push your project to GitHub (remember, `.env` and `prisma/dev.db` are gitignored and safe).
3. Connect your repository to Vercel.
4. Define your production environment variables in the Vercel dashboard:
   * `DATABASE_URL`: Your transaction PostgreSQL connection string.
   * `DIRECT_URL`: Your direct session PostgreSQL connection string (for migrations).
   * `JWT_SECRET`: A secure random string for signing JWT cookies.
   * `ENCRYPTION_KEY`: A random 32-byte hexadecimal string (64 characters) to encrypt API keys.
5. Set Vercel's build command to run database migrations before compiling:
   ```bash
   npx prisma db push && next build
   ```

---

## 🤝 Contributing & Community
We welcome contributions from researchers, software developers, and students! Whether you want to add new AI detector adapters (e.g., Winston AI, Writer, ZeroGPT), fix visual layouts, or improve text extraction scripts:

1. **Fork** the repository.
2. Create a feature branch: `git checkout -b feature/cool-new-adapter`.
3. Commit your changes: `git commit -m "Add GPTZero adapter support"`.
4. **Push** to the branch: `git push origin feature/cool-new-adapter`.
5. Submit a **Pull Request**.

Please review the issues tab to find open tasks, or create a new issue to discuss proposed features.

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
