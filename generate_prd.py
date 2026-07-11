import os
from fpdf import FPDF

class PRD_PDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            # Running header for pages after the cover page
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 10, "FarmBuddy - Product Requirement Document (PRD)", border=0, ln=1, align="L")
            self.set_draw_color(200, 200, 200)
            self.line(self.l_margin, 18, self.w - self.r_margin, 18)
            self.ln(5)

    def footer(self):
        if self.page_no() > 1:
            # Footer for pages after the cover page
            self.set_y(-15)
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(100, 100, 100)
            # Line above footer
            self.set_draw_color(220, 220, 220)
            self.line(self.l_margin, self.h - 18, self.w - self.r_margin, self.h - 18)
            # Page number
            page_text = f"Page {self.page_no()} of {{nb}}"
            self.cell(0, 10, page_text, border=0, align="R")

def build_prd(filename="FarmBuddy_PRD.pdf"):
    pdf = PRD_PDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.alias_nb_pages()
    
    # ------------------ COVER PAGE ------------------
    pdf.add_page()
    
    # Decorative elements on Cover
    pdf.set_fill_color(16, 124, 65) # Emerald green
    pdf.rect(0, 0, 10, 297, "F")
    
    pdf.set_xy(25, 45)
    pdf.set_font("Helvetica", "B", 32)
    pdf.set_text_color(20, 40, 30)
    pdf.cell(0, 12, "FarmBuddy", ln=1)
    
    pdf.set_xy(25, 58)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(16, 124, 65) # Emerald green
    pdf.cell(0, 10, "Trust & Trace Agronomic Ledger", ln=1)
    
    pdf.set_xy(25, 70)
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, "Product Requirement Document (PRD)", ln=1)
    
    pdf.line(25, 80, 180, 80)
    
    # Description block
    pdf.set_xy(25, 95)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(80, 80, 80)
    desc = ("A decentralized crop cultivation tracking platform integrating real-time telemetry, "
            "automated QA compliance pipelines, SHA-256 ledger integrity validation, and a "
            "multimodal AI Voice/Vision Assistant powered by Google Gemini.")
    pdf.multi_cell(145, 6, desc)
    
    # Metadata Block at bottom of Cover Page
    pdf.set_xy(25, 220)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 6, "Metadata & Project Control", ln=1)
    
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(90, 90, 90)
    pdf.cell(45, 5, "Author:", border=0)
    pdf.cell(0, 5, "FarmBuddy Product Engineering Team", ln=1)
    pdf.cell(45, 5, "Target Release Version:", border=0)
    pdf.cell(0, 5, "v3.0.0 (Multimodal AI & Offline Ledger)", ln=1)
    pdf.cell(45, 5, "Document Date:", border=0)
    pdf.cell(0, 5, "June 15, 2026", ln=1)
    pdf.cell(45, 5, "Status:", border=0)
    pdf.cell(0, 5, "Approved / Production Ready", ln=1)
    
    # ------------------ PAGE 2: TABLE OF CONTENTS & REVISION ------------------
    pdf.add_page()
    
    # Header block
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 10, "Document Control & History", ln=1)
    pdf.ln(3)
    
    # Table of Revision History
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(60, 60, 60)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(20, 7, "Version", border=1, fill=True)
    pdf.cell(25, 7, "Date", border=1, fill=True)
    pdf.cell(50, 7, "Author", border=1, fill=True)
    pdf.cell(75, 7, "Description of Change", border=1, ln=1, fill=True)
    
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(20, 6, "v1.0.0", border=1)
    pdf.cell(25, 6, "2026-04-10", border=1)
    pdf.cell(50, 6, "Product Lead", border=1)
    pdf.cell(75, 6, "Initial Release: Traceability core", border=1, ln=1)
    
    pdf.cell(20, 6, "v2.0.0", border=1)
    pdf.cell(25, 6, "2026-05-18", border=1)
    pdf.cell(50, 6, "AI Architect", border=1)
    pdf.cell(75, 6, "V1 Assistant & Telemetry UI", border=1, ln=1)
    
    pdf.cell(20, 6, "v3.0.0", border=1)
    pdf.cell(25, 6, "2026-06-15", border=1)
    pdf.cell(50, 6, "Lead Engineer", border=1)
    pdf.cell(75, 6, "Gemini Multimodal AI & Report Export", border=1, ln=1)
    
    pdf.ln(8)
    
    # Sections Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 10, "Table of Contents", ln=1)
    pdf.ln(2)
    
    # Table of Contents
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(50, 50, 50)
    
    sections = [
        ("1. Executive Summary & Product Vision", "3"),
        ("2. Architecture & Tech Stack", "3"),
        ("3. User Personas & Scenarios", "4"),
        ("4. Functional Requirements", "4"),
        ("   4.1 Farmer Dashboard & Live Telemetry", "4"),
        ("   4.2 Batch Tracking & Cultivation Timeline", "4"),
        ("   4.3 QA Audit, Compliance & Verification Hub", "5"),
        ("   4.4 Multimodal Gemini AI Voice/Vision Assistant", "5"),
        ("5. Security, Ledger Integrity & Tamper Testing", "6"),
        ("6. Non-Functional Requirements", "6"),
        ("7. Future Scope & Roadmap", "6")
    ]
    
    for title, pg in sections:
        # Dot leaders
        dots = "." * (75 - len(title))
        pdf.cell(10, 6, "")
        pdf.cell(100, 6, f"{title} {dots}")
        pdf.cell(0, 6, pg, ln=1, align="R")
        
    # ------------------ PAGE 3: CONTENT SECTIONS 1 & 2 ------------------
    pdf.add_page()
    
    # Section 1
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 40, 30)
    pdf.cell(0, 8, "1. Executive Summary & Product Vision", ln=1)
    pdf.ln(2)
    
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    summary_text = (
        "FarmBuddy is built to address the lack of supply-chain transparency and real-time agronomic validation "
        "in the specialty agriculture market. Modern consumers demand verified proof of sustainability, pesticide-free "
        "cultivation, and ethical labor standards. FarmBuddy satisfies this need by bridging the gap between "
        "field operations (farmers) and oversight audits (QA compliance/Consumers).\n\n"
        "The application provides a tamper-evident digital tracking ledger. Every agricultural activity, "
        "from soil testing to sowing, drip watering, and harvest, is hashed into a sequential cryptographic block. "
        "Auditors can verify that the logs have not been tampered with. To optimize daily operations, a hands-free "
        "multimodal AI Voice Assistant is integrated directly, allowing busy farmers to record events on the go, "
        "analyze leaf pathogen photographs, and request weather/soil diagnostics using natural spoken dialogue."
    )
    pdf.multi_cell(0, 5, summary_text)
    pdf.ln(6)
    
    # Section 2
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 40, 30)
    pdf.cell(0, 8, "2. Architecture & Tech Stack", ln=1)
    pdf.ln(2)
    
    # Bullet points for Tech Stack
    tech_stack = [
        ("Frontend Application", "Single Page Application built using React (v19) and Vite. Styled with modern custom CSS and Tailwind configurations supporting seamless Dark Mode toggling. Icons provided via Lucide React."),
        ("Backend Web Server", "Express.js RESTful API handling batch metadata storage, blockchain audit logging, PDF/CSV report generation, and third-party AI interfaces."),
        ("AI Core Integrations", "Google Gemini API key-authenticated endpoints: 'gemini-3-flash-preview' for rapid conversational text processing, voice command intent classification, and audio transcribing; 'gemini-3-pro-preview' for advanced leaf/disease image analysis."),
        ("Storage & Cryptography", "Dual database model supporting a Production MySQL relational storage schema alongside a portable JSON Fallback database structure (`database.json`) for offline sandboxing. SHA-256 hash chaining links adjacent blocks."),
        ("Web Audio & Speech Engine", "Utilizes the client browser's Web Speech API (SpeechRecognition and SpeechSynthesis) primed on user click gestures to ensure autoplay compatibility without blocking threads.")
    ]
    
    for title, desc in tech_stack:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(16, 124, 65)
        pdf.cell(10, 5, "")
        pdf.cell(0, 5, f"- {title}", ln=1)
        
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(70, 70, 70)
        pdf.cell(15, 4, "")
        pdf.multi_cell(0, 4.5, desc)
        pdf.ln(2)

    # ------------------ PAGE 4: PERSONAS & FUNCTIONAL 4.1 & 4.2 ------------------
    pdf.add_page()
    
    # Section 3
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 40, 30)
    pdf.cell(0, 8, "3. User Personas & Scenarios", ln=1)
    pdf.ln(2)
    
    personas = [
        ("Farmer (e.g. John Doe)", "Requires a fast, hands-free mobile-friendly dashboard to track growth lifecycles, monitor air/soil moisture levels via remote IoT sensors, log water/fertilizer entries on the go using voice commands, and retrieve QR compliance passes for buyers."),
        ("QA Auditor (e.g. Alice Smith)", "Accesses the Admin Compliance panel to review chemical residual checks, approve or reject batch certification, inspect verification history, and download audit reports to CSV."),
        ("Consumer / Retail Buyer", "Scans the crop batch QR code to open the public Traceability Portal, verifying the exact timeline, location coordinates, water/carbon footprint, and cryptographic hashes of the cultivation history.")
    ]
    
    for name, details in personas:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(16, 124, 65)
        pdf.cell(0, 5, f"Persona: {name}", ln=1)
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(70, 70, 70)
        pdf.cell(5, 4, "")
        pdf.multi_cell(165, 4.5, details)
        pdf.ln(3)
        
    pdf.ln(4)
    
    # Section 4
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 40, 30)
    pdf.cell(0, 8, "4. Functional Requirements", ln=1)
    pdf.ln(2)
    
    # Sub-section 4.1
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 6, "4.1 Farmer Dashboard & Live Telemetry", ln=1)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(70, 70, 70)
    f_dash = (
        "The Dashboard serves as the central hub for active farm operations. It must display key KPIs: "
        "Active Batches, Fields Monitored, Upcoming Harvests, and Overall Health (calculated from QA metrics). "
        "It features live-updating telemetry blocks (Soil Moisture, Air Temp, soil pH, and Sunlight) "
        "represented by real-time SVG Sparklines rendering fluctuations. Low-moisture events (below 35%) "
        "automatically trigger warning banners with drip watering recommendations."
    )
    pdf.multi_cell(0, 5, f_dash)
    pdf.ln(4)
    
    # Sub-section 4.2
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 6, "4.2 Batch Tracking & Cultivation Timeline", ln=1)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(70, 70, 70)
    f_batch = (
        "Users must be able to initialize new crop batches (inputting Crop Type, seed date, location coordinates, "
        "and custom soil types) which automatically assigns a unique, sequential block ID (e.g. `FB-2026-003`). "
        "Farmers append logs (Irrigation, Fertilizer, Protection, Harvest) to the batch timeline. "
        "Each log records the operator ID, timestamp, custom metadata payload, previous block hash, and "
        "an IPFS content identifier (CID) simulating decentralized storage."
    )
    pdf.multi_cell(0, 5, f_batch)

    # ------------------ PAGE 5: FUNCTIONAL 4.3 & 4.4 ------------------
    pdf.add_page()
    
    # Sub-section 4.3
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 6, "4.3 QA Audit, Compliance & Verification Hub", ln=1)
    pdf.ln(1)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(70, 70, 70)
    f_audit = (
        "Administrators inspect harvested batches marked as 'In Quality Check'. The panel allows "
        "Alice Smith to trigger chemical residual testing, input quality scores, and select 'Approve QA' "
        "(changing status to QA Approved and generating a secure ledger seal) or 'Reject QA' (flagging the "
        "batch with detailed reasons). \n\n"
        "Audit data must support a high-fidelity CSV report download ('Export Audit Report'). "
        "The export compiles batch ID, crop type, dates, compliance status, carbon footprints, "
        "and cryptographic hashes directly into a downloadable table. All reports utilize non-blocking "
        "React state callbacks, avoiding synchronous thread freezes."
    )
    pdf.multi_cell(0, 5, f_audit)
    pdf.ln(5)
    
    # Sub-section 4.4
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 6, "4.4 Multimodal Gemini AI Voice/Vision Assistant", ln=1)
    pdf.ln(1)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(70, 70, 70)
    f_ai = (
        "The FarmBuddy AI assistant operates as a floating persistent widget with four main tabs:\n"
        "1. Chat: Standard conversational input offering quick shortcuts (Soil Audit, Weather, Blockchain).\n"
        "2. Vision (Crop): Enables camera capture or image uploads of crop leaves. Gemini 3 Pro analyzes the "
        "visual data to output a detailed disease diagnosis, confidence score, and bulleted recommendations.\n"
        "3. Voice Cmd: Integrated Web Speech recognition. Spoken commands are parsed on the server by Gemini "
        "to classify intents. Commands like 'Add irrigation entry of 500 liters for batch FB-2026-001' "
        "automatically write to the database and redirect the view. Commands like 'generate report' download the CSV.\n"
        "4. History Logs: Chronological record of all text conversations, voice commands, and diagnostic images."
    )
    pdf.multi_cell(0, 5, f_ai)
    pdf.ln(4)
    
    # Speeches Synthesis Callout Box
    pdf.set_fill_color(240, 248, 244) # Very soft green
    pdf.set_draw_color(16, 124, 65)
    pdf.rect(15, pdf.get_y(), 180, 26, "FD")
    
    pdf.set_y(pdf.get_y() + 2)
    pdf.set_x(20)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 5, "TECHNICAL NOTE: SpeechSynthesis Autoplay Priming", ln=1)
    
    pdf.set_x(20)
    pdf.set_font("Helvetica", "I", 8.5)
    pdf.set_text_color(80, 80, 80)
    note_text = (
        "Browsers block programmatic SpeechSynthesis.speak() requests unless activated inside a user-triggered "
        "gesture (like a click). FarmBuddy solves this by priming the audio engine (executing cancel() and "
        "speaking an empty utterance) when the user clicks the microphone or a quick-command bubble. This "
        "allows the subsequent async backend response to bypass autoplay block and speak out loud instantly."
    )
    pdf.multi_cell(170, 4, note_text)
    pdf.ln(10)

    # ------------------ PAGE 6: SECURITY, NON-FUNCTIONAL & ROADMAP ------------------
    pdf.add_page()
    
    # Section 5
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 40, 30)
    pdf.cell(0, 8, "5. Security, Ledger Integrity & Tamper Testing", ln=1)
    pdf.ln(2)
    
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    sec_text = (
        "Ledger safety is modeled using cryptographic block hashing. When a batch is approved, its entire state "
        "(overview, pre-cultivation checks, QA metrics) is serialized and hashed. In the QA Hub, administrators "
        "can click 'Simulate Tamper' to inject random characters into the batch details. If the user runs the "
        "ledger verification, the current calculated hash will deviate from the original blockchain seal, "
        "marking the batch as 'Tampered' in red and logging the incident. Clicking 'Restore Integrity' pulls "
        "the original state back from the immutable chain, recovering the ledger health."
    )
    pdf.multi_cell(0, 5, sec_text)
    pdf.ln(6)
    
    # Section 6
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 40, 30)
    pdf.cell(0, 8, "6. Non-Functional Requirements", ln=1)
    pdf.ln(2)
    
    nfrs = [
        ("Responsiveness & Design", "The interface must load in under 1.5 seconds. The layout must adjust dynamically to standard tablet, mobile, and desktop views. The design system uses rich dark green and sandy tones with high contrast to ensure readability in bright sunlight."),
        ("Offline Fail-Safe", "The server must automatically detect MySQL DB unavailability and switch to the local `database.json` fallback, allowing uninterrupted operations in rural environments with poor connectivity."),
        ("Error Resilience", "API calls to the Gemini model must fail gracefully. If Gemini is rate-limited or keyless, the system must trigger local conversational fallbacks, avoiding application crashes.")
    ]
    
    for title, desc in nfrs:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(16, 124, 65)
        pdf.cell(10, 5, "")
        pdf.cell(0, 5, f"- {title}", ln=1)
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(70, 70, 70)
        pdf.cell(15, 4, "")
        pdf.multi_cell(0, 4.5, desc)
        pdf.ln(2)
        
    pdf.ln(4)
    
    # Section 7
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(20, 40, 30)
    pdf.cell(0, 8, "7. Future Scope & Roadmap", ln=1)
    pdf.ln(2)
    
    roadmap_text = (
        "Phase 1: Multi-farmer tenant permissions, separating private field metrics.\n"
        "Phase 2: Direct integrations with Bluetooth soil and leaf-humidity sensor arrays.\n"
        "Phase 3: Deploying real Hedera Hashgraph or Ethereum smart contracts to replace local simulated hashes.\n"
        "Phase 4: Advanced voice commands for machine control (irrigation valves, automated seed drill units)."
    )
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 5, roadmap_text)
    
    # Save PDF
    pdf.output(filename)
    print(f"[Success] PRD successfully written to: {filename}")

if __name__ == "__main__":
    build_prd()
