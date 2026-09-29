"""
PDF Report Generator for AI Adaptive Interview Coach using ReportLab.
Produces a clean, professional PDF assessment summary suitable for candidate download.
"""
import io
import time
from typing import Any, Dict, List

def generate_simple_pdf_bytes(
    candidate_name: str,
    role: str,
    experience: str,
    readiness_score: float,
    skill_profile: Dict[str, Any],
    report_data: Dict[str, Any],
    questions: List[Dict[str, Any]],
) -> bytes:
    """Generates PDF report bytes using ReportLab."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#1e1b4b')
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569')
        )
        section_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=colors.HexColor('#4f46e5'),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyTextCustom',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#1e293b')
        )

        story = []

        # Title Block
        story.append(Paragraph("AI Adaptive Interview Coach — Candidate Assessment Report", title_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph(
            f"<b>Candidate:</b> {candidate_name} &nbsp;|&nbsp; <b>Role:</b> {role} ({experience}) &nbsp;|&nbsp; <b>Date:</b> {time.strftime('%Y-%m-%d %H:%M')}",
            subtitle_style
        ))
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceBefore=4, spaceAfter=12))

        # Readiness Score Box
        score_html = f"""
        <table width="100%" bgcolor="#f8fafc" style="border: 1px solid #e2e8f0; padding: 10px;">
          <tr>
            <td>
              <font size="14" color="#4f46e5"><b>Interview Readiness Score: {readiness_score} / 100</b></font><br/><br/>
              <font size="8.5" color="#64748b"><i>Disclaimer: This score reflects performance against this platform's objective technical interview rubric. It is not a hiring probability.</i></font>
            </td>
          </tr>
        </table>
        """
        story.append(Paragraph(score_html, body_style))
        story.append(Spacer(1, 10))

        # Competencies Table
        story.append(Paragraph("Competency Performance Breakdown", section_style))
        table_data = [["Competency / Skill", "Rolling Score", "Status"]]
        for skill, val in list(skill_profile.items())[:8]:
            score_num = val.get("current_score", val) if isinstance(val, dict) else val
            status = "Strong" if score_num >= 7.5 else ("Proficient" if score_num >= 5.0 else "Needs Practice")
            table_data.append([str(skill), f"{score_num} / 10.0", status])

        if len(table_data) > 1:
            t = Table(table_data, colWidths=[240, 140, 160])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4f46e5')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 9.5),
                ('BOTTOMPADDING', (0,0), (-1,0), 6),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8fafc')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
                ('FONTSIZE', (0,1), (-1,-1), 9),
            ]))
            story.append(t)
            story.append(Spacer(1, 10))

        # Feedback & Action Plan
        story.append(Paragraph("Key Strengths & Growth Areas", section_style))
        strengths = report_data.get("strengths", ["Demonstrated clear logical structure in answers."])
        developments = report_data.get("key_development_areas", report_data.get("weak_areas", ["Deepen trade-off analysis."]))

        str_text = "<b>Strengths:</b><br/>" + "<br/>".join([f"• {s}" for s in strengths[:4]])
        dev_text = "<br/><br/><b>Development Areas:</b><br/>" + "<br/>".join([f"• {d}" for d in developments[:4]])
        story.append(Paragraph(str_text + dev_text, body_style))
        story.append(Spacer(1, 10))

        # Build PDF document
        doc.build(story)
        return buffer.getvalue()

    except Exception as e:
        # Minimal pure PDF fallback
        buffer = io.BytesIO()
        content = f"%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj\n4 0 obj << /Length 50 >> stream\nBT /F1 12 Tf 50 700 Td (Interview Report - {candidate_name}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \ntrailer << /Root 1 0 R >>\n%%EOF"
        return content.encode("utf-8")
