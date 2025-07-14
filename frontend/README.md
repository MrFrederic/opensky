# Dropzone Management System - Frontend

React-based frontend for the Dropzone Management System.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (build/dev server)
- **Material UI (MUI)** (component library & theming)
- **TanStack Query** (server state management)
- **Zustand** (global state)
- **Axios** (HTTP client)
- **React Router v6** (routing)
- **React Hook Form** + **Zod** (form handling & validation)

## Project Structure

```
src/
├── api/                # (optional) API route helpers
├── components/         # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Auth-related components
│   ├── common/         # Shared/common UI
│   ├── layouts/        # Layout components (Header, Footer, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries/configs (axios, react-query, etc.)
├── pages/              # Page components (routed)
│   ├── administration/ # Admin pages (users, jump types, aircraft, etc.)
├── router/             # React Router config
├── services/           # API service functions (axios)
├── stores/             # Zustand stores (auth, etc.)
├── theme/              # MUI theme config
├── types/              # TypeScript types/enums
├── index.css           # Global styles
├── main.tsx            # App entry point
└── App.tsx             # App root
```

## Features

- **Authentication**: Telegram SSO, JWT, persistent auth state
- **User Management**: Profile, admin user CRUD, roles
- **Jump Types**: List, create, edit, assign allowed roles/staff
- **Loads & Manifesting**: Load management, jump assignment, drag & drop, real-time updates
- **Digital Logbook**: (Planned) Jump history, stats
- **Load Dashboard**: (Planned) Public display of loads, jumps and remaining slots
- **Equipment**: (Planned) Equipment tracking
- **Dictionaries**: System values management (admin)
- **Responsive UI**: Material UI theme, mobile-friendly
- **API Integration**: Axios + TanStack Query, error handling, auto-refresh

## Development Setup

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

- App: http://localhost:3000

### Build for Production

```bash
npm run build
npm run preview
```

## Environment Variables

- `VITE_API_HOST` - Backend API URL (default: proxied to http://localhost:8000 in dev)

For local dev, create `.env`:

```
VITE_API_HOST=http://localhost:8000
```

## API Proxy (Dev)

Vite dev server proxies `/api` to backend (`http://localhost:8000` by default).

## Authentication Flow

- Telegram SSO → JWT tokens (stored in Zustand)
- Auth state persisted in localStorage
- API requests include token automatically

## State Management

- **Zustand**: Auth/user state
- **TanStack Query**: Server data (users, loads, jumps, etc.)

## Styling

- **Material UI**: Theming, components, responsive design
- **Custom theme**: Dropzone colors, typography

## Routing

- **React Router v6**: Nested routes, protected admin routes

## Testing

- (Add tests as needed)

## Docker

- Production build can be served with nginx or any static server
- For dev, use Vite dev server

## Security

- JWT token management
- Role-based route protection
- Input validation (Zod)
- CSP headers in dev

---

## Next Steps

- Add personal logbook
- Add Receptions interface
- Add Public Load Dashboard
- Improve accessibility and mobile UX

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

The application uses Material UI with:

- Custom color palette (primary blue theme)
- Responsive design utilities
- Component classes for common patterns

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
