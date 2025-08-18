#!/usr/bin/env python3
"""
Simple script to start the backend server from the correct directory
"""
import os
import sys
import subprocess

# Change to the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

print(f"Starting server from: {os.getcwd()}")

# Start the server
try:
    subprocess.run([
        sys.executable, "-m", "uvicorn", 
        "app.main:app", 
        "--reload", 
        "--host", "0.0.0.0", 
        "--port", "8000"
    ])
except KeyboardInterrupt:
    print("\nServer stopped")
