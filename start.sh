#!/bin/bash
cd /app
python3 -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
