-- ==============================================================================
-- Clinical Navigator Migration 005: Schema Compatibility & Vector 384 Setup
-- Non-destructive: preserves all existing tables, rows, and legacy embeddings
-- ==============================================================================

-- 1. Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Patients Table Compatibility: add schema columns without losing existing rows
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinician_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS patient_code TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_conditions TEXT[] DEFAULT '{}';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medications TEXT[] DEFAULT '{}';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_history TEXT;

-- Backfill existing patient data into new columns
UPDATE public.patients SET clinician_id = created_by WHERE clinician_id IS NULL AND created_by IS NOT NULL;
UPDATE public.patients SET patient_code = patient_id WHERE patient_code IS NULL AND patient_id IS NOT NULL;
UPDATE public.patients SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
UPDATE public.patients SET medical_history = clinical_notes WHERE medical_history IS NULL AND clinical_notes IS NOT NULL;
UPDATE public.patients SET medical_conditions = ARRAY[primary_condition] WHERE (medical_conditions IS NULL OR medical_conditions = '{}') AND primary_condition IS NOT NULL;

-- Ensure RLS on patients supports both clinician_id and created_by
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clinicians can view own patients" ON public.patients;
CREATE POLICY "Clinicians can view own patients"
    ON public.patients
    FOR SELECT
    TO authenticated
    USING (auth.uid() = clinician_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Clinicians can insert own patients" ON public.patients;
CREATE POLICY "Clinicians can insert own patients"
    ON public.patients
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = clinician_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Clinicians can update own patients" ON public.patients;
CREATE POLICY "Clinicians can update own patients"
    ON public.patients
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = clinician_id OR auth.uid() = created_by)
    WITH CHECK (auth.uid() = clinician_id OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Clinicians can delete own patients" ON public.patients;
CREATE POLICY "Clinicians can delete own patients"
    ON public.patients
    FOR DELETE
    TO authenticated
    USING (auth.uid() = clinician_id OR auth.uid() = created_by);

-- 3. Guidelines Compatibility
ALTER TABLE public.guidelines ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.guidelines ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.guidelines ADD COLUMN IF NOT EXISTS publication_date DATE;
ALTER TABLE public.guidelines ADD COLUMN IF NOT EXISTS last_updated DATE;
ALTER TABLE public.guidelines ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'Web Guideline';

UPDATE public.guidelines SET is_verified = (verification_status = 'verified') WHERE is_verified IS FALSE AND verification_status IS NOT NULL;
UPDATE public.guidelines SET pdf_url = official_document_url WHERE pdf_url IS NULL AND official_document_url IS NOT NULL;
UPDATE public.guidelines SET pdf_url = official_url WHERE pdf_url IS NULL AND official_url IS NOT NULL;

ALTER TABLE public.guidelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select guidelines" ON public.guidelines;
CREATE POLICY "Authenticated users can select guidelines"
    ON public.guidelines
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. Guideline Documents Compatibility
ALTER TABLE public.guideline_documents ADD COLUMN IF NOT EXISTS document_name TEXT;
ALTER TABLE public.guideline_documents ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.guideline_documents ADD COLUMN IF NOT EXISTS ingestion_status TEXT DEFAULT 'completed';

UPDATE public.guideline_documents SET document_name = file_name WHERE document_name IS NULL AND file_name IS NOT NULL;
UPDATE public.guideline_documents SET ingestion_status = processing_status WHERE ingestion_status IS NULL AND processing_status IS NOT NULL;

ALTER TABLE public.guideline_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select guideline_documents" ON public.guideline_documents;
CREATE POLICY "Authenticated users can select guideline_documents"
    ON public.guideline_documents
    FOR SELECT
    TO authenticated
    USING (true);

-- 5. Create guideline_chunks for 384-dimensional embeddings (BAAI/bge-small-en-v1.5)
-- Preserves existing document_chunks (768-dim) without disruption
CREATE TABLE IF NOT EXISTS public.guideline_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID,
    guideline_id UUID NOT NULL REFERENCES public.guidelines(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    section_title TEXT,
    source_url TEXT,
    pdf_url TEXT,
    embedding VECTOR(384),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guideline_chunks_guideline_id ON public.guideline_chunks(guideline_id);
CREATE INDEX IF NOT EXISTS idx_guideline_chunks_embedding 
    ON public.guideline_chunks 
    USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.guideline_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select guideline_chunks" ON public.guideline_chunks;
CREATE POLICY "Authenticated users can select guideline_chunks"
    ON public.guideline_chunks
    FOR SELECT
    TO authenticated
    USING (true);

-- 6. Match Guideline Chunks RPC for 384-dimensional query embeddings
CREATE OR REPLACE FUNCTION match_guideline_chunks(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.40,
    match_count int DEFAULT 5,
    filter_guideline_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    guideline_id uuid,
    document_id uuid,
    chunk_index integer,
    content text,
    page_number integer,
    section_title text,
    source_url text,
    pdf_url text,
    guideline_title text,
    organization text,
    similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        gc.id,
        gc.guideline_id,
        gc.document_id,
        gc.chunk_index,
        gc.content,
        gc.page_number,
        gc.section_title,
        gc.source_url,
        gc.pdf_url,
        g.title AS guideline_title,
        g.organization,
        (1 - (gc.embedding <=> query_embedding))::float AS similarity
    FROM public.guideline_chunks gc
    JOIN public.guidelines g ON gc.guideline_id = g.id
    WHERE 
        (filter_guideline_id IS NULL OR gc.guideline_id = filter_guideline_id)
        AND (1 - (gc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY gc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 7. Clinical Decisions Audit Trail Table
CREATE TABLE IF NOT EXISTS public.clinical_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    ai_answer TEXT DEFAULT '',
    final_decision TEXT,
    decision_status TEXT NOT NULL CHECK (decision_status IN ('accepted', 'rejected', 'modified')),
    category TEXT,
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_decisions_patient_id ON public.clinical_decisions(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_decisions_clinician_id ON public.clinical_decisions(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinical_decisions_created_at ON public.clinical_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_decisions_status ON public.clinical_decisions(decision_status);

ALTER TABLE public.clinical_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clinicians can select their own decisions" ON public.clinical_decisions;
CREATE POLICY "Clinicians can select their own decisions"
    ON public.clinical_decisions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = clinician_id);

DROP POLICY IF EXISTS "Clinicians can insert decisions for their own patients" ON public.clinical_decisions;
CREATE POLICY "Clinicians can insert decisions for their own patients"
    ON public.clinical_decisions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = clinician_id
        AND EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = clinical_decisions.patient_id
            AND (patients.clinician_id = auth.uid() OR patients.created_by = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Clinicians can update their own decisions" ON public.clinical_decisions;
CREATE POLICY "Clinicians can update their own decisions"
    ON public.clinical_decisions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = clinician_id)
    WITH CHECK (auth.uid() = clinician_id);

DROP POLICY IF EXISTS "Clinicians can delete their own decisions" ON public.clinical_decisions;
CREATE POLICY "Clinicians can delete their own decisions"
    ON public.clinical_decisions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = clinician_id);

CREATE OR REPLACE FUNCTION public.handle_clinical_decisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clinical_decisions_updated_at ON public.clinical_decisions;
CREATE TRIGGER trigger_clinical_decisions_updated_at
    BEFORE UPDATE ON public.clinical_decisions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_clinical_decisions_updated_at();
