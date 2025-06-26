# Software Architecture Document (SAD)
## Dropzone Management System

### 1. Introduction

#### 1.1 Purpose
This document outlines the software architecture for the Dropzone Management System. It provides a comprehensive architectural overview, detailing the system's components, their interactions, data management strategies, and deployment model. This SAD is derived from the functional and non-functional requirements specified in the `SRS.md` document.

#### 1.2 Scope
The architecture described herein covers the backend service, the web frontend, the Telegram bot integration, the database schema, and the container-based deployment strategy. The goal is to create a robust, scalable, and maintainable system that meets all specified user requirements.

### 2. Architectural Goals and Constraints

The architecture is designed with the following key principles and constraints in mind:

- **Modularity:** The system is composed of distinct components (backend, frontend, database, telegram-bot) to promote separation of concerns, scalability, and ease of maintenance.
- **Simplicity (KISS):** The design avoids unnecessary complexity, favoring straightforward solutions and technologies to ensure the system is easy to develop, understand, and operate.
- **Scalability:** While the initial scope is for a single aircraft operation, the modular, containerized design allows for future scaling if necessary.
- **Technology Stack:** The system will be built on a modern, open-source technology stack.
    - **Database:** PostgreSQL, as requested.
    - **Deployment:** The entire system will be containerized using Docker and orchestrated with Docker Compose for simplified deployment and environment consistency.
- **API-First Approach:** The backend will expose a comprehensive RESTful API, which will serve as the backbone for all client applications (Web Frontend, Telegram Bot).

### 3. System Architecture Overview

The system is designed as a classic three-tier architecture, containerized for portability and scalability.

- **Presentation Tier:** Consists of a responsive Web Frontend and a Telegram Bot, providing user interfaces for different platforms and use cases.
- **Application Tier (Backend):** A central backend service that implements all business logic, manages data, and exposes a REST API.
- **Data Tier:** A PostgreSQL database for persistent data storage.

### 4. Component Breakdown

#### 4.1 Backend Service

The backend is the core of the system, handling all business logic and data processing.

- **Technology Stack:**
    - **Language:** Python 3.11+
    - **Framework:** **FastAPI**. This framework is chosen for its high performance, asynchronous capabilities, and automatic generation of interactive API documentation (Swagger UI and ReDoc), which directly addresses the `auto-documentable API` requirement.
    - **ORM:** **SQLAlchemy** with **Alembic** for database migrations. This provides a robust way to interact with the database and manage schema changes over time.

- **Modular Structure:** The backend code will be organized into modules based on functionality, mirroring the SRS sections:
    - `users`: User management, authentication, roles.
    - `equipment`: Equipment inventory and tracking.
    - `loads`: Load, jump, and manifest management.
    - `tandems`: Tandem booking and slot management.
    - `reports`: Data aggregation and reporting.
    - `core`: Common services, settings, database connection.

- **API Design:** The backend will expose a RESTful API.
    - **Auto-documentation:** FastAPI will automatically generate an OpenAPI specification, available at `/docs` (Swagger UI) and `/redoc`.
    - **Endpoint Strategy:**
        - **CRUD-based:** Standard resource-oriented endpoints for simple data management (e.g., `GET /equipment`, `POST /equipment`).
        - **Action-based:** RPC-style endpoints for specific business actions to keep the client-side logic simple (e.g., `POST /manifests/{id}/approve`, `POST /users/me/request-sportsman-status`).

#### 4.2 Web Frontend

The primary user interface for administrators and users.

- **Technology Stack:**
    - **Framework:** **React** (with Vite). This provides a modern, efficient, and component-based approach to building a responsive and interactive single-page application (SPA).
    - **Styling:** A modern CSS framework like **Tailwind CSS** or a component library like **MUI** will be used for a clean and responsive design.
    - **State Management:** React Query (TanStack Query) for managing server state (API data) and Zustand or Redux Toolkit for global UI state.

#### 4.3 Telegram Bot

The bot serves as a secondary client, primarily for authentication (SSO), notifications, and simple actions.

Out of scope for MVP, but should be taken into account in the architecture.

### 5. Data Management

#### 5.1 Database
A **PostgreSQL** database will be used for its reliability, feature set, and robustness.

#### 5.2 Database Schema
The schema is designed to be normalized to reduce data redundancy and ensure integrity. All tables will have a primary key `id` and timestamp columns `created_at` and `updated_at` and author information `created_by` and `updated_by`.

**Users & Roles**
- `users`
    - `id` (PK)
    - `telegram_id` (UNIQUE)
    - `first_name`, `last_name`
    - `username` (UNIQUE, nullable)
    - `email` (UNIQUE, nullable)
    - `phone` (VARCHAR, nullable)
    - `status` (ENUM: `newby`, `individual_sportsman`, `sportsman`, `instructor`)
    - `is_admin` (BOOLEAN)
    - `license_document_url` (TEXT, nullable)

**Equipment**
- `equipment`
    - `id` (PK)
    - `type_id` (FK to `dictionary_values`, e.g. `parachute`, `harness`, `helmet`)
    - `name_id` (FK to `dictionary_values`, e.g. `Д1-5-У`, `ПКУ`)
    - `serial_number` (VARCHAR)
    - `status` (FK to `dictionary_values`, e.g. `maintenance`, `available`, `out_of_service`)

**Loads & Jumps**
- `loads`
    - `id` (PK)
    - `load_date` (DATETIME)
    - `status` (FK to `dictionary_values`)
- `jumps`
    - `id` (PK)
    - `user_id` (FK to `users`)
    - `passenger_id` (FK to `users`, nullable, for tandem jumps)
    - `load_id` (FK to `loads`)
    - `jump_type_id` (FK to `dictionary_values`, e.g. `tandem`, `sport`, `aff_instructor`, `aff`)
    - `payment_status` (FK to `dictionary_values`)
    - `manifest_id` (FK to `manifests`, nullable)
    - `comment` (TEXT, nullable, for notes on the jump)
- `jump_equipment` (Many-to-Many)
    - `jump_id` (FK to `jumps`)
    - `equipment_id` (FK to `equipment`)

**Manifests**
- `manifests`
    - `id` (PK)
    - `user_id` (FK to `users`)
    - `jump_type_id` (FK to `dictionary_values`, e.g. `tandem`, `sport`, `aff_instructor`, `aff`)
    - `status` (ENUM: `pending`, `approved`, `declined`)
    - `decline_reason` (TEXT, nullable)
    - `tandem_booking_id` (FK to `tandem_bookings`, nullable)
- `manifest_equipment` (Many-to-Many)
    - `manifest_id` (FK to `manifests`)
    - `equipment_id` (FK to `equipment`)

**Tandems**
- `tandem_slots`
    - `slot_date` (DATE, PK)
    - `total_slots` (INTEGER)
- `tandem_bookings`
    - `id` (PK)
    - `user_id` (FK to `users`)
    - `booking_date` (DATE)
    - `status` (ENUM: `confirmed`, `cancelled`)

**System Administration**
- `dictionaries` (For UR-019)
    - `id` (PK)
    - `name` (VARCHAR, e.g., `jump_type`, `equipment_type`)
    - `is_active` (BOOLEAN)

- `dictionary_values` (For UR-019)
    - `id` (PK)
    - `dictionary_id` (FK to `dictionaries`)
    - `value` (VARCHAR)
    - `is_system` (BOOLEAN, to disable delete for values used in logic)
    - `is_active` (BOOLEAN)

### 6. Deployment Architecture (Docker Stack)

The system will be deployed using Docker and orchestrated with a `docker-compose.yml` file.

- **Services:**
    - `postgres`: The PostgreSQL database container, using the official `postgres` image. Data will be persisted in a Docker volume.
    - `backend`: The FastAPI application container. The `Dockerfile` will install Python dependencies and run the application using an ASGI server like `Uvicorn`.
    - `frontend`: A container running `Nginx` to serve the static files generated from the React build process.

    Note that reverse proxy will be handled by host machine.

- **Example `docker-compose.yml` structure:**
  ```yaml
  version: '3.8'
  services:
    postgres:
      image: postgres:15
      volumes:
        - postgres_data:/var/lib/postgresql/data/
      environment:
        - POSTGRES_USER=user
        - POSTGRES_PASSWORD=pass
        - POSTGRES_DB=dropzone_db
    backend:
      build: ./backend
      command: uvicorn app.main:app --host 0.0.0.0 --port 8000
      volumes:
        - ./backend:/app
      ports:
        - "8000:8000"
      depends_on:
        - postgres
    frontend:
      build: ./frontend
      ports:
        - "3000:80" # Nginx in container serves on port 80
      depends_on:
        - backend
  volumes:
    postgres_data:
  ```

### 7. Security

- **Authentication:**
    - **Telegram SSO:** The primary authentication method. The backend will validate the data received from the Telegram widget and, upon success, issue a session token.
    - **Session Management:** **JSON Web Tokens (JWT)** will be used for session management. A short-lived access token will be used for API requests, and a long-lived refresh token will be securely stored (e.g., in an HttpOnly cookie) to obtain new access tokens without requiring the user to log in again.
- **Authorization:**
    - **Role-Based Access Control (RBAC):** FastAPI dependencies will be used to implement RBAC. Endpoints will be protected based on user status (`is_admin`, `status` enum). For example, a dependency will check if `user.is_admin` is true for administrative endpoints.
- **Data Privacy:**
    - All sensitive data will be handled according to best practices while keeping implementation simple. The architecture does not require storing highly sensitive personal data beyond what is necessary for operations.

### 8. Non-Functional Requirements

- **Health Checks (`NFR-001`):** The backend will provide a `GET /health` endpoint that checks its status and its connection to the database.
- **Deployability (`NFR-002`):** The Docker-based approach ensures high deployability and environment consistency from development to production.
- **Usability & Reliability (`NFR-003`, `NFR-004`):** The choice of modern, stable frameworks (FastAPI, React) and a robust database (PostgreSQL) contributes to a reliable and usable system.
