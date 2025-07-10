#!/bin/bash
set -e

echo "🚀 Starting Dropzone Management System Backend Container"
echo "========================================================"

# Run all initialization (DB wait, migrations, MinIO, etc.)
echo "📊 Running database and storage initialization..."
python startup.py

if [ $? -ne 0 ]; then
    echo "❌ Initialization failed"
    exit 1
fi

# Start the application
echo "🎯 Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
