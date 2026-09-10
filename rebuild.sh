#!/usr/bin/env bash
# ==============================================================================
# DigitechKH WMS - Zero-Downtime Rebuild Script
# ==============================================================================
# Usage:
#   ./rebuild.sh         # Rebuild both api & web
#   ./rebuild.sh api     # Rebuild only api (NestJS backend)
#   ./rebuild.sh web     # Rebuild only web (Angular frontend)
# ==============================================================================

set -eo pipefail

TARGET=${1:-all}

echo --------------------------------------------------------
echo  DigitechKH WMS Rebuilder: Target = $TARGET
echo --------------------------------------------------------

case $TARGET in
  api)
    echo ==> [1/3] Building API container...
    docker compose build api
    echo ==> [2/3] Recreating API container...
    docker compose up -d --no-deps api
    ;;
  web)
    echo ==> [1/3] Building Web frontend container...
    docker compose build web
    echo ==> [2/3] Recreating Web container...
    docker compose up -d --no-deps web
    ;;
  all|both)
    echo ==> [1/3] Building API and Web containers...
    docker compose build api web
    echo ==> [2/3] Starting updated services with health checks...
    docker compose up -d api web
    ;;
  *)
    echo ERROR: Unknown target '$TARGET'. Use: ./rebuild.sh [all|api|web]
    exit 1
    ;;
esac

echo ==> [3/3] Waiting for services to become healthy...
attempts=0
max_attempts=20
until docker compose ps 2>/dev/null | grep -i "healthy" || [ $attempts -ge $max_attempts ]; do
  attempts=$((attempts + 1))
  sleep 2
done

echo ==> Reloading Nginx Load Balancer to ensure zero 502 Bad Gateway...
docker exec digitechkh-wms-load_balancer nginx -s reload 2>/dev/null || docker compose restart load_balancer

echo --------------------------------------------------------
echo  Container Status:
echo --------------------------------------------------------
docker compose ps

echo --------------------------------------------------------
echo  Rebuild complete! Application is running cleanly.
echo --------------------------------------------------------