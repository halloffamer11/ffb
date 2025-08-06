from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import datetime
import os
from pathlib import Path

# Import database and models
from .database import engine, get_db
from .models import Base, DataRecord, DataRecordCreate, DataRecordResponse
from .routes import data, calculations, fantasy

# Create FastAPI app
app = FastAPI(title="FFB Application", version="1.0.0")

# Create tables
Base.metadata.create_all(bind=engine)

# Mount static files
app.mount("/static", StaticFiles(directory="app/frontend/static"), name="static")

# Include routers
app.include_router(data.router)
app.include_router(calculations.router)
app.include_router(fantasy.router)

@app.get("/")
async def read_root():
    """Serve the main HTML file"""
    return FileResponse("app/frontend/index.html")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
