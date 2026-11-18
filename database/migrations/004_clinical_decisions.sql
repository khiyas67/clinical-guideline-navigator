-- ==============================================================================
-- Clinical Navigator Migration 004: Clinical Decision Persistence & Audit Trail
-- ==============================================================================

-- 1. Create clinical_decisions table
CREATE TABLE IF NOT EXISTS public.clinical_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    ai_answer TEXT NOT NULL,
    final_decision TEXT,
    decision_status TEXT NOT NULL CHECK (decision_status IN ('accepted', 'rejected', 'modified')),
    category TEXT,
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Performance & Audit Indexes
CREATE INDEX IF NOT EXISTS idx_clinical_decisions_patient_id ON public.clinical_decisions(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_decisions_clinician_id ON public.clinical_decisions(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinical_decisions_created_at ON public.clinical_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_decisions_status ON public.clinical_decisions(decision_status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.clinical_decisions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Clinician Isolation & Patient Ownership Verification
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
            AND patients.clinician_id = auth.uid()
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

-- 5. Updated_at Trigger
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
