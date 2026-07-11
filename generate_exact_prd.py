import os
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class SimplePRD(FPDF):
    def header(self):
        # Draw a subtle top accent bar on every page
        self.set_fill_color(16, 124, 65) # Emerald Green
        self.rect(0, 0, 210, 8, "F")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

def build_pdf(filename="FarmBuddy_PRD.pdf"):
    pdf = SimplePRD(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(20, 20, 20)
    pdf.add_page()
    
    # Document Title
    pdf.set_font("Helvetica", "B", 24)
    pdf.set_text_color(20, 40, 30)
    pdf.cell(0, 12, "Farm Buddy PRD", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(8)
    
    # Section 1
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "1. Product Overview", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 6, "Farm Buddy is a smart agriculture platform designed to help farmers monitor crops, maintain farm records, and provide supply chain traceability using AI and blockchain.")
    pdf.ln(5)
    
    # Section 2
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "2. Problem Statement", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 6, "Farmers face crop diseases, lack of proper records, no supply chain transparency, and consumers cannot verify product authenticity.")
    pdf.ln(5)
    
    # Section 3
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "3. Objectives", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    objectives = [
        "AI-based crop guidance",
        "Digital farm records",
        "Disease detection",
        "Supply chain traceability",
        "Consumer trust"
    ]
    for obj in objectives:
        pdf.cell(10, 6, "-", new_x=XPos.RIGHT, new_y=YPos.LAST)
        pdf.cell(0, 6, obj, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)
    
    # Section 4
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "4. Target Users", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 6, "Primary: Farmers", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, "Secondary: Buyers, Consumers, Distributors", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)
    
    # Section 5
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "5. Core Features", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    features = [
        "Farmer Dashboard",
        "Crop Health Monitoring",
        "AI Chatbot (Gemini API)",
        "Activity Logging",
        "QR Code Generation",
        "Supply Chain Traceability"
    ]
    for feat in features:
        pdf.cell(10, 6, chr(149), new_x=XPos.RIGHT, new_y=YPos.LAST) # Bullet point bullet
        pdf.cell(0, 6, feat, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)
    
    # Section 6
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "6. Technology Stack", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 6, "Frontend: React.js, Tailwind CSS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, "Backend: Node.js, Express.js", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, "Database: MySQL", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, "AI: Gemini API", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, "Blockchain: Solidity (Future Phase)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)
    
    # Section 7
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "7. System Flow", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(60, 60, 60)
    flow_steps = [
        "1. Farmer Actions: Planting / Irrigation / Fertilization / Harvest / Lab Test etc.",
        "2. Data Ingestion Layer: Web/Mobile App, Farm Buddy Voice App, IoT Sensors.",
        "3. Backend API (Node.js/Express): Validates data, assigns Batch ID and timestamps.",
        "4. MySQL Database: Stores complete batch, event, operator, and sensor details.",
        "5. Hashing Engine: Generates SHA-256 hash of event data (Chain of Custody).",
        "6. File Storage (IPFS): Uploads lab reports/images, receives IPFS CID/URI.",
        "7. Smart Contract: recordFarmEvent(batchId, ipfsHash, dataHash, timestamp) on-chain.",
        "8. Blockchain Ledger: Stores Batch ID, Data Hash, IPFS CID, and Transaction ID.",
        "9. Batch Ready for Market: Quality checked and approved.",
        "10. QR Code Generation: Generates unique QR code with Batch ID and tracking URL.",
        "11. QR Code Printed on Packaging.",
        "12. Consumer Scans QR Code: Scans using any smartphone.",
        "13. Consumer Portal (Web App): Queries Blockchain and Backend API for Batch ID.",
        "14. Display Traceability Timeline: Displays crop events, sensors, and IPFS reports.",
        "15. Verification Process: Recalculates hash and fetches blockchain hash.",
        "16. Hash Match Verification: Compares recalculated hash with on-chain hash.",
        "17A. Verified: Hashes match. Data is authentic and untampered.",
        "17B. Tampered: Hashes do not match. Data is flagged as modified or corrupted."
    ]
    for step in flow_steps:
        pdf.cell(0, 5, step, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)
    
    # Add Page 2
    pdf.add_page()
    
    # Section 8
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "8. Functional Requirements", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    reqs = [
        ("FR1: User Registration/Login"),
        ("FR2: Add Farm Details"),
        ("FR3: Upload Crop Images"),
        ("FR4: AI Analysis"),
        ("FR5: Store Activity Logs"),
        ("FR6: Generate QR Codes")
    ]
    for req in reqs:
        pdf.cell(0, 6, req, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)
    
    # Section 9
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "9. Non-Functional Requirements", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 6, "Fast response, secure storage, scalability, simple UI, multilingual support")
    pdf.ln(5)
    
    # Section 10
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "10. Future Scope", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 6, "IoT integration, weather forecasting, smart irrigation, blockchain verification, market prediction")
    pdf.ln(5)
    
    # Conclusion
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(16, 124, 65)
    pdf.cell(0, 8, "Conclusion", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 6, "Farm Buddy aims to modernize agriculture through AI-powered assistance and transparent product traceability.")
    
    # Save PDF
    pdf.output(filename)
    print(f"[Success] Exact PRD successfully written to: {filename}")

if __name__ == "__main__":
    build_pdf()
