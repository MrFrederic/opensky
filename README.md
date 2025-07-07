# Dropzone Management System

A modern, full-stack web application for managing dropzone (parachute center) operations. This system provides comprehensive tools for managing users, tandem bookings, equipment, load manifests, and more.

## 🚀 Features

- **Multi-role User Management** - Admin, Instructor, Sportsman, and Newby roles with Telegram SSO
- **Tandem Booking System** - Comprehensive slot management and booking capabilities
- **Equipment Management** - Track inventory, usage, and availability
- **Load & Manifest Management** - Organize flights and track jumps
- **Digital Logbook** - Electronic jump logging for sportsmen
- **Self-Manifesting** - Allow experienced jumpers to sign up for loads
- **Reporting & Analytics** - Comprehensive system reporting

## 🏗️ Tech Stack

### Backend
- **FastAPI** (Python 3.11+) - Modern, fast web framework
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Alembic** - Database migration tool
- **JWT Authentication** - Secure token-based auth
- **Docker** - Containerized deployment

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **React Query** - Powerful data fetching
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/MrFrederic/dropzone-management.git
   cd dropzone-management
   ```

2. **Setup configuration**
   ```bash
   # Copy the example docker-compose file
   cp docker-compose.example.yml docker-compose.yml
   
   # Edit docker-compose.yml to add your configuration
   # - Replace YOUR_TELEGRAM_BOT_TOKEN_HERE with your actual bot token
   # - Update SECRET_KEY with a secure random string
   # - Modify database credentials if needed
   ```

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the applications**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000 (proxied through frontend)
   - API Documentation: http://localhost/api/docs (proxied)
   - PgAdmin: http://localhost:5050 (admin@admin.com / admin)

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL (via Docker)
docker run -d --name postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=pass \
  -e POSTGRES_DB=dropzone_db \
  -p 5432:5432 postgres:15

# Run migrations and start server manually
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📚 API Documentation

The backend provides comprehensive API documentation:

- **Swagger UI**: http://localhost:8000/docs - Interactive API explorer
- **ReDoc**: http://localhost:8000/redoc - Clean API documentation
- **OpenAPI Schema**: http://localhost:8000/openapi.json - Machine-readable API spec

## 🏗️ Project Structure

```
dropzone-management-system/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core utilities
│   │   ├── crud/           # Database operations
│   │   ├── models/         # SQLAlchemy models
│   │   └── schemas/        # Pydantic schemas
│   ├── alembic/            # Database migrations
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Multi-service setup
├── API_ENDPOINTS.md        # API endpoint documentation
├── PROJECT_OVERVIEW.md     # Detailed project overview
└── README.md              # This file
```

## 🔐 Authentication & Authorization

The system implements role-based access control with the following roles:

- **Admin** - Full system access
- **Instructor** - Manage loads, manifests, and student operations
- **Sportsman** - Self-manifest, equipment booking, logbook access
- **Newby** - Limited access, requires supervision

Authentication is handled via JWT tokens with optional Telegram SSO integration.

## 🗄️ Database Schema

The system uses a normalized PostgreSQL schema with the following key entities:

- **Users** - System users with roles and permissions
- **Equipment** - Parachutes, altimeters, and other gear
- **Loads** - Flight loads with manifest management
- **Jumps** - Individual jump records
- **Tandems** - Tandem booking and slot management
- **Dictionaries** - Configurable system parameters

## 🔧 Development

### Backend Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Generate new migration
alembic revision --autogenerate -m "Description"

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
python -m pytest
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🐳 Docker Services

The docker-compose.yml defines the following services:

- **postgres** - PostgreSQL database (port 5432)
- **pgadmin** - Database administration tool (port 5050)
- **backend** - FastAPI application (port 8000)
- **frontend** - React application with Nginx (port 3000)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions, issues, or contributions, please:

1. Check the [API Documentation](API_ENDPOINTS.md)
2. Review the [Project Overview](PROJECT_OVERVIEW.md)
3. Open an issue on GitHub
4. Contact the development team

## 🗺️ Roadmap

- [ ] Complete Telegram bot integration
- [ ] Payment processing system
- [ ] Real-time notifications
- [ ] Mobile application
- [ ] Advanced reporting dashboard
- [ ] Equipment maintenance tracking
- [ ] Weather integration
- [ ] Multi-language support

---

Built with ❤️ for the skydiving community
