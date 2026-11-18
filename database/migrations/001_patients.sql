-- ==============================================================================
-- Clinical Navigator Migration 001: Patients Table & Row Level Security
-- ==============================================================================

-- 1. Create Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    contact TEXT,
    address TEXT,
    medical_conditions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    medications TEXT[] DEFAULT '{}',
    medical_history TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure human-readable patient code is unique per clinician
    CONSTRAINT unique_clinician_patient_code UNIQUE (clinician_id, patient_code)
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_patients_clinician_id ON public.patients(clinician_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients(clinician_id, full_name);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Strictly limit access to the owning clinician
-- SELECT: Clinicians can only view their own patients
CREATE POLICY "Clinicians can view own patients"
    ON public.patients
    FOR SELECT
    TO authenticated
    USING (auth.uid() = clinician_id);

-- INSERT: Clinicians can only create patients for themselves
CREATE POLICY "Clinicians can insert own patients"
    ON public.patients
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = clinician_id);

-- UPDATE: Clinicians can only update their own patients
CREATE POLICY "Clinicians can update own patients"
    ON public.patients
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = clinician_id)
    WITH CHECK (auth.uid() = clinician_id);

-- DELETE: Clinicians can only delete their own patients
CREATE POLICY "Clinicians can delete own patients"
    ON public.patients
    FOR DELETE
    TO authenticated
    USING (auth.uid() = clinician_id);

-- 5. Updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_patients_updated_at ON public.patients;
CREATE TRIGGER trigger_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Human-readable Patient Code Generator Trigger (P-YYYY-XXX)
CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT := to_char(CURRENT_DATE, 'YYYY');
    seq_num INT;
BEGIN
    IF NEW.patient_code IS NULL OR NEW.patient_code = '' THEN
        -- Count existing patients for this clinician in the current year to determine next sequence number
        SELECT COUNT(*) + 1 INTO seq_num
        FROM public.patients
        WHERE clinician_id = NEW.clinician_id
          AND patient_code LIKE 'P-' || current_year || '-%';
        
        NEW.patient_code := 'P-' || current_year || '-' || lpad(seq_num::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_patient_code ON public.patients;
CREATE TRIGGER trigger_generate_patient_code
    BEFORE INSERT ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_patient_code();
