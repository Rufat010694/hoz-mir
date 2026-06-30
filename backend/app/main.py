from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, products, orders, clients, catalog, reports, ws, me

app = FastAPI(
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
