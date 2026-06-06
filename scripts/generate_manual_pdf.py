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
    print("Compiling operations manual PDF...")
    
    # Establish document target
    doc_dir = os.path.join(os.path.dirname(__file__), "..", "doc")
    if not os.path.exists(doc_dir):
        os.makedirs(doc_dir)
    pdf_path = os.path.join(doc_dir, "manual.pdf")
    
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
    
    # Custom colors
    navy = colors.HexColor("#0f172a") # Slate 900
    indigo = colors.HexColor("#312e81") # Indigo 900
    slate = colors.HexColor("#475569") # Slate 600
    
    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.white,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#c7d2fe"), # Indigo 200
        spaceAfter=150
    )
    
    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#94a3b8") # Slate 400
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=navy,
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=indigo,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=slate,
        spaceAfter=10
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-BoldOblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#92400e") # Amber 800
    )

    story = []

    # ================= PAGE 1: COVER PAGE =================
    # Create cover page elements by setting top spacer to position title
    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph("MULTI-DETECTOR AI<br/>REVIEW DASHBOARD", title_style))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Platform Operations & Integration Guide", subtitle_style))
    story.append(Spacer(1, 1.0 * inch))
    story.append(Paragraph("Created for: Dr. Mohan & Honors Research Program", meta_style))
    story.append(Paragraph("Version: 1.0.0 (Production Ready)", meta_style))
    story.append(Paragraph("Date: June 2026", meta_style))
    story.append(PageBreak())

    # ================= PAGE 2: ARCHITECTURE =================
    story.append(Paragraph("1. System Architecture & Workflow", h1_style))
    story.append(Paragraph(
        "The Multi-Detector AI Review Dashboard consolidates assessments from multiple AI detection providers "
        "(such as GPTZero, Copyleaks, Sapling, Winston AI, Originality.ai, and BrandWell) into a single, clean user interface.",
        body_style
    ))
    story.append(Paragraph("Data Flow and Workflow Steps:", h2_style))
    story.append(Paragraph("• <b>File Upload</b>: Student reviewers upload a document (PDF, DOCX, or TXT) via the dashboard interface.", bullet_style))
    story.append(Paragraph("• <b>Validation</b>: The server verifies size constraints (default 10MB) and checks file extensions.", bullet_style))
    story.append(Paragraph("• <b>Hybrid Text Extraction</b>: For PDF files, the system uses 'pdf-parse' (pure JS) to extract text. For DOCX documents, 'mammoth' parses raw text from XML buffers. TXT is decoded directly from UTF-8.", bullet_style))
    story.append(Paragraph("• <b>Asynchronous Task Queue</b>: The server creates PENDING Scan and ScanJob database records and redirects the user to the tracking view. An asynchronous runner in Next.js handles processing outside of the HTTP request thread.", bullet_style))
    story.append(Paragraph("• <b>Scan Execution</b>: The processor fetches provider configs, decrypts API keys, communicates with individual platforms, and records response logs in the database.", bullet_style))
    story.append(PageBreak())

    # ================= PAGE 3: SECURITY & ENCRYPTION =================
    story.append(Paragraph("2. Security & API Key Encryption at Rest", h1_style))
    story.append(Paragraph(
        "To satisfy strict academic privacy and security compliance, all third-party provider API credentials must be secured "
        "at rest and must never be sent to the client side.",
        body_style
    ))
    story.append(Paragraph("Symmetric Encryption Model:", h2_style))
    story.append(Paragraph(
        "All API keys and custom configuration details are encrypted using the AES-256-GCM symmetric algorithm. "
        "During database insertion, a random 12-byte Initialization Vector (IV) is generated. The ciphertext, IV, and GCM "
        "authentication tag are concatenated and saved in the database. Decryption is performed in memory just before "
        "executing HTTP requests. The API keys are never exposed on the frontend; client requests only receive configuration flags.",
        body_style
    ))
    story.append(Paragraph("Connection Testing:", h2_style))
    story.append(Paragraph(
        "Administrators can test provider connection status instantly via the Provider Keys tab, verifying credential validity "
        "against live endpoints before enabling scans.",
        body_style
    ))
    story.append(PageBreak())

    # ================= PAGE 4: TEACHER WORKFLOW =================
    story.append(Paragraph("3. Teacher & Administrator Manual", h1_style))
    story.append(Paragraph(
        "Instructors logged in as Administrator manage the platform's keys, accounts, permissions, and audit logs.",
        body_style
    ))
    story.append(Paragraph("Administrative Capabilities:", h2_style))
    story.append(Paragraph("• <b>Dashboard Statistics</b>: Track total scans, active platform counts, failed runs, and registered students.", bullet_style))
    story.append(Paragraph("• <b>Provider Keys</b>: Input and encrypt API credentials, toggle mock simulation, and run connection checks.", bullet_style))
    story.append(Paragraph("• <b>Student Accounts</b>: Create student credentials and adjust permissions to enable or disable specific providers per user.", bullet_style))
    story.append(Paragraph("• <b>Security Audit Logs</b>: Monitor an immutable log of login attempts, settings updates, user creation, and scans.", bullet_style))
    story.append(Paragraph("• <b>Global Configuration</b>: Set upload size boundaries and define the storage retention period (e.g., 30 days) to auto-delete old logs for privacy compliance.", bullet_style))
    story.append(PageBreak())

    # ================= PAGE 5: STUDENT WORKFLOW =================
    story.append(Paragraph("4. Student Reviewer Manual", h1_style))
    story.append(Paragraph(
        "Student reviewers are restricted to text scanning, progress tracking, and report exports.",
        body_style
    ))
    story.append(Paragraph("Student Capabilities & Views:", h2_style))
    story.append(Paragraph("• <b>Upload Panel</b>: Drag-and-drop file interface with a checklist of allowed detection systems assigned to their account.", bullet_style))
    story.append(Paragraph("• <b>Tracking Progress</b>: Real-time progress indicators showing Pending, Processing, Completed, or Failed states for each platform task.", bullet_style))
    story.append(Paragraph("• <b>Interactive Reports</b>: Detailed view showing overall risk indicators, individual platform scores, response latencies, and extracted text snippets.", bullet_style))
    story.append(Paragraph("• <b>PDF Export</b>: Click 'Download PDF Report' to download a beautifully styled PDF summary directly.", bullet_style))
    story.append(Paragraph("• <b>Review History</b>: A log of all previous scans uploaded by the student. Past reports can be reopened at any time.", bullet_style))
    story.append(PageBreak())

    # ================= PAGE 6: SCORING & DISCLAIMER =================
    story.append(Paragraph("5. Scoring Logic & Disclaimers", h1_style))
    story.append(Paragraph("Combined Score Logic:", h2_style))
    story.append(Paragraph(
        "The Consolidated AI Risk Indicator is computed as a simple average of successful provider scores. "
        "Failed, timed-out, or disabled scans are automatically excluded. For instance, if GPTZero returns 25% "
        "and Sapling returns 45%, the combined indicator is (25 + 45) / 2 = 35%.",
        body_style
    ))
    story.append(Paragraph("Confidence Flags:", h2_style))
    story.append(Paragraph(
        "If fewer than two provider scans are successful, the report displays a warning banner: "
        "<i>'Limited confidence: fewer than two detector results were available.'</i>",
        body_style
    ))
    story.append(Paragraph("Academic Disclaimer:", h2_style))
    story.append(Paragraph(
        "All report views display prominent disclaimers explaining that scores are statistical risk estimates, "
        "not guaranteed proof of academic dishonesty. Results should prompt manual review, reference checks, and "
        "direct conversations with students rather than serving as the final determination.",
        body_style
    ))

    # Setup page templates
    def draw_cover(canvas, doc):
        canvas.saveState()
        # Navy blue cover page background
        canvas.setFillColor(navy)
        canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=True, stroke=False)
        canvas.restoreState()

    def draw_later_pages(canvas, doc):
        canvas.saveState()
        # Header line
        canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
        canvas.setLineWidth(1)
        canvas.line(54, doc.pagesize[1] - 40, doc.pagesize[0] - 54, doc.pagesize[1] - 40)
        
        # Header text
        canvas.setFont('Helvetica-Bold', 7.5)
        canvas.setFillColor(indigo)
        canvas.drawString(54, doc.pagesize[1] - 35, "MULTI-DETECTOR AI REVIEW DASHBOARD - MANUAL")
        
        # Footer text
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(slate)
        canvas.drawString(54, 30, "Confidential - Academic Review Platform Operations Guide")
        canvas.drawRightString(doc.pagesize[0] - 54, 30, f"Page {doc.page}")
        canvas.restoreState()

    # Build document
    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_later_pages)
    print("PDF Manual created successfully at:", pdf_path)

if __name__ == "__main__":
    build_pdf()
