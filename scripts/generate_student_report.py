import os
import sys

def check_and_install_reportlab():
    try:
        import reportlab
    except ImportError:
        print("ReportLab library not found. Installing reportlab...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])

check_and_install_reportlab()

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

def build_pdf():
    print("Compiling Honors Project Report PDF...")
    
    # Establish document target
    doc_dir = os.path.join(os.path.dirname(__file__), "..", "doc")
    if not os.path.exists(doc_dir):
        os.makedirs(doc_dir)
    pdf_path = os.path.join(doc_dir, "project_report.pdf")
    
    # Setup document
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    # Setup styles
    styles = getSampleStyleSheet()
    
    # Custom colors matching the dashboard's professional aesthetics
    navy = colors.HexColor("#0f172a") # Slate 900
    indigo = colors.HexColor("#1e1b4b") # Deep indigo
    slate = colors.HexColor("#334155") # Slate 700
    gray_border = colors.HexColor("#cbd5e1") # Slate 300
    
    # Custom typography
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=colors.white,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#a5b4fc"), # Indigo 300
        spaceAfter=180
    )
    
    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#94a3b8") # Slate 400
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=indigo,
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=14,
        textColor=colors.HexColor("#312e81"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=slate,
        spaceAfter=10
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=5
    )
    
    code_style = ParagraphStyle(
        'CodeCustom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=8
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=slate
    )

    story = []

    # ================= PAGE 1: COVER PAGE =================
    story.append(Spacer(1, 1.2 * inch))
    story.append(Paragraph("A CONSOLIDATED AI DETECTION DASHBOARD<br/>FOR ACADEMIC INTEGRITY", title_style))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Designing a Unified Multi-Platform Consensus Framework for Writing Review", subtitle_style))
    story.append(Spacer(1, 0.8 * inch))
    story.append(Paragraph("<b>Submitted by:</b> MD Zahidul Islam (Honors Program Student & Research Assistant)", meta_style))
    story.append(Paragraph("<b>Research Advisor:</b> Dr. Mohan", meta_style))
    story.append(Paragraph("<b>Institution:</b> Honors Research Program", meta_style))
    story.append(Paragraph("<b>Project Version:</b> 1.1.0 (Resource-Optimized Production Build)", meta_style))
    story.append(Paragraph("<b>Date:</b> June 2026", meta_style))
    story.append(PageBreak())

    # ================= PAGE 2: RESEARCH BACKGROUND =================
    story.append(Paragraph("1. Introduction & Research Background", h1_style))
    story.append(Paragraph(
        "The recent proliferation of Large Language Models (LLMs) like GPT-4, Claude, and Gemini has transformed "
        "written expression across professional and academic domains. However, in educational environments, "
        "distinguishing between student-authored work and machine-generated content has become a major challenge. "
        "Educators rely heavily on automated AI detection platforms to preserve academic integrity. "
        "However, individual AI detectors suffer from significant limitations:",
        body_style
    ))
    story.append(Paragraph("• <b>High False-Positive Rates</b>: Research shows that detectors are often biased against non-native English writers, misclassifying their natural sentence structures as machine-generated.", bullet_style))
    story.append(Paragraph("• <b>Statistical Heuristics</b>: Detectors rely on statistical metrics such as <i>Perplexity</i> (the measure of text unpredictability) and <i>Burstiness</i> (the variation in sentence structure and length over a document). Because these heuristics vary across providers, relying on a single detector is statistically risky.", bullet_style))
    story.append(Paragraph("• <b>Platform Divergence</b>: An essay might receive a high risk score on one detector and a zero risk score on another, leading to confusion and unfair academic investigations.", bullet_style))
    story.append(Paragraph("• <b>Financial & Rate Constraints</b>: API access for professional systems is costly, and free tiers are heavily rate-limited.", bullet_style))
    
    story.append(Paragraph("The Unified Consensus Model:", h2_style))
    story.append(Paragraph(
        "To mitigate these issues, this project introduces a <b>Consolidated Multi-Detector Review Dashboard</b>. "
        "By querying multiple active detection platforms concurrently and aggregating their results into a simple average "
        "(a consensus score), we decrease the probability of false-positives and avoid relying on a single vendor's "
        "heuristic bias. If a single platform fails, the consolidated score filters it out dynamically, offering "
        "educators a fairer, multi-perspective assessment tool.",
        body_style
    ))
    story.append(PageBreak())

    # ================= PAGE 3: TECHNICAL ARCHITECTURE =================
    story.append(Paragraph("2. Technical Architecture & Workflows", h1_style))
    story.append(Paragraph(
        "The project is implemented using the <b>Next.js 15 (App Router)</b> web framework, leveraging TypeScript, "
        "Prisma ORM, and Tailwind CSS. The design focuses on a clean, modern user experience with a strict separation "
        "of concerns. The database default is PostgreSQL, with a seamless script to fall back to a local SQLite instance.",
        body_style
    ))
    
    story.append(Paragraph("Core Functionalities & Mechanics:", h2_style))
    story.append(Paragraph("• <b>Hybrid Text Extraction</b>: When a file is uploaded, the backend inspects the document type. We use the modern, class-based <code>pdf-parse</code> library for extracting PDF text, <code>mammoth</code> for parsing DOCX XML structures, and standard UTF-8 buffer decoding for plain text files.", bullet_style))
    story.append(Paragraph("• <b>Asynchronous Queue Runner (queue.ts)</b>: Because AI detector API responses are network-bound and can take up to 15 seconds per request, calling them synchronously would result in web browser timeout errors. Instead, the server registers a database-backed job in a PENDING state, instantly redirects the user to the tracking page, and spawns an asynchronous worker process in the background. The user's page polls the status endpoint until the background runner updates the job states to completed.", bullet_style))
    story.append(Paragraph("• <b>Symmetric Encryption (encryption.ts)</b>: To satisfy academic privacy compliance and protect API credentials, third-party keys are encrypted at rest using AES-256-GCM. The encrypted text, random Initialization Vector (IV), and authentication tag are saved in the database. Decryption happens strictly in-memory during scan execution, and raw keys are never sent to the client browser.", bullet_style))
    story.append(Paragraph("• <b>Role-Based Access Control (RBAC)</b>: Admin pages (Provider Keys, Account Management, System Logs) are protected behind Next.js route middleware. Sessions are verified using custom JSON Web Tokens (JWT) stored in secure, HttpOnly cookies.", bullet_style))
    story.append(PageBreak())

    # ================= PAGE 4: RESOURCE QUOTA OPTIMIZATIONS =================
    story.append(Paragraph("3. Free-Tier Resource Quota Enhancements", h1_style))
    story.append(Paragraph(
        "AI detection platforms on the free tier enforce strict usage limits. When scanning lengthy academic papers "
        "(e.g., final exams of 4,000+ words), these constraints often block scans entirely. We implemented direct "
        "adapter level optimizations to resolve these failures while preserving scan accuracy:",
        body_style
    ))
    
    story.append(Paragraph("WasItAIGenerated Credit Optimization (402 Fix):", h2_style))
    story.append(Paragraph(
        "The WasItAIGenerated API charges exactly 1 credit per word scanned. On a free/trial tier (typically having less "
        "than 1,000 credits remaining), uploading a 4,500-word research guide will result in a <code>402 Insufficient Credits</code> "
        "failure. We resolved this by introducing **word count truncation**. The adapter automatically grabs and scans "
        "only the first **800 words** (~4,800 characters) of the text. Because statistical writing heuristics (perplexity and "
        "burstiness) remain consistent throughout a document, an 800-word sample is statistically representative for AI detection, "
        "while guaranteeing the scan stays within your credit limits.",
        body_style
    ))
    
    story.append(Paragraph("Sapling Rate Limit & Token Optimization (429 Fix):", h2_style))
    story.append(Paragraph(
        "Sapling enforces strict per-minute and per-token rate limits, resulting in frequent <code>429 Rate Limited</code> errors. "
        "We updated the Sapling adapter to truncate texts to **1,500 words** to avoid hitting token limits, and integrated an "
        "**automatic retry-once mechanism**. If Sapling returns a 429 status, the background worker pauses for 3 seconds "
        "and automatically retries the request. This prevents transient rate spikes from failing the student's scan.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # Add a beautiful table for comparison
    table_data = [
        [
            Paragraph("<b>Detector</b>", table_header_style),
            Paragraph("<b>Heuristic Metrics</b>", table_header_style),
            Paragraph("<b>Free Limits Encountered</b>", table_header_style),
            Paragraph("<b>Our Consensus Optimization</b>", table_header_style),
        ],
        [
            Paragraph("<b>WasItAIGenerated</b>", table_cell_style),
            Paragraph("Pattern probability analysis", table_cell_style),
            Paragraph("Charges 1 credit per word (exceeds balance on long texts)", table_cell_style),
            Paragraph("<b>Truncates to 800 words</b> to provide a statistically valid sample and prevent 402 errors.", table_cell_style),
        ],
        [
            Paragraph("<b>Sapling</b>", table_cell_style),
            Paragraph("Sentence-level perplexity scores", table_cell_style),
            Paragraph("Tokens-per-request limit & 429 per-minute rate limit", table_cell_style),
            Paragraph("<b>Truncates to 1500 words</b> and triggers an <b>auto-retry delay (3s)</b> on 429 warnings.", table_cell_style),
        ],
        [
            Paragraph("<b>Copyleaks</b>", table_cell_style),
            Paragraph("Sentence classification heuristics", table_cell_style),
            Paragraph("Requires enterprise enterprise plan (returns 404 for AI)", table_cell_style),
            Paragraph("Disabled globally (Offline Mode) to prevent false failed reviews.", table_cell_style),
        ],
    ]

    t = Table(table_data, colWidths=[1.1*inch, 1.8*inch, 1.8*inch, 2.3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), indigo),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, gray_border),
    ]))
    story.append(t)
    story.append(PageBreak())

    # ================= PAGE 5: LOCAL SETUP INSTRUCTIONS =================
    story.append(Paragraph("4. Local Run & Configuration Instructions", h1_style))
    story.append(Paragraph(
        "To run the project on your local computer, follow these step-by-step commands in your terminal (PowerShell or Bash):",
        body_style
    ))
    
    story.append(Paragraph("Step 1: Install Dependencies", h2_style))
    story.append(Paragraph("Run the package manager in the project root to download and install node packages:", body_style))
    story.append(Paragraph("<code>npm install</code>", code_style))
    
    story.append(Paragraph("Step 2: Choose Your Database (PowerShell SQLite Fallback)", h2_style))
    story.append(Paragraph("The default schema is PostgreSQL. To run locally without Docker or hosted databases, switch to a local SQLite database:", body_style))
    story.append(Paragraph("<code>powershell -ExecutionPolicy Bypass -File .\\switch-to-sqlite.ps1</code>", code_style))
    
    story.append(Paragraph("Step 3: Setup Environment Configuration", h2_style))
    story.append(Paragraph("Create the active environment variable file by copying the template:", body_style))
    story.append(Paragraph("<code>cp .env.example .env</code>", code_style))
    story.append(Paragraph("<i>Ensure that the <b>JWT_SECRET</b> and <b>ENCRYPTION_KEY</b> are set to secure random strings.</i>", body_style))
    
    story.append(Paragraph("Step 4: Initialize the Database", h2_style))
    story.append(Paragraph("Generate the database tables and run the seeder script to create default accounts and configure providers:", body_style))
    story.append(Paragraph("<code>npx prisma db push</code>", code_style))
    story.append(Paragraph("<code>npx prisma db seed</code>", code_style))
    
    story.append(Paragraph("Default Seed Credentials for Testing:", h2_style))
    story.append(Paragraph("The database seeder initializes the following default demo credentials:", body_style))
    story.append(Paragraph("• <b>Instructor/Admin Login</b>: <code>admin@school.edu</code> (Password: <code>AdminPass123</code>)", bullet_style))
    story.append(Paragraph("• <b>Student Reviewer 1 Login</b>: <code>student1@school.edu</code> (Password: <code>StudentPass123</code>)", bullet_style))
    story.append(Paragraph("• <b>Student Reviewer 2 Login</b>: <code>student2@school.edu</code> (Password: <code>StudentPass123</code>)", bullet_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Step 5: Run the Development Server", h2_style))
    story.append(Paragraph("Start the local Next.js dev server. It will run by default at port 3000:", body_style))
    story.append(Paragraph("<code>npm run dev</code>", code_style))
    story.append(Paragraph("Open <code>http://localhost:3000</code> in your browser.", body_style))
    story.append(PageBreak())

    # ================= PAGE 6: PRODUCTION DEPLOYMENT =================
    story.append(Paragraph("5. Production Deployment & Hosting Guide", h1_style))
    story.append(Paragraph(
        "To share the application with other students or faculty, you can deploy it online. Since Next.js requires "
        "a Node.js server environment for the queue worker and text extractors, we have two primary hosting options:",
        body_style
    ))
    
    story.append(Paragraph("Option A: Vercel (Frontend/Serverless) + Supabase/Neon (PostgreSQL)", h2_style))
    story.append(Paragraph(
        "This is the easiest and most cost-effective hosting option. Vercel hosts the Next.js app in a serverless environment.",
        body_style
    ))
    story.append(Paragraph("1. Create a free PostgreSQL database on <b>Supabase</b> (supabase.com) or <b>Neon</b> (neon.tech).", bullet_style))
    story.append(Paragraph("2. Get your connection string (e.g., <code>postgres://user:pass@host:5432/db</code>).", bullet_style))
    story.append(Paragraph("3. Push the project to GitHub (excluding the <code>.env</code> file).", bullet_style))
    story.append(Paragraph("4. Link your repository to Vercel (vercel.com). Under settings, set these environment variables:", bullet_style))
    story.append(Paragraph("   • <code>DATABASE_URL</code>: Set to the transaction connection string of your PostgreSQL database.", bullet_style))
    story.append(Paragraph("   • <code>DIRECT_URL</code>: Set to the session connection string of your PostgreSQL database (for migrations).", bullet_style))
    story.append(Paragraph("   • <code>JWT_SECRET</code>: A random 32-character string for securing student sessions.", bullet_style))
    story.append(Paragraph("   • <code>ENCRYPTION_KEY</code>: A random 32-byte hex string (64 characters) used for encrypting API keys at rest.", bullet_style))
    story.append(Paragraph("5. Set Vercel's build command to run migrations before building: <code>npx prisma db push && next build</code>.", bullet_style))
    
    story.append(Paragraph("Option B: Self-Hosting on Render or Railway (Docker/VPS)", h2_style))
    story.append(Paragraph(
        "If you want to continue using the simple SQLite file without setting up a hosted PostgreSQL database:",
        body_style
    ))
    story.append(Paragraph("1. Deploy the app to <b>Render.com</b> or <b>Railway.app</b> as a Web Service.", bullet_style))
    story.append(Paragraph("2. Add a <b>Persistent Volume/Disk</b> and mount it to the directory containing your database (e.g., <code>/app/prisma/dev.db</code>). This ensures your student accounts, settings, and logs aren't deleted when the server restarts.", bullet_style))
    story.append(Paragraph("3. Configure the environment variables in their dashboard settings.", bullet_style))
    story.append(Paragraph("4. Use build command: <code>npm install && npx prisma db push && npx prisma db seed && npm run build</code> and start command: <code>npm run start</code>.", bullet_style))
    
    # Setup page templates
    def draw_cover(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(navy)
        canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=True, stroke=False)
        canvas.restoreState()

    def draw_later_pages(canvas, doc):
        canvas.saveState()
        # Header line
        canvas.setStrokeColor(gray_border)
        canvas.setLineWidth(0.75)
        canvas.line(54, doc.pagesize[1] - 40, doc.pagesize[0] - 54, doc.pagesize[1] - 40)
        
        # Header text
        canvas.setFont('Helvetica-Bold', 7.5)
        canvas.setFillColor(indigo)
        canvas.drawString(54, doc.pagesize[1] - 35, "HONORS RESEARCH PROJECT - CONSOLIDATED AI DETECTION")
        
        # Footer text
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(slate)
        canvas.drawString(54, 30, "Honors Program Project Report & Documentation")
        canvas.drawRightString(doc.pagesize[0] - 54, 30, f"Page {doc.page}")
        canvas.restoreState()

    # Build document
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_later_pages)
    print("Project Report PDF created successfully at:", pdf_path)

if __name__ == "__main__":
    build_pdf()
