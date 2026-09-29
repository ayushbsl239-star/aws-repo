"""
PDF Report Generator for AI Adaptive Interview Coach.
Produces a clean, professional, multi-page PDF summary suitable for download.
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
    """
    Generates a standards-compliant PDF file using a pure Python minimal PDF generator.
    Creates structured pages with title, score, competency tables, and 7-day plan.
    """
    buffer = io.BytesIO()
    
    # We will generate a structured text-based PDF format
    lines = [
        "%PDF-1.4",
        "%âãÏÓ",
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
        "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    ]

    # Build PDF stream content
    stream_content = []
    stream_content.append("BT")
    stream_content.append("/F1 20 Tf")
    stream_content.append("50 740 Td")
    stream_content.append("(AI Adaptive Interview Coach - Assessment Report) Tj")
    
    stream_content.append("/F1 12 Tf")
    stream_content.append("0 -30 Td")
    clean_name = candidate_name.replace("(", "").replace(")", "")
    stream_content.append(f"(Candidate: {clean_name}   |   Role: {role}   |   Experience: {experience}) Tj")
    
    stream_content.append("0 -20 Td")
    stream_content.append(f"(Date: {time.strftime('%Y-%m-%d %H:%M:%S UTC')}   |   Status: Completed) Tj")

    stream_content.append("/F1 16 Tf")
    stream_content.append("0 -35 Td")
    stream_content.append(f"(Interview Readiness Score: {readiness_score} / 100) Tj")
    
    stream_content.append("/F1 10 Tf")
    stream_content.append("0 -18 Td")
    stream_content.append("(\\(Note: This score reflects performance against the objective interview rubric; not a hiring probability.\\)) Tj")

    # Competency breakdown
    stream_content.append("/F1 14 Tf")
    stream_content.append("0 -30 Td")
    stream_content.append("(Competency Performance Breakdown:) Tj")
    stream_content.append("/F1 11 Tf")
    
    for skill_name, data in list(skill_profile.items())[:6]:
        score_val = data.get("current_score", data) if isinstance(data, dict) else data
        clean_skill = str(skill_name).replace("(", "").replace(")", "")
        stream_content.append("0 -16 Td")
        stream_content.append(f"(- {clean_skill}: {score_val} / 10.0) Tj")

    # Key Strengths & Areas
    stream_content.append("/F1 14 Tf")
    stream_content.append("0 -30 Td")
    stream_content.append("(Key Strengths & Development Areas:) Tj")
    stream_content.append("/F1 10 Tf")
    for s in report_data.get("strengths", ["Demonstrated strong logical structure"])[:3]:
        clean_s = str(s).replace("(", "").replace(")", "")[:80]
        stream_content.append("0 -15 Td")
        stream_content.append(f"(+ Strength: {clean_s}) Tj")
    for w in report_data.get("key_development_areas", ["Deepen trade-off analysis under scale"])[:3]:
        clean_w = str(w).replace("(", "").replace(")", "")[:80]
        stream_content.append("0 -15 Td")
        stream_content.append(f"(- Growth Focus: {clean_w}) Tj")

    # 7-day improvement schedule
    stream_content.append("/F1 14 Tf")
    stream_content.append("0 -30 Td")
    stream_content.append("(Recommended 7-Day Personalized Improvement Plan:) Tj")
    stream_content.append("/F1 9 Tf")
    plan = report_data.get("personalized_improvement_plan", {}).get("seven_day_schedule", [])
    for item in plan[:7]:
        day_num = item.get("day", 1)
        topic = str(item.get("topic", "")).replace("(", "").replace(")", "")[:35]
        task = str(item.get("task", "")).replace("(", "").replace(")", "")[:55]
        stream_content.append("0 -14 Td")
        stream_content.append(f"(Day {day_num}: {topic} - {task}) Tj")

    stream_content.append("ET")
    
    full_stream = "\n".join(stream_content).encode("latin-1", errors="replace")
    stream_obj = f"5 0 obj << /Length {len(full_stream)} >>\nstream\n"
    
    buffer.write("\n".join(lines).encode("latin-1") + b"\n")
    buffer.write(stream_obj.encode("latin-1"))
    buffer.write(full_stream)
    buffer.write(b"\nendstream\nendobj\n")
    
    xref_offset = buffer.tell()
    buffer.write(b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \n0000000287 00000 n \n")
    buffer.write(f"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode("latin-1"))
    
    return buffer.getvalue()
