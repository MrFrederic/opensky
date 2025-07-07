# Docker Compose Configuration Guide

This document explains how to configure the Dropzone Management System using Docker Compose.

## Quick Setup

1. Copy the example file:
   ```bash
   cp docker-compose.example.yml docker-compose.yml
   ```

2. Edit `docker-compose.yml` with your configuration values (see sections below)

3. Start the system:
   ```bash
   docker-compose up --build
   ```

## Configuration Options

### Database Configuration

The PostgreSQL database can be configured through these environment variables:

```yaml
postgres:
  environment:
    POSTGRES_USER: user          # Database username
    POSTGRES_PASSWORD: pass      # Database password
    POSTGRES_DB: dropzone_db     # Database name
```

**Security Note**: Change the default credentials for production deployments.

### Backend Configuration

The backend service requires several environment variables:

```yaml
backend:
  environment:
    # Database connection (must match postgres service)
    DATABASE_URL: postgresql://user:pass@postgres:5432/dropzone_db
    
    # Security settings
    SECRET_KEY: your-secret-key-change-in-production  # Must be changed for production!
    ALGORITHM: HS256                                  # JWT algorithm
    
    # Token expiration
    ACCESS_TOKEN_EXPIRE_MINUTES: 30                   # Short-lived access tokens
    REFRESH_TOKEN_EXPIRE_DAYS: 7                      # Longer-lived refresh tokens
    
    # Environment
    ENVIRONMENT: development                          # development/production
    
    # Telegram Bot Integration
    TELEGRAM_BOT_TOKEN: YOUR_TELEGRAM_BOT_TOKEN_HERE  # Replace with your bot token
```

#### Required Changes for Production

1. **SECRET_KEY**: Generate a secure random string (32+ characters)
   ```bash
   # Generate a secure secret key
   openssl rand -hex 32
   ```

2. **TELEGRAM_BOT_TOKEN**: Get from [@BotFather](https://t.me/botfather) on Telegram
   - Create a new bot: `/newbot`
   - Follow the prompts to get your token
   - Replace `YOUR_TELEGRAM_BOT_TOKEN_HERE` with the actual token

3. **Database Credentials**: Use strong passwords for production

### Frontend Configuration

The frontend is configured to proxy API requests to the backend:

```yaml
frontend:
  build:
    args:
      - API_HOST=http://backend:8000    # Internal docker network address
  environment:
    - VITE_API_HOST=http://backend:8000 # Build-time API host
```

### PgAdmin Configuration

Database administration interface:

```yaml
pgadmin:
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@admin.com    # Login email
    PGADMIN_DEFAULT_PASSWORD: admin           # Login password
    PGADMIN_CONFIG_SERVER_MODE: 'False'       # Single-user mode
```

## Port Configuration

The system uses these ports by default:

- **Frontend**: Port 80 (http://localhost)
- **PgAdmin**: Port 5050 (http://localhost:5050)
- **PostgreSQL**: Port 5432 (for external database connections)
- **Backend**: Internal only (accessible through frontend proxy)

To change ports, modify the `ports` sections in docker-compose.yml:

```yaml
frontend:
  ports:
    - "8080:80"  # Change to access frontend on port 8080

pgadmin:
  ports:
    - "8050:80"  # Change to access PgAdmin on port 8050
```

## Production Deployment

For production deployments:

1. **Change all default passwords and secrets**
2. **Set ENVIRONMENT to production**
3. **Use environment-specific configuration files**
4. **Consider using Docker secrets for sensitive data**
5. **Set up proper SSL/TLS termination**
6. **Configure backup strategies for volumes**

### Environment Variables File

Instead of putting secrets in docker-compose.yml, use a .env file:

```bash
# .env file
POSTGRES_PASSWORD=your-secure-password
SECRET_KEY=your-32-char-secret-key
TELEGRAM_BOT_TOKEN=your-bot-token
```

Then reference in docker-compose.yml:
```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  SECRET_KEY: ${SECRET_KEY}
  TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
```

## Volumes and Data Persistence

The system uses named volumes for data persistence:

- `postgres_data`: PostgreSQL database files
- `pgadmin_data`: PgAdmin configuration and settings

These volumes persist data between container restarts. To reset the system:

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: This deletes all data!)
docker volume rm dropzone-management-system_postgres_data
docker volume rm dropzone-management-system_pgadmin_data

# Restart
docker-compose up --build
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port mappings in docker-compose.yml
2. **Database connection failed**: Check DATABASE_URL format and credentials
3. **Frontend can't reach backend**: Verify VITE_API_HOST configuration
4. **Permission denied**: Ensure Docker has proper permissions

### Logs

View service logs:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Health Checks

Check service status:
```bash
docker-compose ps
```

The PostgreSQL service includes a health check that other services depend on.
