#!/bin/bash
set -e

echo "🚀 Starting Dropzone Management System Backend Container"
echo "========================================================"

# Function to check if postgres is ready
check_postgres() {
    python -c "
import sys
import psycopg2
from urllib.parse import urlparse
import os

db_url = os.getenv('DATABASE_URL', 'postgresql://user:pass@postgres:5432/dropzone_db')
parsed = urlparse(db_url)

try:
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path[1:]  # Remove leading '/'
    )
    conn.close()
    print('Database connection successful')
    sys.exit(0)
except Exception as e:
    print(f'Database connection failed: {e}')
    sys.exit(1)
"
}

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if check_postgres; then
        echo "✅ PostgreSQL is ready!"
        break
    else
        echo "🔄 Attempt $attempt/$max_attempts - PostgreSQL not ready yet..."
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Failed to connect to PostgreSQL after $max_attempts attempts"
    exit 1
fi

# Run database initialization
echo "📊 Running database initialization..."
python startup.py

if [ $? -ne 0 ]; then
    echo "❌ Database initialization failed"
    exit 1
fi

# Start the application
echo "🎯 Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
