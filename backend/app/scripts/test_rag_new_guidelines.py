import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas import QueryRequest
from app.services.rag import run_rag_pipeline

TEST_QUERIES = [
    ("Hypertension", "What is the threshold for treating stage 1 hypertension in adults under 80?"),
    ("Atrial Fibrillation", "What is the recommended tool for assessing stroke risk in atrial fibrillation (CHA2DS2-VASc)?"),
    ("Chronic Pain", "Should opioids be initiated for chronic primary pain according to clinical guidance?"),
    ("Thyroid Disease", "What is the treatment threshold for subclinical hypothyroidism based on TSH levels?"),
    ("Antimicrobial Stewardship", "What are the principles for reviewing antibiotic prescriptions within 48 to 72 hours?"),
    ("COVID-19", "What treatments are recommended for patients hospitalized with severe COVID-19 pneumonia?"),
    ("Multimorbidity", "How should clinical management and treatment burden be assessed in patients with multimorbidity?"),
    ("Nephrology", "What is the recommendation for SGLT2 inhibitors in patients with type 2 diabetes and CKD?"),
]

def main():
    print("Testing RAG Hybrid Retrieval across newly ingested guidelines...\n")
    all_passed = True
    
    for category, question in TEST_QUERIES:
        print(f"[{category}] Question: {question}")
        try:
            req = QueryRequest(question=question, match_count=5)
            res = run_rag_pipeline(req)
            sources = res.sources
            print(f"  -> Type: {res.type}, Retrieved {len(sources)} sources")
            if not sources:
                print(f"  WARNING: No sources returned for {category}!")
                all_passed = False
            else:
                for idx, s in enumerate(sources[:2]):
                    print(f"     Source {idx+1}: [{s.guideline_title}] Org: {s.issuing_organization} | Sec: {s.section_title} | Score: {s.relevance_score}")
                print(f"  -> Answer preview: {res.answer[:140]}...\n")
        except Exception as e:
            print(f"  ERROR running RAG pipeline for {category}: {e}\n")
            all_passed = False
            
    if all_passed:
        print("ALL RAG RETRIEVAL TESTS PASSED SUCCESSFULLY!")
    else:
        print("SOME RAG RETRIEVAL TESTS HAD ISSUES.")

if __name__ == "__main__":
    main()
