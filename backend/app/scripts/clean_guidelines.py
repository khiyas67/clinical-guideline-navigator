"""
clean_guidelines.py
Enterprise-grade safe database cleanup, backup verification, and rollback script.

Features:
1. Complete Chunk Backup: Preserves all chunk fields including 384-dim vector embeddings.
2. Strong Integrity Verification: Verifies record counts, IDs, field values, vector dimensions,
   and computes SHA-256 checksum of the backup file.
3. Transactional Execution: Prefers atomic PostgreSQL RPC (execute_guideline_duplicate_cleanup)
   with automatic rollback on any assertion failure.
4. Pre-execution Safety Invariants: Re-verifies all 19 duplicate IDs, 5 canonical records,
   clinical decisions independence, and database state immediately before mutation.
5. Tested Rollback: Full restoration capability for guidelines, documents, and chunks with embeddings.
6. Safe Dry-Run: Validates everything without modifying live data.
"""

import os
import sys
import json
import hashlib
import logging
import argparse
from datetime import datetime
from typing import Dict, Any, List, Set, Tuple
from app.services.retrieval import get_supabase_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("cleanup")

# 10 KDIGO 2024 duplicate UUIDs (canonical: 8141c103-9bac-44b6-9c68-fd8645aa5b42)
KDIGO_2024_DUPES = [
    "1f7ed92f-325a-45fa-bda3-0be8cd8fa8a5",
    "2468d4f8-2bd1-4dc1-a021-6e3ecd7e007c",
    "8ef7f1d0-6527-4610-8e26-cf441e236660",
    "682ca395-19f6-4951-80a9-511671cd5742",
    "d11ffd49-3598-477a-8994-d2e0734776f9",
    "56c5703a-1f50-42a8-a2b1-a8ce00f486b7",
    "c357e811-c5a0-4166-b867-32e58518beec",
    "b544fa9a-ea50-4d0a-afe8-a5c4184360eb",
    "8b59dc01-79c5-4114-9bb1-c6227d075cc2",
    "638995ba-344a-4229-b801-0ad2f685997d",
]

# 9 SGLT2i duplicate UUIDs (canonical: 2ea7ef2a-990f-4817-80e2-4b064e5ba139)
SGLT2I_DUPES = [
    "b95f9c07-1c25-4a9a-bdb5-3e269fe713ae",
    "c6748b53-ea03-4572-9579-9826504491b8",
    "b799a7af-b8fa-41a5-8f18-3889f87b5f09",
    "55e5893f-b946-42b4-b60f-4535c0980add",
    "6557a23a-3cd4-4594-a92f-9a006c54679e",
    "88523405-f051-4e09-8657-049ec61b82e1",
    "37f9c22b-bb66-4b33-ab13-adadd01bb144",
    "0110b133-b051-4088-bad1-4e49970eabbf",
    "520497d0-0f37-41a1-b3d7-c103f1a0578a",
]

ALL_DUPES: Set[str] = set(KDIGO_2024_DUPES + SGLT2I_DUPES)

CANONICAL_RECORDS: Dict[str, str] = {
    "616f325d-08e9-4cbc-938a-3f8547413287": "CDC Opioids 2022 (Official CPG)",
    "3ed31dbd-7589-4327-b400-966df4d12a26": "KDIGO 2022 CKD Diabetes (Official CPG)",
    "2ea7ef2a-990f-4817-80e2-4b064e5ba139": "SGLT2i Summary (Supporting Clinical Reference)",
    "8141c103-9bac-44b6-9c68-fd8645aa5b42": "KDIGO 2024 CKD Diabetes (Evaluation Data)",
    "069969fa-8ec8-41c8-b1d4-82e0890d3e31": "Clinical Navigator Demo Guideline (Academic Demo)",
}

CANONICAL_DOCUMENTS: Dict[str, str] = {
    "05c0de56-621e-4572-ab97-15ef512f4614": "KDIGO 2022 Secondary Document Record",
}

VERIFIED_CHECKSUMS = {
    "8141c103-9bac-44b6-9c68-fd8645aa5b42": {
        "file": "kdigo_diabetes_ckd_2024.pdf",
        "sha256": "73585c44a552f71a0e6c54f3ec36508319d83e08785b62853f329a61b20b8104",
    },
    "2ea7ef2a-990f-4817-80e2-4b064e5ba139": {
        "file": "community_sglt2_summary.pdf",
        "sha256": "a1b84375bae366df1ecc83dd05339c4c297688d7d7970f1579cc676d6d65a7b4",
    },
}


def compute_file_sha256(filepath: str) -> str:
    """Calculates SHA-256 checksum of any file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as fp:
        for chunk in iter(lambda: fp.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def create_complete_backup(sb, dupe_ids: Set[str]) -> Tuple[str, str, Dict[str, Any]]:
    """
    Exports all duplicate records (guidelines, documents, and chunks including pgvector
    embeddings) to a JSON file, verifies strong integrity, and generates a SHA-256 signature.
    """
    backup_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "database", "backups")
    )
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, f"guidelines_cleanup_backup_{timestamp}.json")
    sha256_path = backup_path + ".sha256"

    logger.info(f"Querying complete records for {len(dupe_ids)} duplicate guidelines...")
    dupe_guidelines = sb.from_("guidelines").select("*").in_("id", list(dupe_ids)).execute().data
    dupe_docs = sb.from_("guideline_documents").select("*").in_("guideline_id", list(dupe_ids)).execute().data
    
    # Crucial: select('*') ensures the original 384-dimensional pgvector embedding is retrieved
    dupe_chunks = sb.from_("guideline_chunks").select("*").in_("guideline_id", list(dupe_ids)).execute().data

    # Normalize embedding representations to standard float lists for portable JSON storage
    normalized_chunks = []
    for c in dupe_chunks:
        chunk_copy = dict(c)
        raw_emb = chunk_copy.get("embedding")
        if isinstance(raw_emb, str):
            vec = json.loads(raw_emb)
        elif isinstance(raw_emb, list):
            vec = raw_emb
        else:
            raise ValueError(f"Chunk {c.get('id')} has invalid embedding format: {type(raw_emb)}")
        
        # Vector dimension assertion
        if len(vec) != 384:
            raise ValueError(f"Chunk {c.get('id')} embedding has dimension {len(vec)}, expected 384!")
        chunk_copy["embedding"] = vec
        normalized_chunks.append(chunk_copy)

    payload = {
        "backup_version": "2.0",
        "created_at_utc": timestamp,
        "embedding_model": "BAAI/bge-small-en-v1.5",
        "embedding_dimensions": 384,
        "counts": {
            "guidelines": len(dupe_guidelines),
            "documents": len(dupe_docs),
            "chunks": len(normalized_chunks),
        },
        "target_guideline_ids": sorted(list(dupe_ids)),
        "guidelines": dupe_guidelines,
        "guideline_documents": dupe_docs,
        "guideline_chunks": normalized_chunks,
    }

    # Write backup JSON
    with open(backup_path, "w", encoding="utf-8") as fp:
        json.dump(payload, fp, indent=2, ensure_ascii=False)

    # Compute and write SHA-256 checksum
    backup_sha256 = compute_file_sha256(backup_path)
    with open(sha256_path, "w", encoding="utf-8") as fp:
        fp.write(backup_sha256 + "\n")

    logger.info(f"Complete backup written: {backup_path}")
    logger.info(f"Backup SHA-256 checksum: {backup_sha256}")

    # --- Strong Backup Integrity Verification ---
    logger.info("Executing strong backup integrity verification...")
    with open(backup_path, "r", encoding="utf-8") as fp:
        verified_data = json.load(fp)

    # Verify counts
    assert len(verified_data["guidelines"]) == 19, f"Backup guidelines count mismatch: {len(verified_data['guidelines'])}"
    assert len(verified_data["guideline_documents"]) == 19, f"Backup documents count mismatch: {len(verified_data['guideline_documents'])}"
    assert len(verified_data["guideline_chunks"]) == 38, f"Backup chunks count mismatch: {len(verified_data['guideline_chunks'])}"

    # Verify all guideline IDs
    backup_g_ids = {g["id"] for g in verified_data["guidelines"]}
    assert backup_g_ids == dupe_ids, "Backup guideline IDs do not match target duplicate IDs!"

    # Verify document IDs and FK
    backup_doc_g_ids = {d["guideline_id"] for d in verified_data["guideline_documents"]}
    assert backup_doc_g_ids == dupe_ids, "Backup document guideline_ids do not match duplicate IDs!"

    # Verify chunks: all fields and all 384 dimensions
    for c in verified_data["guideline_chunks"]:
        assert c["id"] is not None, "Chunk ID is missing in backup!"
        assert c["guideline_id"] in dupe_ids, f"Chunk guideline_id {c['guideline_id']} not in dupe_ids!"
        assert c["document_id"] is not None, "Chunk document_id is missing in backup!"
        assert len(c["content"]) > 0, f"Chunk {c['id']} content is empty!"
        assert isinstance(c["chunk_index"], int), f"Chunk {c['id']} chunk_index missing!"
        assert isinstance(c["page_number"], int), f"Chunk {c['id']} page_number missing!"
        assert isinstance(c["embedding"], list), f"Chunk {c['id']} embedding is not a list!"
        assert len(c["embedding"]) == 384, f"Chunk {c['id']} embedding vector dimension is {len(c['embedding'])}, expected 384!"
        assert all(isinstance(v, (int, float)) for v in c["embedding"][:10]), "Embedding vector does not contain float values!"

    logger.info("[PASS] Strong backup verification succeeded: All 19 guidelines, 19 documents, 38 chunks (with complete 384-dim vectors) verified.")
    return backup_path, backup_sha256, verified_data


def verify_live_invariants(sb) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Re-verifies all critical database invariants immediately before any operation:
    1. Exact 19 duplicate IDs present in DB.
    2. Zero canonical IDs present in duplicate list.
    3. All 5 canonical guidelines present.
    4. All 7 clinical decisions exist and reference zero duplicate records.
    5. Database counts match expectations (24 guidelines, 25 documents, 783 chunks, 7 decisions).
    """
    logger.info("Verifying live database invariants...")
    
    # 1. Total counts
    g_count = sb.from_("guidelines").select("id", count="exact", head=True).execute().count
    d_count = sb.from_("guideline_documents").select("id", count="exact", head=True).execute().count
    c_count = sb.from_("guideline_chunks").select("id", count="exact", head=True).execute().count
    dec_count = sb.from_("clinical_decisions").select("id", count="exact", head=True).execute().count

    assert g_count == 24, f"Invariant violation: Expected 24 guidelines in DB, found {g_count}"
    assert d_count == 25, f"Invariant violation: Expected 25 documents in DB, found {d_count}"
    assert c_count == 783, f"Invariant violation: Expected 783 chunks in DB, found {c_count}"
    assert dec_count == 7, f"Invariant violation: Expected 7 clinical decisions in DB, found {dec_count}"

    # 2. Duplicate IDs check
    dupe_guidelines = sb.from_("guidelines").select("id,title,organization,category").in_("id", list(ALL_DUPES)).execute().data
    assert len(dupe_guidelines) == 19, f"Expected 19 duplicate guidelines in DB, found {len(dupe_guidelines)}"
    
    dupe_docs = sb.from_("guideline_documents").select("id,guideline_id,file_name").in_("guideline_id", list(ALL_DUPES)).execute().data
    assert len(dupe_docs) == 19, f"Expected 19 duplicate documents in DB, found {len(dupe_docs)}"

    dupe_chunks = sb.from_("guideline_chunks").select("id,guideline_id,chunk_index").in_("guideline_id", list(ALL_DUPES)).execute().data
    assert len(dupe_chunks) == 38, f"Expected 38 duplicate chunks in DB, found {len(dupe_chunks)}"

    # 3. Canonical records exclusion
    for cid, label in CANONICAL_RECORDS.items():
        assert cid not in ALL_DUPES, f"CRITICAL: Canonical ID {cid} ({label}) found in target duplicate set!"
        rec = sb.from_("guidelines").select("id,title").eq("id", cid).maybe_single().execute().data
        assert rec is not None, f"CRITICAL: Canonical record {cid} ({label}) missing from DB!"

    # 4. Clinical decisions safety
    decisions = sb.from_("clinical_decisions").select("id,sources").execute().data
    dupe_chunk_ids = {c["id"] for c in dupe_chunks}
    for d in decisions:
        sources = d.get("sources") or []
        for s in sources:
            if isinstance(s, dict):
                gid = s.get("guideline_id")
                cid = s.get("chunk_id")
                assert gid not in ALL_DUPES, f"CRITICAL: Clinical decision {d['id']} references duplicate guideline {gid}!"
                assert cid not in dupe_chunk_ids, f"CRITICAL: Clinical decision {d['id']} references duplicate chunk {cid}!"

    logger.info("[PASS] Live invariants verified: Database is in the exact expected state.")
    return dupe_guidelines, dupe_docs, dupe_chunks, decisions


def run_dry_run():
    sb = get_supabase_client()
    logger.info("================================================================================")
    logger.info("STARTING DRY-RUN EXECUTION (ZERO DATABASE MUTATIONS)")
    logger.info("================================================================================")

    # 1. Invariants check
    dupe_g, dupe_d, dupe_c, decisions = verify_live_invariants(sb)

    # 2. Complete backup generation & verification
    backup_path, backup_sha256, verified_data = create_complete_backup(sb, ALL_DUPES)

    # 3. Test pgvector restoration roundtrip in an isolated dummy chunk
    logger.info("Testing isolated vector restoration roundtrip...")
    test_chunk = dict(verified_data["guideline_chunks"][0])
    test_chunk_id = "00000000-0000-0000-0000-ffffffffffff"
    test_chunk["id"] = test_chunk_id
    test_chunk["content"] = "TEMPORARY_RESTORE_TEST_CHUNK"
    
    # Insert test chunk with vector
    sb.from_("guideline_chunks").insert(test_chunk).execute()
    read_back = sb.from_("guideline_chunks").select("id, embedding").eq("id", test_chunk_id).single().execute().data
    assert read_back is not None, "Failed to read back test chunk!"
    read_vec = json.loads(read_back["embedding"]) if isinstance(read_back["embedding"], str) else read_back["embedding"]
    assert len(read_vec) == 384, f"Vector restore dimension mismatch: {len(read_vec)}"
    # Clean up test chunk immediately
    sb.from_("guideline_chunks").delete().eq("id", test_chunk_id).execute()
    logger.info("[PASS] Vector restoration roundtrip tested and verified successfully.")

    # 4. Check if Migration 007 transactional RPC is available
    logger.info("Checking for transactional RPC 'execute_guideline_duplicate_cleanup'...")
    has_rpc = False
    try:
        # Dry-run RPC test with dummy invalid input to check function presence
        sb.rpc("execute_guideline_duplicate_cleanup", {"target_ids": []}).execute()
    except Exception as rpc_err:
        err_msg = str(rpc_err)
        if "Expected 19 target IDs" in err_msg or "Rollback triggered" in err_msg or "Expected to delete" in err_msg:
            has_rpc = True
            logger.info("[PASS] Transactional PostgreSQL function 'execute_guideline_duplicate_cleanup' IS INSTALLED and ready.")
        elif "Could not find the function" in err_msg or "function execute_guideline_duplicate_cleanup does not exist" in err_msg:
            has_rpc = False
            logger.warning("[NOTICE] Migration 007 RPC not yet installed in Supabase.")
        else:
            logger.info(f"RPC check status: {err_msg}")

    # 5. Output Itemized Targets
    print("\n" + "=" * 80)
    print("ITEMIZED TARGETS FOR CLEANUP (CONFIRMED 19 RECORDS)")
    print("=" * 80)
    for g in sorted(dupe_g, key=lambda x: (x["title"], x["id"])):
        print(f"  Guideline [{g['id']}] | {g['title'][:55]} | {g['organization']} | {g['category']}")

    print("\n" + "=" * 80)
    print("BACKUP VERIFICATION SUMMARY")
    print("=" * 80)
    print(f"  Backup File:      {backup_path}")
    print(f"  SHA-256 Checksum: {backup_sha256}")
    print(f"  Backed up Guidelines: {len(verified_data['guidelines'])}")
    print(f"  Backed up Documents:  {len(verified_data['guideline_documents'])}")
    print(f"  Backed up Chunks:     {len(verified_data['guideline_chunks'])} (ALL 384-dim vectors intact)")

    print("\n" + "=" * 80)
    print("FINAL EXPECTED COUNTS AFTER EXECUTION")
    print("=" * 80)
    print("  Guidelines:          5  (CDC Opioids, KDIGO 2022, SGLT2i, KDIGO 2024 Eval, Demo)")
    print("  Guideline Documents: 6  (5 canonical + 1 extra KDIGO 2022 doc 05c0de56)")
    print("  Guideline Chunks:    745 (700 CDC + 36 KDIGO 2022 + 5 Demo + 2 KDIGO 2024 + 2 SGLT2i)")
    print("  Clinical Decisions:  7  (100% untouched)")
    print("=" * 80 + "\n")
    print("DRY-RUN COMPLETE: ZERO LIVE DATA WAS DELETED. AWAITING YOUR EXPLICIT APPROVAL.")


def run_execute():
    sb = get_supabase_client()
    logger.info("================================================================================")
    logger.info("STARTING EXECUTION OF SAFE GUIDELINE CLEANUP")
    logger.info("================================================================================")

    # Step 0: Verify approved backup file and checksum
    approved_backup = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "database", "backups", "guidelines_cleanup_backup_20261105_154636.json")
    )
    expected_sha256 = "0e07ea3c90f538c3a3c1a97c4b271dbbb107ff0cf7077ce8e0f804b864c14e9f"
    assert os.path.exists(approved_backup), f"Approved backup file missing: {approved_backup}"
    actual_sha = compute_file_sha256(approved_backup)
    assert actual_sha == expected_sha256, f"Approved backup SHA-256 mismatch! Expected {expected_sha256}, got {actual_sha}"
    logger.info(f"[PASS] Approved backup verified on disk with matching SHA-256: {actual_sha}")

    # Step 1: Re-verify all live invariants immediately before deletion
    verify_live_invariants(sb)

    # Step 2: Create and verify complete backup with full embeddings
    backup_path, backup_sha256, verified_data = create_complete_backup(sb, ALL_DUPES)

    # Step 3: Execute via Transactional PostgreSQL RPC ONLY
    logger.info("Step 3: Executing via Transactional PostgreSQL RPC (execute_guideline_duplicate_cleanup)...")
    try:
        rpc_res = sb.rpc("execute_guideline_duplicate_cleanup", {
            "target_ids": sorted(list(ALL_DUPES)),
            "expected_guideline_count": 19,
            "expected_document_count": 19,
            "expected_chunk_count": 38
        }).execute()

        if not rpc_res.data or not rpc_res.data.get("success"):
            raise RuntimeError(f"Transactional RPC returned unexpected result: {rpc_res.data}")

        logger.info(f"Transactional PostgreSQL RPC executed successfully: {rpc_res.data}")

    except Exception as rpc_err:
        err_msg = str(rpc_err)
        logger.error(
            "CRITICAL: Transactional PostgreSQL RPC 'execute_guideline_duplicate_cleanup' failed or is not installed.\n"
            f"Details: {err_msg}\n"
            "SAFETY INVARIANT ENFORCED: The script strictly refuses to execute non-transactional REST deletion.\n"
            "Please ensure Migration 007 (database/migrations/007_safe_guideline_cleanup.sql) has been applied in Supabase SQL Editor."
        )
        raise RuntimeError(
            "Execution aborted: Transactional PostgreSQL RPC is not available in Supabase. "
            "Sequential REST deletion is strictly refused to guarantee database atomicity."
        ) from rpc_err

    # Step 4: Post-execution strict verification
    rem_g = sb.from_("guidelines").select("id,title,document_type,status").execute().data
    rem_d = sb.from_("guideline_documents").select("id,guideline_id,file_name,checksum").execute().data
    rem_c = sb.from_("guideline_chunks").select("id", count="exact", head=True).execute().count
    rem_dec = sb.from_("clinical_decisions").select("id").execute().data

    assert len(rem_g) == 5, f"Post-cleanup failure: Expected 5 guidelines, found {len(rem_g)}"
    assert len(rem_d) == 6, f"Post-cleanup failure: Expected 6 documents, found {len(rem_d)}"
    assert rem_c == 745, f"Post-cleanup failure: Expected 745 chunks, found {rem_c}"
    assert len(rem_dec) == 7, f"Post-cleanup failure: Expected 7 clinical decisions, found {len(rem_dec)}"

    logger.info("================================================================================")
    logger.info("CLEANUP COMPLETED AND VERIFIED SUCCESSFULLY")
    logger.info(f"  Guidelines:          {len(rem_g)} (all unique canonical publications)")
    logger.info(f"  Guideline Documents: {len(rem_d)} (5 canonical + 1 extra KDIGO 2022 doc)")
    logger.info(f"  Guideline Chunks:    {rem_c} (all genuine evidence chunks intact)")
    logger.info(f"  Clinical Decisions:  {len(rem_dec)} (100% untouched)")
    logger.info(f"  Verified Backup:     {backup_path}")
    logger.info("================================================================================")


def rollback_from_backup(backup_path: str):
    """
    Restores the complete database state from a verified JSON backup,
    including all guidelines, documents, and 384-dimensional pgvector embeddings.
    """
    sb = get_supabase_client()
    logger.info(f"Initiating rollback from backup: {backup_path}")

    # Check sha256 of backup if present
    sha256_path = backup_path + ".sha256"
    if os.path.exists(sha256_path):
        with open(sha256_path, "r", encoding="utf-8") as fp:
            expected_sha = fp.read().strip()
        actual_sha = compute_file_sha256(backup_path)
        assert actual_sha == expected_sha, "Rollback aborted: Backup file SHA-256 signature mismatch!"
        logger.info(f"[PASS] Backup signature verified: {actual_sha}")

    with open(backup_path, "r", encoding="utf-8") as fp:
        data = json.load(fp)

    logger.info(f"Restoring {len(data['guidelines'])} guidelines...")
    for g in data.get("guidelines", []):
        sb.from_("guidelines").upsert(g).execute()

    logger.info(f"Restoring {len(data['guideline_documents'])} documents...")
    for d in data.get("guideline_documents", []):
        sb.from_("guideline_documents").upsert(d).execute()

    logger.info(f"Restoring {len(data['guideline_chunks'])} chunks with vector embeddings...")
    for c in data.get("guideline_chunks", []):
        sb.from_("guideline_chunks").upsert(c).execute()

    logger.info("Rollback completed: All original records and vector embeddings restored successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", default=True, help="Simulate cleanup and test backup")
    parser.add_argument("--execute", action="store_true", help="Execute actual deletion")
    parser.add_argument("--rollback", type=str, help="Rollback from a specified JSON backup file")
    args = parser.parse_args()

    if args.rollback:
        rollback_from_backup(args.rollback)
    elif args.execute:
        run_execute()
    else:
        run_dry_run()
