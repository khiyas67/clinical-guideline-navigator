export interface Guideline {
  id: string;
  title: string;
  organization: string;
  description: string | null;
  category: string | null;
  version: string | null;
  year?: number | null;
  publication_date: string | null;
  last_updated: string | null;
  document_type: string;
  source_url: string | null;
  pdf_url: string | null;
  official_url?: string | null;
  official_document_url?: string | null;
  status?: string | null;
  source_type?: string | null;
  verification_status?: string | null;
  processing_status?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type GuidelineCategory = string;

export interface GuidelineFiltersState {
  searchQuery: string;
  category: GuidelineCategory;
}

export interface GuidelineCitation {
  id: string;
  organization: string;
  title: string;
  category?: string | null;
  document_type: string;
  page?: string;
  source_url?: string | null;
  pdf_url?: string | null;
  is_verified: boolean;
}
