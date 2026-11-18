-- ==============================================================================
-- Migration 007: Safe Transactional Cleanup Function for Duplicate Guidelines
-- ==============================================================================
-- Provides atomic, transactional execution for removing confirmed duplicate
-- guideline records, documents, and chunks while asserting counts and safety.
--
-- If any assertion fails (unexpected target count, canonical ID intrusion,
-- affected clinical decision, or post-cleanup count mismatch), the function raises
-- an exception and PostgreSQL automatically executes a 100% rollback.
-- ==============================================================================

CREATE OR REPLACE FUNCTION execute_guideline_duplicate_cleanup(
    target_ids uuid[],
    expected_guideline_count int DEFAULT 19,
    expected_document_count int DEFAULT 19,
    expected_chunk_count int DEFAULT 38
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    canonical_ids uuid[] := ARRAY[
        '616f325d-08e9-4cbc-938a-3f8547413287'::uuid, -- CDC Opioids 2022
        '3ed31dbd-7589-4327-b400-966df4d12a26'::uuid, -- KDIGO 2022 CKD Diabetes
        '2ea7ef2a-990f-4817-80e2-4b064e5ba139'::uuid, -- SGLT2i Summary
        '8141c103-9bac-44b6-9c68-fd8645aa5b42'::uuid, -- KDIGO 2024 Evaluation
        '069969fa-8ec8-41c8-b1d4-82e0890d3e31'::uuid  -- Demo Guideline
    ];
    cid uuid;
    deleted_chunks_count int;
    deleted_docs_count int;
    deleted_guidelines_count int;
    affected_decisions_count int;
    rem_guidelines int;
    rem_docs int;
    rem_chunks int;
    rem_decisions int;
BEGIN
    -- 1. Validate target_ids count
    IF array_length(target_ids, 1) <> expected_guideline_count THEN
        RAISE EXCEPTION 'Safety check failed: Expected % target IDs, got %', 
            expected_guideline_count, array_length(target_ids, 1);
    END IF;

    -- 2. Confirm canonical records are NOT in target_ids
    FOREACH cid IN ARRAY canonical_ids LOOP
        IF cid = ANY(target_ids) THEN
            RAISE EXCEPTION 'CRITICAL SAFETY VIOLATION: Canonical guideline % is in target_ids!', cid;
        END IF;
    END LOOP;

    -- 3. Confirm all clinical decisions remain completely unaffected
    SELECT COUNT(*) INTO affected_decisions_count
    FROM clinical_decisions cd
    WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(cd.sources) = 'array' THEN cd.sources ELSE '[]'::jsonb END) elem
        WHERE (elem->>'guideline_id')::uuid = ANY(target_ids)
    );

    IF affected_decisions_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL SAFETY VIOLATION: % clinical decision(s) reference target duplicate guidelines!', affected_decisions_count;
    END IF;

    -- 4. Delete chunks (child records)
    WITH del_chunks AS (
        DELETE FROM guideline_chunks
        WHERE guideline_id = ANY(target_ids)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_chunks_count FROM del_chunks;

    IF deleted_chunks_count <> expected_chunk_count THEN
        RAISE EXCEPTION 'Rollback triggered: Expected to delete % chunks, but deleted %', 
            expected_chunk_count, deleted_chunks_count;
    END IF;

    -- 5. Delete documents (child records)
    WITH del_docs AS (
        DELETE FROM guideline_documents
        WHERE guideline_id = ANY(target_ids)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_docs_count FROM del_docs;

    IF deleted_docs_count <> expected_document_count THEN
        RAISE EXCEPTION 'Rollback triggered: Expected to delete % documents, but deleted %', 
            expected_document_count, deleted_docs_count;
    END IF;

    -- 6. Delete guidelines (parent records)
    WITH del_g AS (
        DELETE FROM guidelines
        WHERE id = ANY(target_ids)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_guidelines_count FROM del_g;

    IF deleted_guidelines_count <> expected_guideline_count THEN
        RAISE EXCEPTION 'Rollback triggered: Expected to delete % guidelines, but deleted %', 
            expected_guideline_count, deleted_guidelines_count;
    END IF;

    -- 7. Update canonical records metadata
    UPDATE guidelines
    SET document_type = 'Official Clinical Guideline',
        verification_status = 'verified',
        is_verified = TRUE,
        source_type = 'trusted_official',
        status = 'active'
    WHERE id = '616f325d-08e9-4cbc-938a-3f8547413287';

    UPDATE guidelines
    SET document_type = 'Official Clinical Guideline',
        verification_status = 'verified',
        is_verified = TRUE,
        source_type = 'trusted_official',
        status = 'active'
    WHERE id = '3ed31dbd-7589-4327-b400-966df4d12a26';

    UPDATE guidelines
    SET document_type = 'Supporting Clinical Reference',
        verification_status = 'community_contributed',
        is_verified = FALSE,
        source_type = 'supporting_reference',
        status = 'active'
    WHERE id = '2ea7ef2a-990f-4817-80e2-4b064e5ba139';

    UPDATE guideline_documents
    SET checksum = 'a1b84375bae366df1ecc83dd05339c4c297688d7d7970f1579cc676d6d65a7b4'
    WHERE guideline_id = '2ea7ef2a-990f-4817-80e2-4b064e5ba139';

    UPDATE guidelines
    SET document_type = 'Unverified / Evaluation Data',
        verification_status = 'unverified_evaluation',
        is_verified = FALSE,
        source_type = 'evaluation_data',
        status = 'archived',
        description = '[EVALUATION DATASET - NOT OFFICIAL CPG] Synthetic 2-page evaluation document. Awaiting verified official KDIGO 2024 PDF replacement.'
    WHERE id = '8141c103-9bac-44b6-9c68-fd8645aa5b42';

    UPDATE guideline_documents
    SET checksum = '73585c44a552f71a0e6c54f3ec36508319d83e08785b62853f329a61b20b8104'
    WHERE guideline_id = '8141c103-9bac-44b6-9c68-fd8645aa5b42';

    UPDATE guidelines
    SET document_type = 'Academic Demo',
        verification_status = 'synthetic_demo',
        is_verified = FALSE,
        source_type = 'synthetic_demo',
        status = 'archived',
        description = '[ACADEMIC DEMO - NOT FOR CLINICAL USE] Fictional academic demonstration document.'
    WHERE id = '069969fa-8ec8-41c8-b1d4-82e0890d3e31';

    -- 8. Post-cleanup verification of remaining counts
    SELECT COUNT(*) INTO rem_guidelines FROM guidelines;
    SELECT COUNT(*) INTO rem_docs FROM guideline_documents;
    SELECT COUNT(*) INTO rem_chunks FROM guideline_chunks;
    SELECT COUNT(*) INTO rem_decisions FROM clinical_decisions;

    IF rem_guidelines <> 5 OR rem_docs <> 6 OR rem_chunks <> 745 OR rem_decisions <> 7 THEN
        RAISE EXCEPTION 'Rollback triggered: Post-cleanup count mismatch! G=%, D=%, C=%, Dec=%',
            rem_guidelines, rem_docs, rem_chunks, rem_decisions;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'deleted_guidelines', deleted_guidelines_count,
        'deleted_documents', deleted_docs_count,
        'deleted_chunks', deleted_chunks_count,
        'remaining_guidelines', rem_guidelines,
        'remaining_documents', rem_docs,
        'remaining_chunks', rem_chunks,
        'remaining_decisions', rem_decisions
    );
END;
$$;

-- Security: Prevent unauthorized execution by anonymous or regular authenticated users.
-- Only the backend service_role (service role key) can invoke this cleanup procedure.
REVOKE EXECUTE ON FUNCTION execute_guideline_duplicate_cleanup(uuid[], int, int, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION execute_guideline_duplicate_cleanup(uuid[], int, int, int) FROM anon;
REVOKE EXECUTE ON FUNCTION execute_guideline_duplicate_cleanup(uuid[], int, int, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION execute_guideline_duplicate_cleanup(uuid[], int, int, int) TO service_role;


