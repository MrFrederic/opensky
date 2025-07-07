# Dropzone Management System - Frontend

This is the React-based frontend for the Dropzone Management System, built with modern technologies and following the architecture specified in the SAD document.

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Zustand** - Global state management
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form handling and validation

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication-related components
│   ├── forms/          # Form components
│   ├── layouts/        # Layout components
│   └── ui/             # Basic UI components
├── pages/              # Page components
├── services/           # API service functions
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
├── lib/                # Utility libraries and configurations
├── router/             # React Router configuration
└── index.css           # Global styles with Tailwind
```

## Key Features Based on SRS Requirements

### User Management (UR-001 to UR-004)
- Telegram SSO authentication
- User profile management
- Role-based access control

### Tandem Management (UR-005 to UR-008)
- Tandem booking system with calendar
- Slot availability checking
- Booking modifications

### Sportsman Features (UR-009 to UR-010)
- Digital logbook
- Self-manifesting system
- Equipment selection

### Equipment Management (UR-011 to UR-012)
- Equipment inventory viewing
- Usage tracking

### Load Management (UR-013 to UR-017)
- Manifest review and approval
- Load scheduling and management
- Jump tracking

### Reporting (UR-018)
- Jump statistics and reports

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Commands

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Docker Development

The frontend is configured to run in Docker with nginx for production builds:

```bash
# Build and run with docker-compose
docker-compose up -d frontend
```

## Environment Variables

The frontend uses environment variables to configure API connections:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_HOST` | Base URL for backend API | Empty (uses relative paths) |
| `API_HOST` | Used in docker build for configuring API proxy | `http://backend:8000` |

### Docker Compose (Recommended)

Environment variables are automatically handled by Docker Compose. For local development without Docker, you can set:

```bash
# For local development only
export VITE_API_HOST=http://localhost:8000
```

```bash
# Build and run with docker-compose
docker-compose up frontend

# Access the application
open http://localhost:3000
```

## API Integration

The frontend is configured to work with the backend API through:

- **Proxy Configuration**: Vite dev server proxies `/api` requests to `http://localhost:8000`
- **Axios Instance**: Pre-configured with base URL and authentication headers
- **React Query**: Manages server state with caching and synchronization

## Authentication Flow

1. Users authenticate via Telegram SSO
2. JWT tokens are stored in Zustand store with persistence
3. API requests automatically include authorization headers
4. Protected routes check authentication status

## State Management

- **Auth State**: Managed by Zustand with localStorage persistence
- **Server State**: Managed by TanStack Query with caching
- **Form State**: Managed by React Hook Form with Zod validation

## Styling

The application uses Tailwind CSS with:

- Custom color palette (primary blue theme)
- Responsive design utilities
- Component classes for common patterns
- Dark mode support (can be added later)

## Environment Variables

Environment variables are handled automatically by Docker Compose. The main variables are:

- `VITE_API_HOST` - Backend API URL (set by Docker Compose)
- `API_HOST` - Used in Docker build for nginx proxy configuration

For local development without Docker, you can manually set:

```bash
export VITE_API_HOST=http://localhost:8000
```

## Deployment

The frontend is containerized with nginx for production deployment:

1. Multi-stage Docker build
2. Optimized static assets
3. Nginx configuration with API proxy
4. Security headers and gzip compression

## Next Steps

1. Install Node.js dependencies
2. Implement authentication components
3. Create page components based on user requirements
4. Add form validation and error handling
5. Implement responsive design
6. Add comprehensive testing

## Security Considerations

- JWT token management with secure storage
- API request interceptors for token refresh
- Protected routes with role-based access
- Input validation with Zod schemas
- XSS protection through React's built-in escaping
