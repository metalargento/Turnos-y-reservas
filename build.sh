#!/bin/bash
set -e

echo "Installing dependencies..."
pip install --no-cache-dir --upgrade pip setuptools wheel
pip install --no-cache-dir -r backend/requirements.txt

echo "Running migrations..."
cd backend
python -c "from migrations.run_migrations import run_migrations; run_migrations()"
