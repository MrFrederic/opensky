# Dropzone Management System - Backend

This is the backend service for the Dropzone Management System, built with FastAPI and PostgreSQL.

## Features

- **User Management**: Authentication via Telegram SSO, user roles and statuses
- **Equipment Management**: Track parachutes, harnesses, safety devices, etc.
- **Tandem Operations**: Manage tandem slot availability and bookings
- **Manifest System**: Self-manifesting for sportsmen with admin approval workflow
- **Load Management**: Organize jumps into loads/flights
- **Digital Logbook**: Complete jump history for users
- **Dictionary Management**: Configurable system values
- **RESTful API**: Comprehensive API with automatic documentation

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Robust relational database
- **Alembic**: Database migration tool
- **JWT**: JSON Web Tokens for authentication
- **Pydantic**: Data validation using Python type annotations

## Quick Start

### Using Docker Compose (Recommended)

1. Navigate to the project root directory
2. Start the services:
   ```bash
   docker-compose up --build
   ```
3. The API will be available at: http://localhost:8000
4. API documentation at: http://localhost:8000/docs

The backend service now includes **automatic database initialization**:
- ✅ Waits for PostgreSQL to be ready
- ✅ Runs Alembic migrations automatically
- ✅ Creates tables if migrations fail (fallback)
- ✅ Initializes basic data (dictionaries, admin user)
- ✅ Verifies database connectivity on startup

### Local Development

1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Database Setup Options:**

   **Option A: Automatic (with Docker)**
   ```bash
   # Start PostgreSQL
   docker-compose up postgres
   
   # Run manual initialization
   python manual_init.py
   
   # Start the application
   uvicorn app.main:app --reload
   ```

   **Option B: Manual Setup**
   ```bash
   # Create database tables and initial data
   python init_dev_db.py
   
   # Initialize Alembic (optional)
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   
   # Start the application
   uvicorn app.main:app --reload
   ```

## Database Initialization

The system provides multiple ways to initialize the database:

### 1. Automatic Initialization (Docker)
When using `docker-compose up`, the backend service will:
- Wait for PostgreSQL to be ready
- Run database migrations
- Create tables if needed
- Initialize basic data

### 2. Manual Initialization (Development)
For local development, use the manual initialization script:
```bash
python manual_init.py
```

This script will:
- Check database connectivity
- Create all necessary tables
- Set up Alembic migrations
- Initialize basic application data

### 3. Development Data Reset
To reset and reinitialize the database:
```bash
python init_dev_db.py
```

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API routes
│   │   ├── deps.py         # Dependencies (auth, permissions)
│   │   └── v1/             # API version 1
│   │       ├── auth.py     # Authentication endpoints
│   │       ├── users.py    # User management
│   │       ├── tandems.py  # Tandem operations
│   │       ├── manifests.py # Manifest management
│   │       ├── loads.py    # Loads and jumps
│   │       ├── equipment.py # Equipment management
│   │       └── dictionaries.py # System dictionaries
│   ├── core/               # Core functionality
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # Database connection
│   │   └── security.py     # JWT and password hashing
│   ├── crud/               # Database operations
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   └── main.py            # FastAPI application
├── alembic/               # Database migrations
├── requirements.txt       # Python dependencies
├── Dockerfile            # Docker configuration
└── .env.example          # Environment variables template
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Key Endpoints

### Authentication
- `POST /api/v1/auth/telegram-auth` - Authenticate with Telegram
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users/me` - Get current user info
- `PUT /api/v1/users/me` - Update current user
- `POST /api/v1/users/me/request-sportsman-status` - Request sportsman upgrade

### Tandems
- `GET /api/v1/tandems/slots/availability` - Check slot availability
- `POST /api/v1/tandems/bookings` - Book tandem jump
- `GET /api/v1/tandems/bookings/me` - Get my bookings

### Manifests
- `POST /api/v1/manifests/` - Create manifest
- `GET /api/v1/manifests/me` - Get my manifests
- `POST /api/v1/manifests/{id}/approve` - Approve manifest (admin)

### Loads & Jumps
- `GET /api/v1/loads` - List loads
- `GET /api/v1/jumps/me` - Get my jump history (logbook)
- `GET /api/v1/jumps/me/stats` - Get jump statistics

## Authentication

The system uses JWT tokens for authentication. Users authenticate via Telegram SSO:

1. User provides Telegram authentication data
2. System validates and creates/retrieves user
3. JWT access token is returned
4. Token is included in API requests via Authorization header

## User Roles & Permissions

### User Statuses
- **Newby**: Can book tandems, limited access
- **Individual Sportsman**: Can manifest, pays for jumps
- **Sportsman**: Can manifest, free jumps
- **Instructor**: Full sportsman privileges + additional access

### Admin Role
- Can be assigned to any user regardless of status
- Full system access including user management, equipment, etc.

## Database Schema

The system uses a normalized PostgreSQL schema with:
- User management with roles and statuses
- Equipment inventory with categories and status tracking
- Manifest and jump tracking with full audit trail
- Configurable dictionaries for system values
- Tandem slot management with availability tracking

## Development

### Adding New Features

1. Create/update models in `app/models/`
2. Add CRUD operations in `app/crud/`
3. Define schemas in `app/schemas/`
4. Implement API endpoints in `app/api/v1/`
5. Add appropriate tests

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Security Considerations

- JWT tokens have configurable expiration
- Password hashing using bcrypt
- Role-based access control on all endpoints
- SQL injection protection via SQLAlchemy ORM
- CORS properly configured for production

## Deployment

The application is containerized and ready for deployment:

1. Build the container: `docker build -t dropzone-backend ./backend`
2. Configure environment variables for production
3. Set up PostgreSQL database
4. Run migrations
5. Deploy container

For production, ensure:
- Use strong SECRET_KEY
- Configure proper CORS origins
- Set up database backups
- Use HTTPS
- Configure proper logging

## Scripts Reference

- `entrypoint.sh` - Docker container startup script
- `startup.py` - Automatic database initialization for containers
- `manual_init.py` - Manual database setup for development
- `init_dev_db.py` - Development data initialization
- `start-dev.sh` - Development startup helper
