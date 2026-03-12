import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.routers import auth, rooms, bookings, promo_codes, maintenance, invoices, employees, reports
from app.config import settings

app = FastAPI(title="Shelbee's Suites API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload/pdf directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PDF_DIR, exist_ok=True)

# API routers
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(bookings.router)
app.include_router(promo_codes.router)
app.include_router(maintenance.router)
app.include_router(invoices.router)
app.include_router(employees.router)
app.include_router(reports.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Shelbee's Suites"}


# Serve frontend build (production) — must be last
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                              "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
