const fs = require('fs');
const path = require('path');

// Mock browser environment for jsPDF to run in Node.js
global.self = global;
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.window = {
  document: {
    createElementNS: () => ({
      setAttribute: () => {},
      appendChild: () => {},
    }),
    createElement: () => ({
      getContext: () => ({
        measureText: () => ({ width: 0 }),
        fillText: () => {},
      }),
    }),
  },
};
global.navigator = { userAgent: 'node' };

const { jsPDF } = require('jspdf');

function generateManual() {
  console.log('Generating PDF Manual...');
  const doc = new jsPDF();
  
  const navy = [15, 23, 42];
  const indigo = [49, 46, 129];
  const slate = [71, 85, 105];

  // --- PAGE 1: TITLE PAGE ---
  doc.setFillColor(...navy);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('MULTI-DETECTOR AI\nREVIEW DASHBOARD', 20, 90);

  doc.setFillColor(79, 70, 229); // indigo button style line
  doc.rect(20, 115, 40, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(200, 200, 255);
  doc.text('Platform Operations & Integration Guide', 20, 128);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Created for: Dr. Mohan & Honors Research Program', 20, 240);
  doc.text('Version: 1.0.0 (Production Ready)', 20, 248);
  doc.text('Date: June 2026', 20, 256);

  // --- PAGE 2: ARCHITECTURE & TEXT EXTRACTION ---
  doc.addPage();
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('1. System Architecture & Workflow', 15, 25);
  
  doc.setFillColor(...slate);
  doc.rect(15, 29, 180, 0.5, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate);

  let text = `The Multi-Detector AI Review Dashboard consolidates assessments from multiple AI detection providers (such as GPTZero, Copyleaks, Sapling, Winston AI, Originality.ai, and BrandWell) into a single, clean user interface.

Data Flow and Workflow:
1. File Upload: Students drag-and-drop or select document files (PDF, DOCX, or TXT).
2. Validation: The API verifies that the file size complies with limits (configured by teachers, defaulting to 10MB) and validates the extension type.
3. Hybrid Text Extraction:
   - For PDF documents, the system uses 'pdf-parse' (pure JS) to extract text elements from the buffer.
   - For Word documents, 'mammoth' extracts raw text from the XML structure of the DOCX container.
   - Plain text is decoded directly from UTF-8 buffers.
4. Asynchronous Queue Processing:
   - Rather than blocking the HTTP connection, the API writes 'Scan' and 'ScanJob' records to the database in a PENDING state and returns immediately.
   - A background queue runner is launched asynchronously in Next.js.
   - The queue processor loops through pending ScanJobs, retrieves configurations, decrypts API keys, communicates with individual APIs, saves raw provider responses for audit logs, and marks jobs as COMPLETED or FAILED.
   - When all jobs for a scan finish, the queue processor computes the simple average of successful scans and updates the main Scan record.`;

  let splitText = doc.splitTextToSize(text, 180);
  doc.text(splitText, 15, 38);

  // --- PAGE 3: API ENCRYPTION & ADAPTERS ---
  doc.addPage();
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('2. Security & API Key Encryption', 15, 25);
  
  doc.setFillColor(...slate);
  doc.rect(15, 29, 180, 0.5, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate);

  text = `To meet security requirements, all provider API credentials must be secured at rest and never exposed to the frontend.

Symmetric Encryption at Rest:
- API keys and custom config emails are encrypted using the AES-256-GCM symmetric algorithm.
- During encryption, a random 12-byte Initialization Vector (IV) is generated.
- The ciphertext, IV, and the authentication tag are concatenated as 'iv:tag:ciphertext' and stored in the database.
- Decryption is performed in the secure backend environment just prior to calling provider API endpoints.
- If the master ENCRYPTION_KEY env variable is missing or invalid, the platform derives a key using SHA-256 of the JWT_SECRET to prevent system crashes.

Provider Adapters:
- The system defines a standard TypeScript 'ProviderAdapter' interface.
- Adapters handle URL endpoints, authorization header payloads, and response parsing.
- Each adapter has a Simulator/Mock mode. When enabled, the adapter returns a deterministic, realistic score based on a hash of the text, along with mock JSON data. This allows complete platform testing and demos with zero paid credits.`;

  splitText = doc.splitTextToSize(text, 180);
  doc.text(splitText, 15, 38);

  // --- PAGE 4: TEACHER & ADMIN MANUAL ---
  doc.addPage();
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('3. Teacher & Administrator Manual', 15, 25);
  
  doc.setFillColor(...slate);
  doc.rect(15, 29, 180, 0.5, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate);

  text = `Teachers logged in as Administrator can manage the system across several sections:

1. Dashboard Summary:
   - View system statistics including total documents scanned, active platforms, failed scan count, and total student reviewer accounts.
   - View recent document reviews and track student activity.
2. Provider Keys Management:
   - Configure credentials for active providers.
   - Toggle specific providers into Simulator Mode or Live Mode.
   - Enable or disable providers globally.
   - Click 'Test Connection' to verify API key validity in real-time.
3. Student Account Configuration:
   - Add new student reviewer credentials.
   - View allowed platforms list for each student reviewer.
   - Modify permissions: toggle which providers a student has access to.
4. Security Audit Logs:
   - Read immutable records of logins, account creation, settings modifications, and scan requests. Include timestamps, user details, actions, and client IP addresses.
5. System Settings:
   - Configure file size upload limit (1MB - 100MB).
   - Configure data retention period. Scans and document text older than this period are auto-purged from the database to maintain storage limits.`;

  splitText = doc.splitTextToSize(text, 180);
  doc.text(splitText, 15, 38);

  // --- PAGE 5: STUDENT REVIEWER MANUAL ---
  doc.addPage();
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('4. Student Reviewer Manual', 15, 25);
  
  doc.setFillColor(...slate);
  doc.rect(15, 29, 180, 0.5, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate);

  text = `Student reviewers are restricted to document upload, scan tracking, and report retrieval:

1. Dashboard & Upload Center:
   - View a drag-and-drop uploader area to select PDF, Word (.docx), or Plain Text (.txt) files.
   - View a checklist of AI detection platforms enabled for them. Students cannot see or use providers that are globally offline or not assigned to their account.
   - Select specific providers and run a scan.
2. Tracking Scan Progress:
   - When a scan starts, the page redirects to a progress view.
   - The page polls backend status every 1.5 seconds and renders a completion percentage.
   - Renders individual cards showing if each provider is Pending, Processing, Completed, or Failed.
3. Interactive Reports:
   - Once scanning is complete, students can view the consolidated score.
   - View detailed individual provider cards.
   - Read the exact plain text extracted from the document.
   - Click 'Download PDF Report' to save an official report.
4. Review History:
   - The student dashboard lists all past scans they have run. Clicking 'View Report' re-opens any report immediately.`;

  splitText = doc.splitTextToSize(text, 180);
  doc.text(splitText, 15, 38);

  // --- PAGE 6: SCORING LOGIC & DISCLAIMER ---
  doc.addPage();
  doc.setTextColor(...navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('5. Scoring Logic & Disclaimers', 15, 25);
  
  doc.setFillColor(...slate);
  doc.rect(15, 29, 180, 0.5, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate);

  text = `Combined Score Calculation:
- The system calculates the Consolidated AI Risk Indicator using a simple average of successful provider runs.
- Disabled, missing-key, failed, or timed-out provider scans are automatically excluded from the calculation.
- Example: If GPTZero returns 20% AI probability, BrandWell returns 40% AI probability, and Winston AI fails/times out, the consolidated score is (20 + 40) / 2 = 30%.

Confidence Warnings:
- If fewer than two provider results were successfully completed, the report displays a prominent warning: "Limited confidence: fewer than two detector results were available."
- This alerts the instructor that the consolidate score is derived from a single active source.

AI Detection Platform Limitations:
- The dashboard displays clear warnings indicating that AI-detector results must be treated as indicators of generated text risk, not final proof.
- False positives occur, particularly with technical jargon, formulaic writing, or non-native English writing.
- Results should be used as secondary flags to prompt manual draft review, reference checking, and student interviews.`;

  splitText = doc.splitTextToSize(text, 180);
  doc.text(splitText, 15, 38);

  // Write manual PDF to disk
  const dirPath = path.join(__dirname, '..', 'doc');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, 'manual.pdf');
  const pdfOutput = doc.output();
  fs.writeFileSync(filePath, pdfOutput, 'binary');
  console.log('PDF Manual generated successfully at:', filePath);
}

generateManual();
