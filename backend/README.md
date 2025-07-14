# Dropzone Management System - Backend

Backend service for the Dropzone Management System, built with FastAPI and PostgreSQL.

## Features

- **User Management**: Telegram SSO, user roles, profile fields, admin/user separation
- **Jump Types**: Configurable jump types, allowed roles, additional staff requirements
- **Load Management**: Aircraft, loads, automatic status updates, reserved/public spaces
- **Manifest System**: Manifesting for sportsmen, admin approval, jump assignment
- **Digital Logbook**: Jump history, statistics, parent/child jumps for staff
- **Dictionaries**: Configurable system values
- **RESTful API**: OpenAPI docs, role-based access, JWT authentication
- **File Storage**: MinIO integration for file uploads (e.g., user photos)
- **Automatic DB Initialization**: Waits for DB, runs Alembic migrations, fallback table creation, MinIO setup

## Tech Stack

- **FastAPI** / **Pydantic**
- **SQLAlchemy** / **Alembic**
- **PostgreSQL**
- **MinIO** (S3-compatible)
- **APScheduler** (background jobs)
- **JWT** (python-jose)
- **Docker Compose** (recommended for dev)

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker-compose up --build
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

**What happens automatically:**
- Waits for PostgreSQL to be ready
- Runs Alembic migrations
- Creates tables if migrations fail
- Initializes MinIO bucket and policy

### Local Development (Without Docker)

```bash
cd backend
pip install -r requirements.txt

# Set environment variables manually
export DATABASE_URL="postgresql://user:pass@localhost:5432/dropzone_db"
export SECRET_KEY="your-secret-key"
# ...other variables...

# Run migrations
alembic upgrade head

# Start the app
uvicorn app.main:app --reload
```

## Database Initialization

- **Docker**: Handled automatically by `startup.py`
- **Manual**: Run `alembic upgrade head` and `uvicorn app.main:app --reload`

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API routes (v1)
│   ├── core/                # Core config, DB, security, scheduler
│   ├── crud/                # CRUD logic
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   └── main.py              # FastAPI app
├── alembic/                 # DB migrations
├── requirements.txt         # Python dependencies
├── Dockerfile
├── entrypoint.sh
└── startup.py               # DB/MinIO initialization
```

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Key Endpoints

### Auth
- `POST /api/v1/auth/telegram-auth` - Telegram login
- `POST /api/v1/auth/refresh` - Refresh JWT

### Users
- `GET /api/v1/users/me` - Current user info
- `PUT /api/v1/users/me` - Update own profile
- `GET /api/v1/users/` - List/search users (admin)
- `POST /api/v1/users/` - Create user (admin)
- `PUT /api/v1/users/{id}` - Update user (admin)
- `DELETE /api/v1/users/{id}` - Delete user (admin)

### Jump Types
- `GET /api/v1/jump-types/` - List jump types
- `POST /api/v1/jump-types/` - Create (admin)
- `PUT /api/v1/jump-types/{id}` - Update (admin)
- `DELETE /api/v1/jump-types/{id}` - Delete (admin)

### Loads
- `GET /api/v1/loads/` - List loads (filter by aircraft, date, status)
- `POST /api/v1/loads/` - Create load (admin)
- `PUT /api/v1/loads/{id}` - Update load (admin)
- `PATCH /api/v1/loads/{id}/status` - Update status (admin)
- `PATCH /api/v1/loads/{id}/spaces` - Update reserved spaces (admin)
- `DELETE /api/v1/loads/{id}` - Delete load (admin)

### Jumps
- `GET /api/v1/jumps/` - List jumps (filter by user, type, load, etc.)
- `POST /api/v1/jumps/` - Create jump
- `PUT /api/v1/jumps/{id}` - Update jump
- `DELETE /api/v1/jumps/{id}` - Delete jump (admin, only if not assigned to load)
- `POST /api/v1/jumps/{id}/assign-to-load/{load_id}` - Assign jump to load
- `POST /api/v1/jumps/{id}/remove-from-load` - Remove jump from load

## Authentication

- JWT tokens (via Telegram SSO)
- Role-based access (admin/user)
- Use `Authorization: Bearer <token>` header

## User Roles

- **TANDEM_JUMPER**
- **AFF_STUDENT**
- **SPORT_PAID**
- **SPORT_FREE**
- **TANDEM_INSTRUCTOR**
- **AFF_INSTRUCTOR**
- **ADMINISTRATOR**

## Database Migrations

```bash
alembic revision --autogenerate -m "Describe changes"
alembic upgrade head
alembic downgrade -1
```

## File Storage

- MinIO S3-compatible storage for user photos and other files
- Public read policy set on bucket

## Scheduler

- APScheduler runs background job to update load statuses (e.g., FORMING → ON_CALL → DEPARTED)

## Security

- JWT tokens, bcrypt password hashing
- Role-based endpoint protection
- SQL injection protection via ORM

## Deployment

- Containerized (Docker)
- Configure environment variables for production
- Use HTTPS, strong secrets, proper CORS, backups, logging

## Scripts

- `entrypoint.sh` - Docker startup
- `startup.py` - DB/MinIO initialization and migration

---
## Authentication

The system uses JWT tokens for authentication. Users authenticate via Telegram SSO:

1. User provides Telegram authentication data
2. System validates and creates/retrieves user
3. JWT access token is returned
4. Token is included in API requests via Authorization header

## Development

### Adding New Features

1. Create/update models in `app/models/`
2. Add CRUD operations in `app/crud/`
3. Define schemas in `app/schemas/`
4. Implement API endpoints in `app/api/v1/`

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
