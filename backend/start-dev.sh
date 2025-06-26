#!/bin/bash
# Development startup script for Dropzone Management System Backend

echo "🚀 Starting Dropzone Management System Backend"
echo "============================================="

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration"
fi

# Check if database is running (optional)
echo "🔍 Checking if PostgreSQL is available..."
if pg_isready -h localhost -p 5432 2>/dev/null; then
    echo "✅ PostgreSQL is running"
    
    # Run database initialization
    echo "📊 Initializing database..."
    python init_dev_db.py
else
    echo "⚠️  PostgreSQL not found on localhost:5432"
    echo "   You can either:"
    echo "   1. Start PostgreSQL locally"
    echo "   2. Use Docker: docker-compose up postgres"
    echo "   3. Update DATABASE_URL in .env to point to your database"
fi

echo ""
echo "🎯 Starting FastAPI development server..."
echo "   API will be available at: http://localhost:8000"
echo "   Documentation at: http://localhost:8000/docs"
echo ""
# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
