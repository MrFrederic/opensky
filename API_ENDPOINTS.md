# Dropzone Management System - API Endpoints

This document describes all available API endpoints in the Dropzone Management System backend.

## Base Information

- **Base URL**: `/api/v1`
- **Authentication**: JWT Bearer Token (for protected endpoints)
- **Content-Type**: `application/json`

## Root Endpoints

### Health & Status
- `GET /` - Root endpoint with welcome message
- `GET /health` - Health check endpoint with database status

## Authentication Endpoints (`/api/v1/auth`)

### User Authentication
- `POST /auth/telegram-auth` - Authenticate with Telegram and get JWT token
- `POST /auth/refresh` - Refresh access token (not implemented yet)

## User Management (`/api/v1/users`)

### Current User Operations
- `GET /users/me` - Get current user information
- `PUT /users/me` - Update current user information
- `POST /users/me/request-sportsman-status` - Request upgrade to sportsman status

### Admin User Operations
- `GET /users/` - List all users (admin only)
- `GET /users/search` - Search users by name or username (admin only)
- `GET /users/{user_id}` - Get user by ID (admin only)
- `PUT /users/{user_id}` - Update user (admin only)
- `DELETE /users/{user_id}` - Delete user (admin only)

## Tandem Operations (`/api/v1/tandems`)

### Tandem Slots
- `GET /tandems/slots/availability` - Get tandem slot availability for date range
- `POST /tandems/slots` - Create tandem slot (admin only)
- `PUT /tandems/slots/{slot_date}` - Update tandem slot (admin only)

### Tandem Bookings
- `GET /tandems/bookings/me` - Get current user's tandem bookings
- `POST /tandems/bookings` - Create tandem booking
- `PUT /tandems/bookings/{booking_id}` - Update tandem booking
- `DELETE /tandems/bookings/{booking_id}` - Cancel tandem booking
- `GET /tandems/bookings` - List all tandem bookings (admin only)

## Manifest Management (`/api/v1/manifests`)

### User Manifest Operations
- `GET /manifests/me` - Get current user's manifests
- `POST /manifests/` - Create a new manifest (sportsman+ only)
- `GET /manifests/{manifest_id}` - Get manifest by ID
- `PUT /manifests/{manifest_id}` - Update manifest
- `DELETE /manifests/{manifest_id}` - Delete manifest

### Admin Manifest Operations
- `GET /manifests/` - List manifests with optional status filter (admin only)
- `GET /manifests/pending` - Get pending manifests for review (admin only)
- `POST /manifests/{manifest_id}/approve` - Approve manifest and create jump (admin only)
- `POST /manifests/{manifest_id}/decline` - Decline manifest (admin only)

## Load & Jump Management (`/api/v1`)

### Load Operations
- `GET /loads` - List loads with optional date filtering (sportsman+ only)
- `POST /loads` - Create load (admin only)
- `GET /loads/{load_id}` - Get load by ID (sportsman+ only)
- `PUT /loads/{load_id}` - Update load (admin only)
- `DELETE /loads/{load_id}` - Delete load (admin only)
- `GET /loads/{load_id}/jumps` - Get all jumps in a load (sportsman+ only)

### Jump Operations (User Logbook)
- `GET /jumps/me` - Get current user's jumps (logbook)
- `GET /jumps/me/stats` - Get current user's jump statistics
- `GET /jumps/{jump_id}` - Get jump by ID
- `POST /jumps` - Create jump (admin only)
- `PUT /jumps/{jump_id}` - Update jump (admin only)
- `DELETE /jumps/{jump_id}` - Delete jump (admin only)
- `GET /jumps` - List all jumps (admin only)

## Equipment Management (`/api/v1/equipment`)

### Equipment Operations (Admin Only)
- `GET /equipment/` - List equipment with optional type/status filters
- `POST /equipment/` - Create equipment
- `GET /equipment/{equipment_id}` - Get equipment by ID
- `PUT /equipment/{equipment_id}` - Update equipment
- `DELETE /equipment/{equipment_id}` - Delete equipment

### Public Equipment Operations
- `GET /equipment/available` - Get available equipment for manifesting

## Dictionary Management (`/api/v1/dictionaries`)

### Dictionary Operations
- `GET /dictionaries/` - List dictionaries
- `POST /dictionaries/` - Create dictionary (admin only)
- `GET /dictionaries/{dict_id}` - Get dictionary by ID
- `PUT /dictionaries/{dict_id}` - Update dictionary (admin only)

### Dictionary Value Operations
- `GET /dictionaries/{dict_id}/values` - List values for a dictionary
- `GET /dictionaries/by-name/{dict_name}/values` - List values by dictionary name
- `POST /dictionaries/{dict_id}/values` - Create dictionary value (admin only)
- `GET /dictionaries/values/{value_id}` - Get dictionary value by ID
- `PUT /dictionaries/values/{value_id}` - Update dictionary value (admin only)
- `DELETE /dictionaries/values/{value_id}` - Delete dictionary value (admin only, non-system only)

## Permission Levels

### Public Endpoints
- Health check
- Authentication
- Dictionary values (read-only)
- Available equipment (read-only)

### Authenticated User
- User profile management
- Personal tandem bookings
- Personal manifests (view only)
- Personal jump logbook

### Sportsman Status
- Create manifests
- View loads and load jumps

### Admin Only
- User management
- Equipment management
- Load management
- Jump management
- Manifest approval/decline
- Dictionary management
- All administrative operations

## Query Parameters

### Common Parameters
- `skip` - Number of records to skip (pagination)
- `limit` - Maximum number of records to return
- `start_date` - Filter by start date
- `end_date` - Filter by end date

### Status Filters
- `status` - Filter by status (varies by endpoint)
- `active_only` - Filter only active records (boolean)

## Response Formats

All endpoints return JSON responses with appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Interactive Documentation

The API provides interactive documentation at:
- **Swagger UI**: `/docs`

These interfaces allow you to explore and test all endpoints directly from your browser.
