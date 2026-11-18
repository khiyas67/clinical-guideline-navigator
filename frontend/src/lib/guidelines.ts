import { supabase, isSupabaseConfigured } from './supabase';
import type { Guideline } from '../types/guideline';

const FALLBACK_GUIDELINES: Guideline[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'NIH Clinical Guidance: Type 2 Diabetes Management and Pharmacological Therapies',
    organization: 'NIH',
    description: 'Comprehensive evidence-based clinical guidance on the diagnosis, blood glucose monitoring, lifestyle interventions, and pharmacological management of type 2 diabetes in adults, including metformin and combination therapies.',
    category: 'Diabetes',
    version: 'NBK279509',
    publication_date: '2023-01-15',
    last_updated: '2024-06-10',
    document_type: 'Clinical Guideline',
    source_url: 'https://www.ncbi.nlm.nih.gov/books/NBK279509/',
    pdf_url: 'https://www.ncbi.nlm.nih.gov/books/NBK279509/pdf/Bookshelf_NBK279509.pdf',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'NIH Clinical Practice Guideline: Hypertension Diagnosis, Risk Assessment and Treatment',
    organization: 'NIH',
    description: 'Evidence-based clinical recommendations on adult hypertension identification, accurate blood pressure measurement protocols, target thresholds, and first-line antihypertensive drug classes.',
    category: 'Hypertension',
    version: 'NBK539859',
    publication_date: '2023-05-20',
    last_updated: '2024-04-12',
    document_type: 'Clinical Guideline',
    source_url: 'https://www.ncbi.nlm.nih.gov/books/NBK539859/',
    pdf_url: 'https://www.ncbi.nlm.nih.gov/books/NBK539859/pdf/Bookshelf_NBK539859.pdf',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-04-12T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    title: 'WHO Guideline for the Pharmacological Treatment of Hypertension in Adults',
    organization: 'WHO',
    description: 'World Health Organization global recommendations on pharmacological treatment of adults with hypertension, blood pressure initiation thresholds, combination drug therapies, and follow-up monitoring intervals.',
    category: 'Hypertension',
    version: '978-92-4-003398-6',
    publication_date: '2021-08-25',
    last_updated: '2023-11-15',
    document_type: 'Clinical Guideline',
    source_url: 'https://www.who.int/publications/i/item/9789240033986',
    pdf_url: 'https://iris.who.int/bitstream/handle/10665/344424/9789240033986-eng.pdf',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2023-11-15T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    title: 'CDC Clinical Practice Guideline for Prescribing Opioids for Pain',
    organization: 'CDC',
    description: 'Centers for Disease Control and Prevention recommendations for primary care clinicians prescribing opioids for outpatients with acute, subacute, or chronic pain, dosage ceilings, and risk mitigation strategies.',
    category: 'Pain Management',
    version: 'MMWR RR-71(3)',
    publication_date: '2022-11-04',
    last_updated: '2024-02-18',
    document_type: 'Clinical Guideline',
    source_url: 'https://www.cdc.gov/mmwr/volumes/71/rr/rr7103a1.htm',
    pdf_url: 'https://www.cdc.gov/mmwr/volumes/71/rr/pdfs/rr7103a1-H.pdf',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-18T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    title: 'WHO Technical Report: Asthma Diagnosis and Stepwise Management in Primary Care',
    organization: 'WHO',
    description: 'WHO technical guidance on diagnosis, spirometry assessment, stepwise inhaled corticosteroid maintenance and reliever therapy, and asthma action plans in primary care settings.',
    category: 'Respiratory',
    version: 'WHO/NMH/NVI/19.1',
    publication_date: '2022-04-10',
    last_updated: '2023-09-01',
    document_type: 'Technical Report',
    source_url: 'https://www.who.int/news-room/fact-sheets/detail/asthma',
    pdf_url: 'https://iris.who.int/bitstream/handle/10665/344424/9789240033986-eng.pdf',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2023-09-01T00:00:00Z',
  },
];

function isDemoMode(): boolean {
  return Boolean(localStorage.getItem('clinical_nav_demo_user'));
}

export async function getGuidelines(): Promise<{ data: Guideline[]; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured) {
    return { data: FALLBACK_GUIDELINES, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('guidelines')
      .select('*, guideline_documents(id, document_version, pdf_url, checksum, ingestion_status, page_count)')
      .eq('status', 'active')
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return { data: FALLBACK_GUIDELINES, error: null };
    }

    const guidelines: Guideline[] = ((data || []) as any[]).map((g) => {
      const doc = Array.isArray(g.guideline_documents) && g.guideline_documents.length > 0 ? g.guideline_documents[0] : {};
      return {
        ...g,
        version: g.version || doc.document_version || null,
        pdf_url: g.pdf_url || g.official_document_url || doc.pdf_url || null,
        source_url: g.source_url || g.official_url || null,
        processing_status: doc.ingestion_status || 'completed',
      };
    });

    return { data: guidelines, error: null };
  } catch {
    return { data: FALLBACK_GUIDELINES, error: null };
  }
}

export async function getGuideline(id: string): Promise<{ data: Guideline | null; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured) {
    return { data: FALLBACK_GUIDELINES.find((g) => g.id === id) || null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('guidelines')
      .select('*, guideline_documents(id, document_version, pdf_url, checksum, ingestion_status, page_count)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return { data: FALLBACK_GUIDELINES.find((g) => g.id === id) || null, error: null };
    }

    const g = data as any;
    const doc = Array.isArray(g.guideline_documents) && g.guideline_documents.length > 0 ? g.guideline_documents[0] : {};
    const guideline: Guideline = {
      ...g,
      version: g.version || doc.document_version || null,
      pdf_url: g.pdf_url || g.official_document_url || doc.pdf_url || null,
      source_url: g.source_url || g.official_url || null,
      processing_status: doc.ingestion_status || 'completed',
    };

    return { data: guideline, error: null };
  } catch {
    return { data: FALLBACK_GUIDELINES.find((g) => g.id === id) || null, error: null };
  }
}

export async function getGuidelinesByCategory(category: string): Promise<{ data: Guideline[]; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured) {
    if (!category || category === 'All') return { data: FALLBACK_GUIDELINES, error: null };
    return { data: FALLBACK_GUIDELINES.filter((g) => (g.category || '').toLowerCase() === category.toLowerCase()), error: null };
  }

  try {
    let query = supabase.from('guidelines').select('*').eq('status', 'active');

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query
      .order('is_verified', { ascending: false })
      .order('title', { ascending: true });

    if (error) {
      if (!category || category === 'All') return { data: FALLBACK_GUIDELINES, error: null };
      return { data: FALLBACK_GUIDELINES.filter((g) => (g.category || '').toLowerCase() === category.toLowerCase()), error: null };
    }

    return { data: (data as Guideline[]) || [], error: null };
  } catch {
    if (!category || category === 'All') return { data: FALLBACK_GUIDELINES, error: null };
    return { data: FALLBACK_GUIDELINES.filter((g) => (g.category || '').toLowerCase() === category.toLowerCase()), error: null };
  }
}

export async function searchGuidelines(
  searchTerm: string,
  category?: string
): Promise<{ data: Guideline[]; error: Error | null }> {
  if (isDemoMode() || !isSupabaseConfigured) {
    let list = FALLBACK_GUIDELINES;
    if (category && category !== 'All') {
      list = list.filter((g) => (g.category || '').toLowerCase() === category.toLowerCase());
    }
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(term) ||
          g.organization.toLowerCase().includes(term) ||
          (g.description || '').toLowerCase().includes(term)
      );
    }
    return { data: list, error: null };
  }

  try {
    let query = supabase.from('guidelines').select('*').eq('status', 'active');

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const cleanSearch = searchTerm.trim();
    if (cleanSearch) {
      query = query.or(
        `title.ilike.%${cleanSearch}%,organization.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%`
      );
    }

    const { data, error } = await query
      .order('is_verified', { ascending: false })
      .order('title', { ascending: true });

    if (error) {
      let list = FALLBACK_GUIDELINES;
      if (category && category !== 'All') {
        list = list.filter((g) => (g.category || '').toLowerCase() === category.toLowerCase());
      }
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        list = list.filter(
          (g) =>
            g.title.toLowerCase().includes(term) ||
            g.organization.toLowerCase().includes(term) ||
            (g.description || '').toLowerCase().includes(term)
        );
      }
      return { data: list, error: null };
    }

    return { data: (data as Guideline[]) || [], error: null };
  } catch {
    let list = FALLBACK_GUIDELINES;
    if (category && category !== 'All') {
      list = list.filter((g) => (g.category || '').toLowerCase() === category.toLowerCase());
    }
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(term) ||
          g.organization.toLowerCase().includes(term) ||
          (g.description || '').toLowerCase().includes(term)
      );
    }
    return { data: list, error: null };
  }
}

/**
 * Returns the count of verified guidelines (is_verified = true).
 * Used by the Dashboard stat card.
 */
export async function getVerifiedGuidelineCount(): Promise<number> {
  if (isDemoMode() || !isSupabaseConfigured) {
    return FALLBACK_GUIDELINES.filter((g) => g.is_verified).length;
  }

  try {
    const { count, error } = await supabase
      .from('guidelines')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true);

    if (error) {
      return FALLBACK_GUIDELINES.filter((g) => g.is_verified).length;
    }
    return count || FALLBACK_GUIDELINES.filter((g) => g.is_verified).length;
  } catch {
    return FALLBACK_GUIDELINES.filter((g) => g.is_verified).length;
  }
}
