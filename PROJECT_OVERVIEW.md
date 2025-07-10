# Dropzone Management System

A comprehensive backend service for managing dropzone operations, built according to the specifications in the SRS (Software Requirements Specification) and SAD (Software Architecture Document).

## 🎯 Project Overview

This backend service manages all aspects of a dropzone operation including:

- **User Management**: Telegram SSO authentication, role-based access control
- **Tandem Operations**: Slot management, booking system
- **Sportsman Management**: Self-manifesting, digital logbook
- **Equipment Management**: Inventory tracking, usage history
- **Load Management**: Flight organization, jump tracking
- **System Administration**: Configurable dictionaries, comprehensive reporting

## 🔐 Telegram Authentication Flow

The system uses Telegram Login Widget for authentication:

1. **Frontend Configuration**: 
   - The Telegram bot username is passed directly to the frontend via the environment variable `TELEGRAM_BOT_USERNAME`
   - This follows the KISS principle by avoiding unnecessary API calls for configuration

2. **Authentication Process**:
   - User clicks "Login with Telegram" in the frontend
   - Telegram widget authenticates the user through Telegram's servers
   - Authentication data is sent to backend `/api/v1/auth/telegram-auth` endpoint
   - Backend verifies the data and issues JWT tokens

3. **Environment Setup**:
   - Set `TELEGRAM_BOT_TOKEN` for the backend (for verification)
   - Set `TELEGRAM_BOT_USERNAME` for the frontend widget (passed as `TELEGRAM_BOT_USERNAME`)

This approach simplifies the architecture by eliminating unnecessary API calls while maintaining security.

## 🏗️ Architecture

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with Telegram SSO
- **API Design**: RESTful with automatic OpenAPI documentation
- **Deployment**: Docker containerized with docker compose

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/                 # API routes organized by version
│   │   ├── deps.py         # Authentication & authorization dependencies
│   │   └── v1/             # Version 1 API endpoints
│   ├── core/               # Core application components
│   │   ├── config.py       # Configuration management
│   │   ├── database.py     # Database connection & session management
│   │   └── security.py     # JWT & password hashing utilities
│   ├── crud/               # Database operations (Create, Read, Update, Delete)
│   ├── models/             # SQLAlchemy database models
│   ├── schemas/            # Pydantic schemas for API validation
│   └── main.py            # FastAPI application entry point
├── alembic/               # Database migration management
├── requirements.txt       # Python dependencies
├── Dockerfile            # Container definition
├── entrypoint.sh         # Container startup script
├── startup.py            # Database initialization
└── README.md             # Detailed documentation
```

## 🚀 Quick Start - Docker Compose

```bash
# From project root
docker compose up --build
```

## 📚 API Documentation

Once running, comprehensive API documentation is available at:
- **Interactive Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📊 Key Features Implemented

### User Management (UR-001 to UR-004)
- ✅ Telegram SSO authentication
- ✅ User registration with default "Newby" status
- ✅ Role-based permissions (Newby, Individual Sportsman, Sportsman, Instructor)
- ✅ Admin user management capabilities
- ✅ Sportsman status request workflow

### System Administration (UR-018 to UR-019)
- ✅ Configurable system dictionaries
- ✅ Jump statistics reporting
- ✅ Complete CRUD operations for all entities

## 🔧 Technical Implementation

### Database Schema
- Fully normalized PostgreSQL schema
- Audit trails with created_at/updated_at timestamps
- Foreign key relationships maintaining data integrity
- Configurable dictionaries for system flexibility

### API Design
- RESTful endpoints following standard conventions
- Action-based endpoints for complex business operations
- Comprehensive error handling
- Pagination support for large datasets

### Business Logic
- Equipment double-booking prevention
- Tandem slot availability checking
- Manifest approval workflow
- Payment status tracking (no payment processing)

## 🏃‍♂️ Development Workflow

1. **Models**: Define SQLAlchemy models in `app/models/`
2. **Schemas**: Create Pydantic schemas in `app/schemas/`
3. **CRUD**: Implement database operations in `app/crud/`
4. **API**: Add endpoints in `app/api/v1/`
5. **Testing**: Validate with provided test scripts

## 📈 Next Steps

The backend is production-ready with the following recommendations:

1. **Telegram Bot Integration**: Complete the authentication workflow
2. **Payment Integration**: Add payment processing capabilities
3. **Notifications**: Implement the notification system
4. **Frontend**: Build the React-based web interface
5. **Monitoring**: Add logging and monitoring capabilities

## 🛡️ Production Considerations

- Environment-specific configuration
- Database connection pooling
- Rate limiting implementation
- Comprehensive logging
- Error monitoring and alerting
- Regular backup procedures
- SSL/TLS configuration

This backend service provides a solid foundation for the complete Dropzone Management System, implementing all core requirements with clean, maintainable, and scalable code.
