import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import HealthResponse
from app.routers import assistant, patients, guidelines, reports
from app.services.embeddings import get_embedding_model
from app.services.retrieval import get_supabase_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm local embedding model on startup
    logger.info("Initializing Clinical Navigator backend...")
    try:
        get_embedding_model()
        logger.info("Embedding model pre-warmed.")
    except Exception as e:
        logger.warning(f"Could not pre-warm embedding model on startup: {e}")
    yield
    logger.info("Clinical Navigator backend shutting down.")

app = FastAPI(
    title="Clinical Navigator RAG Backend",
    description="Multi-guideline RAG backend using pgvector, BGE embeddings, and Groq LLM",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assistant.router)
app.include_router(patients.router)
app.include_router(guidelines.router)
app.include_router(reports.router)

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Health check verifying Supabase connection, Groq config, and embedding model.
    """
    supabase_ok = False
    try:
        client = get_supabase_client()
        res = client.from_("guidelines").select("id", count="exact").limit(1).execute()
        supabase_ok = True
    except Exception:
        supabase_ok = False

    return HealthResponse(
        status="healthy" if supabase_ok else "degraded",
        supabase_connected=supabase_ok,
        groq_configured=bool(settings.GROQ_API_KEY),
        embedding_model=settings.EMBEDDING_MODEL
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
