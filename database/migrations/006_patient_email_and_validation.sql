-- ==============================================================================
-- Clinical Navigator Migration 006: Patient Email & Contact Validation Support
-- Non-destructive: adds email column if not present, preserving all existing rows
-- ==============================================================================

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email TEXT;

-- Index for patient email lookup
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);

-- Ensure RLS allows access to the new column
-- (Existing policies on public.patients cover all columns automatically)

