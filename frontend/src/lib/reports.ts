/**
 * reports.ts
 * Client-side helpers for downloading clinical decision reports (PDF / DOCX)
 * from the backend report generation API.
 *
 * Reports are ONLY downloadable after a clinical decision has been saved to the
 * database and a valid decisionId is available.
 */

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://127.0.0.1:8000';

/** Trigger a file download in the browser from a Blob */
function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Release object URL after a short delay to allow the download to start
  setTimeout(() => window.URL.revokeObjectURL(url), 2000);
}

/**
 * Download a PDF clinical report for a saved decision.
 * Calls GET /api/reports/decision/{decisionId}/pdf
 *
 * @param decisionId - UUID of the saved clinical_decisions record
 * @returns Promise that resolves when download is triggered, or rejects with an error message
 */
export async function downloadDecisionPDF(decisionId: string): Promise<void> {
  const url = `${BACKEND_URL}/api/reports/decision/${encodeURIComponent(decisionId)}/pdf`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/pdf' },
  });

  if (!response.ok) {
    let detail = `Server returned ${response.status}`;
    try {
      const json = await response.json();
      detail = json.detail || detail;
    } catch {
      // ignore parse error
    }
    throw new Error(`Failed to generate PDF report: ${detail}`);
  }

  const blob = await response.blob();

  // Prefer server-provided filename from Content-Disposition, fall back to default
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const filename = match ? match[1].replace(/['"]/g, '') : `Clinical_Report_${decisionId.slice(0, 8)}.pdf`;

  triggerDownload(blob, filename);
}

/**
 * Download a Word (.docx) clinical report for a saved decision.
 * Calls GET /api/reports/decision/{decisionId}/docx
 *
 * @param decisionId - UUID of the saved clinical_decisions record
 * @returns Promise that resolves when download is triggered, or rejects with an error message
 */
export async function downloadDecisionDOCX(decisionId: string): Promise<void> {
  const url = `${BACKEND_URL}/api/reports/decision/${encodeURIComponent(decisionId)}/docx`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  });

  if (!response.ok) {
    let detail = `Server returned ${response.status}`;
    try {
      const json = await response.json();
      detail = json.detail || detail;
    } catch {
      // ignore parse error
    }
    throw new Error(`Failed to generate Word report: ${detail}`);
  }

  const blob = await response.blob();

  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const filename = match ? match[1].replace(/['"]/g, '') : `Clinical_Report_${decisionId.slice(0, 8)}.docx`;

  triggerDownload(blob, filename);
}

