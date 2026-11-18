-- ==============================================================================
-- Clinical Navigator Migration 002: Guidelines Table & Row Level Security
-- ==============================================================================

-- 1. Create Guidelines Table
CREATE TABLE IF NOT EXISTS public.guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    description TEXT,
    category TEXT,
    version TEXT,
    publication_date DATE,
    last_updated DATE,
    document_type TEXT NOT NULL, -- e.g., "Web Guideline", "PDF"
    source_url TEXT,
    pdf_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for Performance & Search
CREATE INDEX IF NOT EXISTS idx_guidelines_category ON public.guidelines(category);
CREATE INDEX IF NOT EXISTS idx_guidelines_is_verified ON public.guidelines(is_verified);
CREATE INDEX IF NOT EXISTS idx_guidelines_organization ON public.guidelines(organization);
CREATE INDEX IF NOT EXISTS idx_guidelines_title ON public.guidelines(title);
CREATE INDEX IF NOT EXISTS idx_guidelines_created_at ON public.guidelines(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.guidelines ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Shared Application Knowledge
-- Authenticated clinicians can SELECT guidelines
CREATE POLICY "Authenticated users can select guidelines"
    ON public.guidelines
    FOR SELECT
    TO authenticated
    USING (true);

-- NOTE: No public or unrestricted authenticated write policies are created.
-- Future admin functionality will manage INSERT/UPDATE/DELETE.
-- Insertion of verified guidelines is performed via Supabase SQL Editor / migrations.

-- 5. Updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_guidelines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_guidelines_updated_at ON public.guidelines;
CREATE TRIGGER trigger_guidelines_updated_at
    BEFORE UPDATE ON public.guidelines
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_guidelines_updated_at();
