-- ==============================================================================
-- Clinical Navigator Migration 003: Vector Database & Multi-Guideline RAG Setup
-- ==============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create guideline_documents table
CREATE TABLE IF NOT EXISTS public.guideline_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guideline_id UUID NOT NULL REFERENCES public.guidelines(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    source_url TEXT,
    pdf_url TEXT,
    document_version TEXT,
    checksum TEXT,
    ingestion_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_guideline_documents_guideline_checksum UNIQUE (guideline_id, checksum)
);

-- 3. Create guideline_chunks table with 384-dimensional vector embeddings
CREATE TABLE IF NOT EXISTS public.guideline_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.guideline_documents(id) ON DELETE CASCADE,
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

-- 4. Indexes for Performance & Vector Similarity Search
CREATE INDEX IF NOT EXISTS idx_guideline_documents_guideline_id ON public.guideline_documents(guideline_id);
CREATE INDEX IF NOT EXISTS idx_guideline_documents_status ON public.guideline_documents(ingestion_status);
CREATE INDEX IF NOT EXISTS idx_guideline_chunks_document_id ON public.guideline_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_guideline_chunks_guideline_id ON public.guideline_chunks(guideline_id);
CREATE INDEX IF NOT EXISTS idx_guideline_chunks_page ON public.guideline_chunks(page_number);

-- HNSW Vector Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_guideline_chunks_embedding 
    ON public.guideline_chunks 
    USING hnsw (embedding vector_cosine_ops);

-- 5. Row Level Security
ALTER TABLE public.guideline_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guideline_chunks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view guideline documents & chunks
CREATE POLICY "Authenticated users can select guideline_documents"
    ON public.guideline_documents
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can select guideline_chunks"
    ON public.guideline_chunks
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow service_role key to perform all operations (used by FastAPI ingestion service)
-- Supabase service_role automatically bypasses RLS, but explicit grant ensures consistency.

-- 6. Vector Similarity Search Function (RPC)
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
