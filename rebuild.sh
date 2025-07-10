#!/bin/bash

# Script to stop, rebuild and restart backend and frontend services

echo "===== Stopping existing containers ====="
docker compose stop backend frontend

echo "===== Cleaning old Docker images ====="
# Remove dangling images (untagged images)
docker image prune -f
echo "Removed dangling images"

echo "===== Rebuilding backend service ====="
docker compose build backend
echo "Backend rebuild completed!"
docker compose up -d backend

echo "===== Rebuilding frontend service ====="
docker compose build frontend
echo "Frontend rebuild completed!"
docker compose up -d frontend

echo "===== Services rebuilt and restarted ====="
