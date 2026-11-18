import os
import hashlib
import io
import logging
from typing import List, Dict, Any, Tuple
import httpx
from pypdf import PdfReader

logger = logging.getLogger(__name__)

def download_pdf(url: str, timeout: float = 60.0) -> Tuple[bytes, str]:
    """
    Downloads a PDF file from a given URL or local path and returns (pdf_bytes, sha256_checksum).
    Supports local file paths, httpx with browser headers, and fallback to curl.exe for strict WAFs.
    """
    if os.path.exists(url):
        logger.info(f"Loading PDF from local path: {url}")
        with open(url, "rb") as f:
            pdf_bytes = f.read()
        checksum = hashlib.sha256(pdf_bytes).hexdigest()
        return pdf_bytes, checksum

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf,application/octet-stream,*/*",
    }
    logger.info(f"Downloading PDF from: {url}")
    pdf_bytes = None

    try:
        with httpx.Client(timeout=timeout, follow_redirects=True, headers=headers) as client:
            response = client.get(url)
            if response.status_code == 200 and response.content.startswith(b"%PDF"):
                pdf_bytes = response.content
    except Exception as e:
        logger.warning(f"httpx download encountered issue: {e}")

    # Fallback to curl if httpx did not receive valid PDF bytes (e.g. strict Akamai/Cloudflare WAF)
    if not pdf_bytes or not pdf_bytes.startswith(b"%PDF"):
        logger.info(f"Attempting download via curl fallback for: {url}")
        import subprocess
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
            tmp_path = tmp_file.name
        try:
            # First try curl with default User-Agent
            cmd = ["curl.exe", "-L", "-s", "-o", tmp_path, url]
            subprocess.run(cmd, check=True, timeout=timeout)
            with open(tmp_path, "rb") as f:
                pdf_bytes = f.read()

            # If not PDF, try with browser User-Agent
            if not pdf_bytes.startswith(b"%PDF"):
                cmd = ["curl.exe", "-L", "-s", "-o", tmp_path, "-A", headers["User-Agent"], url]
                subprocess.run(cmd, check=True, timeout=timeout)
                with open(tmp_path, "rb") as f:
                    pdf_bytes = f.read()
        except Exception as ce:
            logger.error(f"curl fallback failed: {ce}")
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

    if not pdf_bytes or not pdf_bytes.startswith(b"%PDF"):
        raise ValueError(f"Downloaded content from {url} is not a valid PDF document (starts with {pdf_bytes[:20] if pdf_bytes else 'empty'}).")

    checksum = hashlib.sha256(pdf_bytes).hexdigest()
    logger.info(f"Downloaded {len(pdf_bytes)} bytes. Checksum: {checksum[:12]}...")
    return pdf_bytes, checksum

def extract_pages_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Parses a PDF from bytes and extracts text page-by-page, preserving 1-indexed page numbers.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(reader.pages)
    logger.info(f"Extracting text from {total_pages} PDF pages...")

    pages_data = []
    for idx, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
            # Clean excessive whitespace
            clean_text = " ".join(page_text.split())
            if clean_text:
                pages_data.append({
                    "page_number": idx,
                    "text": clean_text
                })
        except Exception as e:
            logger.warning(f"Failed to extract text from page {idx}: {e}")

    logger.info(f"Successfully extracted text from {len(pages_data)} pages.")
    return pages_data
