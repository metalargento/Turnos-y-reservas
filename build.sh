#!/bin/bash
set -e

echo "Installing dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build

echo "Build complete!"
