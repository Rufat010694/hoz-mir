import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.config import settings
from app.routers import auth, products, orders, clients, catalog, reports, ws, me

MAX_SAFE_INT = 2**53 - 1


def _make_safe(obj):
    if isinstance(obj, int) and (obj > MAX_SAFE_INT or obj < -MAX_SAFE_INT):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _make_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_make_safe(i) for i in obj]
    return obj


class SafeJSONResponse(Response):
    media_type = "application/json"

    def render(self, content) -> bytes:
        return json.dumps(_make_safe(content), ensure_ascii=False).encode("utf-8")


app = FastAPI(
    default_response_class=SafeJSONResponse,
    title=settings.APP_NAME,
    description="API для системы управления каталогом и продажами бытовых мелочей",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(me.router, prefix="/api")
app.include_router(ws.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
