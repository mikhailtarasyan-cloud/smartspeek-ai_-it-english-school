from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app.routers import courses, dashboard, progress, orchestrator, telegram, auth

app = FastAPI(title="SmartSpeek API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses.router, prefix="/api", tags=["courses"])
app.include_router(progress.router, prefix="/api", tags=["progress"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(orchestrator.router, prefix="/api", tags=["orchestrator"])
app.include_router(telegram.router, prefix="/api", tags=["telegram"])
app.include_router(auth.router, prefix="/api", tags=["auth"])

@app.on_event("startup")
def ensure_sqlite_tables():
    if str(engine.url).startswith("sqlite"):
        Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
