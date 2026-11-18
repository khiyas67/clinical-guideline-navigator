-- ==============================================================================
-- Clinical Navigator Seed Data: Verified Globally Open Clinical Guidelines
-- ==============================================================================
-- NOTE: All guidelines below are issued by world-recognized, globally open
-- health authorities (WHO, CDC, NIH/NCBI) with unrestricted public access worldwide.
-- No geo-blocked domains (like NICE UK) are included.
-- ==============================================================================

INSERT INTO public.guidelines (
    id,
    title,
    organization,
    description,
    category,
    version,
    publication_date,
    last_updated,
    document_type,
    source_url,
    pdf_url,
    is_verified
) VALUES
-- 1. NIH Type 2 Diabetes Management
(
    '00000000-0000-0000-0000-000000000001',
    'NIH Clinical Guidance: Type 2 Diabetes Management and Pharmacological Therapies',
    'NIH',
    'Comprehensive evidence-based clinical guidance on the diagnosis, blood glucose monitoring, lifestyle interventions, and pharmacological management of type 2 diabetes in adults, including metformin and combination therapies.',
    'Diabetes',
    'NBK279509',
    '2023-01-15',
    '2024-06-10',
    'Clinical Guideline',
    'https://www.ncbi.nlm.nih.gov/books/NBK279509/',
    'https://www.ncbi.nlm.nih.gov/books/NBK279509/pdf/Bookshelf_NBK279509.pdf',
    true
),

-- 2. NIH Hypertension Clinical Practice Guideline
(
    '00000000-0000-0000-0000-000000000002',
    'NIH Clinical Practice Guideline: Hypertension Diagnosis, Risk Assessment and Treatment',
    'NIH',
    'Evidence-based clinical recommendations on adult hypertension identification, accurate blood pressure measurement protocols, target thresholds, and first-line antihypertensive drug classes.',
    'Hypertension',
    'NBK539859',
    '2023-05-20',
    '2024-04-12',
    'Clinical Guideline',
    'https://www.ncbi.nlm.nih.gov/books/NBK539859/',
    'https://www.ncbi.nlm.nih.gov/books/NBK539859/pdf/Bookshelf_NBK539859.pdf',
    true
),

-- 3. WHO Hypertension Pharmacological Treatment
(
    '00000000-0000-0000-0000-000000000003',
    'WHO Guideline for the Pharmacological Treatment of Hypertension in Adults',
    'WHO',
    'World Health Organization global recommendations on pharmacological treatment of adults with hypertension, blood pressure initiation thresholds, combination drug therapies, and follow-up monitoring intervals.',
    'Hypertension',
    'ISBN 978-92-4-003398-6',
    '2021-08-25',
    '2021-08-25',
    'PDF & Web Guideline',
    'https://www.who.int/publications/i/item/9789240033986',
    'https://iris.who.int/bitstream/handle/10665/344424/9789240033986-eng.pdf',
    true
),

-- 4. WHO Second- and Third-Line Management of Diabetes
(
    '00000000-0000-0000-0000-000000000004',
    'WHO Guidelines on Second- and Third-Line Pharmacological Management of Diabetes',
    'WHO',
    'World Health Organization clinical recommendations for intensifying pharmacological treatment in adults with type 2 diabetes when standard metformin monotherapy does not achieve glycemic targets.',
    'Diabetes',
    'ISBN 978-92-4-155042-0',
    '2018-09-12',
    '2023-11-15',
    'PDF & Web Guideline',
    'https://www.who.int/publications/i/item/9789241550420',
    'https://iris.who.int/bitstream/handle/10665/311257/9789241550420-eng.pdf',
    true
),

-- 5. WHO COVID-19 Therapeutics Living Guideline
(
    '00000000-0000-0000-0000-000000000005',
    'WHO Therapeutics and COVID-19: Living Guideline',
    'WHO',
    'Global clinical recommendations from the World Health Organization on evidence-grounded antiviral therapeutics, monoclonal antibodies, and corticosteroid regimens for patients with SARS-CoV-2 infection.',
    'Infectious Disease',
    'WHO/2019-nCoV/therapeutics/2023.2',
    '2020-09-04',
    '2023-11-10',
    'Living Guideline',
    'https://iris.who.int/handle/10665/374151',
    'https://iris.who.int/bitstream/handle/10665/374151/WHO-2019-nCoV-therapeutics-2023.2-eng.pdf',
    true
),

-- 6. CDC MMWR Opioids Prescribing Guideline
(
    '00000000-0000-0000-0000-000000000006',
    'CDC Clinical Practice Guideline for Prescribing Opioids for Pain — United States, 2022',
    'CDC',
    'Updated clinical practice guidance providing 12 recommendations for clinicians prescribing opioids for acute, subacute, or chronic pain, emphasizing individualized risk-benefit assessment.',
    'Medications',
    'MMWR Vol. 71 / No. 3',
    '2022-11-04',
    '2022-11-04',
    'PDF & Open Access',
    'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9639433/',
    'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9639433/pdf/mm7103a1.pdf',
    true
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    organization = EXCLUDED.organization,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    version = EXCLUDED.version,
    publication_date = EXCLUDED.publication_date,
    last_updated = EXCLUDED.last_updated,
    document_type = EXCLUDED.document_type,
    source_url = EXCLUDED.source_url,
    pdf_url = EXCLUDED.pdf_url,
    is_verified = EXCLUDED.is_verified,
    updated_at = now();
