import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Heuristic regex to identify potential section titles in clinical text
SECTION_REGEX = re.compile(
    r"^(?:Section\s+\d+|Chapter\s+\d+|\d+\.\d+|\d+\.\s+[A-Z]|[A-Z\s]{4,30}$)",
    re.MULTILINE
)

def detect_section_title(text: str, current_section: str = "Clinical Guidance") -> str:
    """
    Attempts to identify section headings in the text chunk.
    """
    lines = [line.strip() for line in text.split(". ") if line.strip()]
    for line in lines[:3]:
        if 4 <= len(line) <= 60 and SECTION_REGEX.match(line):
            return line
    return current_section

def chunk_pages(
    pages: List[Dict[str, Any]],
    chunk_size: int = 1000,
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Chunks document pages into structured chunks.
    Preserves:
    - page_number
    - section_title
    - chunk_index
    - content
    """
    chunks = []
    chunk_index = 0
    current_section = "Clinical Guidance"

    for page_info in pages:
        page_num = page_info["page_number"]
        page_text = page_info["text"]

        if not page_text:
            continue

        # Check for section title update
        current_section = detect_section_title(page_text, current_section)

        # If page text is within chunk size, keep as single chunk
        if len(page_text) <= chunk_size:
            chunks.append({
                "chunk_index": chunk_index,
                "content": page_text,
                "page_number": page_num,
                "section_title": current_section
            })
            chunk_index += 1
            continue

        # Otherwise split with sliding window
        start = 0
        while start < len(page_text):
            end = start + chunk_size
            chunk_text = page_text[start:end]

            # Try to break at a period or sentence boundary if possible
            if end < len(page_text):
                last_period = chunk_text.rfind(". ")
                if last_period > chunk_size // 2:
                    end = start + last_period + 1
                    chunk_text = page_text[start:end]

            clean_chunk = chunk_text.strip()
            if len(clean_chunk) > 40:
                chunks.append({
                    "chunk_index": chunk_index,
                    "content": clean_chunk,
                    "page_number": page_num,
                    "section_title": current_section
                })
                chunk_index += 1

            start += (chunk_size - chunk_overlap)

    logger.info(f"Generated {len(chunks)} chunks across {len(pages)} pages.")
    return chunks
