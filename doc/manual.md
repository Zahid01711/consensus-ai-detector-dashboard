# Multi-Detector AI Review Dashboard - Platform Operations Manual

Welcome to the Multi-Detector AI Review Dashboard! This document explains how the platform operates, how API keys are secured, how scores are calculated, and how instructors (Admin/Teacher) and students (Reviewer) operate the system.

---

## 1. System Architecture & Workflow

The Multi-Detector AI Review Dashboard is designed as a monolithic Next.js App Router application written in TypeScript and styled with Tailwind CSS. It connects to a database (PostgreSQL in production, SQLite in development) via Prisma ORM.

### Async Background Scan Workflow:
1. **User Uploads File**: A student reviewer uploads a document (PDF, DOCX, or TXT) via the drag-and-drop interface.
2. **Input Validation**: The API validates that the file size complies with limits (configured by teachers, defaulting to 10MB) and checks the file extension.
3. **Text Extraction**:
   - **PDF Extractor**: Text elements are parsed directly from the buffer using `pdf-parse` (pure JS, server-side).
   - **Word Extractor**: Raw XML-based text is extracted from `.docx` files using `mammoth`.
   - **Plain Text**: Content is decoded directly from UTF-8 buffers.
4. **Queue Initialization**:
   - The server creates a `Scan` record and a `ScanJob` record for each enabled provider. All records start in the `PENDING` state.
   - An asynchronous function is launched immediately, and the API returns a success response with the `scanId` to the frontend, redirecting the user to the Scan Progress page.
5. **Background Task Processing**:
   - The queue processor loops through pending `ScanJob`s, fetches decrypted API keys, calls individual provider adapters, captures response metrics, and writes raw responses and scores to the database.
   - Once all provider sub-tasks complete (or fail), the processor averages the scores, sets the overall status, and creates a system audit trail.

---

## 2. Security & API Key Encryption at Rest

To meet strict academic security compliance, all provider API credentials must be secured at rest and never exposed to the client side.

### AES-256-GCM Encryption:
- API credentials (such as GPTZero keys or Copyleaks client keys) are encrypted using Node's native `crypto` library with the symmetric `aes-256-gcm` algorithm.
- For each record, a random 12-byte **Initialization Vector (IV)** is generated.
- The ciphertext, IV, and the GCM **Authentication Tag** are concatenated as `iv.hex:authTag.hex:ciphertext.hex` and stored in the `apiKeyEncrypted` database field.
- **Master Encryption Key**: Managed via the `ENCRYPTION_KEY` environment variable (must be a 32-byte hex string). If not configured, the platform derives a key using SHA-256 of the `JWT_SECRET` for development ease.
- **Data Protection**: API keys are only decrypted in memory on the server just before invoking the provider API. They are never sent to the frontend (the `sanitizedProviders` API returns `isConfigured: true/false` instead of keys).

---

## 3. Consolidated Scoring Logic & Disclaimer

The platform consolidates independent assessments to evaluate text authenticity.

### Combined Score Algorithm:
- The system calculates the combined score using a **simple average** of all successful detector scans.
- **Fail-Safe Exclusions**: Providers that are globally disabled, have missing keys, or throw API errors (e.g. timeouts or invalid keys) are automatically excluded.
- **Example**: If GPTZero returns **20%**, BrandWell returns **40%**, and Winston AI fails, the combined score is `(20 + 40) / 2 = 30%`.

### Confidence Warning Flags:
- If **fewer than two** providers return scores successfully, the report displays a warning banner:
  > **Limited confidence: fewer than two detector results were available.**
  This alerts the teacher that the consolidated score represents a single platform's check and lacks cross-verification.

### AI Risk Indicator Disclaimer:
- The consolidated score is presented as an **"AI-Risk Indicator"**, never as guaranteed proof.
- **Warning text displayed on reports:**
  > *AI-detector results represent statistical probability metrics. They estimate the likelihood of machine generation but are not guaranteed proof of academic dishonesty. Results should be reviewed alongside student drafts and reference verification.*

---

## 4. User Role Operations Guide

The dashboard implements Role-Based Access Control (RBAC) separating administrative tasks from text scanning.

### Role 1: Teacher / Administrator
Instructors manage credentials and monitor student activity:
1. **Overview Dashboard**: Monitor total scans, active platform counts, failed runs, and registered students. Review recent scans and audit log logs.
2. **Provider Settings**:
   - Manage API keys for GPTZero, Copyleaks, Sapling, BrandWell, Originality.ai, and Winston AI.
   - Configure **Simulator / Mock Mode** for each provider. When Mock Mode is active, adapters return deterministic, realistic scores based on a text hash (saving API credits).
   - Test credentials instantly by clicking **Test Connection**.
3. **Student Accounts**:
   - Create student reviewer accounts.
   - Set individual provider permissions for each student. Students can only check text against platforms enabled for them.
4. **Audit Logs**: Review a read-only ledger of all logins, key updates, student creations, and scan starts for accountability.
5. **System Settings**: Adjust file size limits and configure data retention limits.

### Role 2: Student Reviewer
Students upload and review documents:
1. **Upload Center**: Upload documents (PDF, DOCX, TXT) and select which assigned providers to scan against.
2. **Track Scan Progress**: View real-time progress bars as background queue jobs complete.
3. **Interactive Reports**:
   - Read the consolidated score, rating category (Low/Moderate/High risk), and warnings.
   - View individual provider cards.
   - Read the extracted document plain text in a code container.
   - Download a styled, official PDF report by clicking **Download PDF Report**.
   - Review past scans and reports from the dashboard history table.
