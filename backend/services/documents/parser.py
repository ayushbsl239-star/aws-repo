"""
Document text parser for PDF, DOCX, and TXT files.
Extracts clean, sanitized text for Bedrock competency analysis.
"""
import io
from typing import Optional
from backend.utils.errors import ValidationError
from backend.utils.logger import logger

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None


def extract_text_from_bytes(file_bytes: bytes, file_name: str, max_chars: int = 15000) -> str:
    """Extracts text content from uploaded file bytes based on file extension."""
    lower_name = file_name.lower()

    if lower_name.endswith(".txt"):
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1", errors="ignore")
        return text[:max_chars].strip()

    elif lower_name.endswith(".pdf"):
        if pypdf is None:
            raise ValidationError("PDF parsing library not available in environment.")
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for i, page in enumerate(reader.pages[:10]):  # Limit to first 10 pages
                extracted = page.extract_text()
                if extracted:
                    pages_text.append(extracted)
            full_text = "\n".join(pages_text)
            if not full_text.strip():
                raise ValidationError("PDF file contains no extractable text (it may be a scanned image).")
            return full_text[:max_chars].strip()
        except Exception as e:
            logger.error(f"Error extracting PDF: {str(e)}")
            raise ValidationError("Could not parse PDF document.")

    elif lower_name.endswith(".docx"):
        if docx is None:
            raise ValidationError("DOCX parsing library not available in environment.")
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            full_text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
            return full_text[:max_chars].strip()
        except Exception as e:
            logger.error(f"Error extracting DOCX: {str(e)}")
            raise ValidationError("Could not parse DOCX document.")

    else:
        raise ValidationError(f"Unsupported file type for {file_name}. Please upload PDF, DOCX, or TXT.")
