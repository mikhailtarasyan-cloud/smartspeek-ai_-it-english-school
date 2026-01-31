from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, engine
from app.routers import courses, dashboard, progress, orchestrator, telegram, auth, ai, learning_plan, minigame_truefalse
from app.guard.middleware import RateLimitMiddleware, SecurityHeadersMiddleware

app = FastAPI(title="SmartSpeek API", version="0.1.0")

# Security headers middleware (first, so it applies to all responses)
app.add_middleware(SecurityHeadersMiddleware)

# CORS with allowlist
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-User-Id"],
)

# Rate limiting
rate_limits = {
    "/api/auth/login": (10, 60),  # 10 requests per minute
    "/api/auth/register": (10, 60),  # 10 requests per minute
    "/api/orchestrator/message": (30, 60),  # 30 requests per minute
    "/api/ai": (20, 60),  # 20 requests per minute for all /api/ai/* endpoints
}
app.add_middleware(RateLimitMiddleware, limits=rate_limits)

app.include_router(courses.router, prefix="/api", tags=["courses"])
app.include_router(progress.router, prefix="/api", tags=["progress"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(orchestrator.router, prefix="/api", tags=["orchestrator"])
app.include_router(telegram.router, prefix="/api", tags=["telegram"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(ai.router, prefix="/api", tags=["ai"])
app.include_router(learning_plan.router, prefix="/api", tags=["learning-plan"])
app.include_router(minigame_truefalse.router, prefix="/api", tags=["minigame-truefalse"])

@app.on_event("startup")
def ensure_sqlite_tables():
    if str(engine.url).startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        # Lightweight schema patching for local SQLite (no Alembic needed for dev)
        # Ensures auth columns exist when DB was created before auth was added.
        try:
            with engine.connect() as conn:
                cols = {
                    row[1]  # pragma table_info: (cid, name, type, notnull, dflt_value, pk)
                    for row in conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
                }
                if "email" not in cols:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN email VARCHAR")
                if "password_hash" not in cols:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN password_hash VARCHAR")
                if "name" not in cols:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN name VARCHAR")
                if "avatar" not in cols:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN avatar VARCHAR")
                # Create unique index if missing
                idx = {
                    row[1]  # pragma index_list: (seq, name, unique, origin, partial)
                    for row in conn.exec_driver_sql("PRAGMA index_list(users)").fetchall()
                }
                if "ix_users_email" not in idx:
                    conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)")
                conn.commit()
        except Exception:
            # Don't block startup in dev; auth endpoint will surface issues if any remain.
            pass


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
