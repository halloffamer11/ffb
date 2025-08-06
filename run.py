#!/usr/bin/env python3
"""
FFB Application Startup Script
Run this script to start the FastAPI application
"""

import uvicorn
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

if __name__ == "__main__":
    print("Starting FFB Application...")
    print("Access the application at: http://localhost:8000")
    print("Press Ctrl+C to stop the server")
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
