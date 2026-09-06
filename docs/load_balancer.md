# Nginx Reverse Proxy & Load Balancer Setup

This document describes the load balancing architecture implemented for the full-stack system (NestJS API + Angular 18 SPA + PostgreSQL + Redis).

---

## 🏛️ Architecture Overview

```
                      +-----------------------------+
                      |       Client Browser        |
                      +-----------------------------+
                                     |
                                     v
                 +---------------------------------------+
                 |     Nginx Load Balancer (Port 80)     |
                 |     - Rate limiting (30 req/s)       |
                 |     - Health checks (/healthz)       |
                 |     - Dynamic least-connection LB    |
                 +---------------------------------------+
                        /                       \
                       /                         \
      (Path: /api/*, /socket.io/*)              (Path: /*)
                     v                             v
     +-------------------------------+   +--------------------+
     |   NestJS API Backend Pool     |   | Angular Frontend   |
     |   - Instance 1 (api:3000)     |   | (web:80 - Nginx)   |
     |   - Instance 2 (api:3000)     |   +--------------------+
     |   - Instance N (api:3000)     |
     +-------------------------------+
            |               |
            v               v
     +------------+   +-----------+
     | PostgreSQL |   |   Redis   |
     +------------+   +-----------+
```

---

## 🚀 Quick Start

### 1. Launch the Stack
```bash
docker compose up -d --build
```

### 2. Verify Services & Load Balancer Health
```bash
# Check load balancer health
curl http://localhost/healthz

# Expected response:
# {"status":"healthy","service":"load-balancer","timestamp":"..."}
```

---

## 📈 Scaling Backend Instances Dynamically

You can scale the API backend to any number of instances with zero configuration changes. Nginx will automatically distribute requests across all active replicas using the `least_conn` algorithm.

```bash
# Scale API to 3 instances
docker compose up -d --scale api=3

# Scale API to 5 instances
docker compose up -d --scale api=5
```

---

## ⚙️ Load Balancing Features Configured

1. **Least-Connection Algorithm (`least_conn`)**:
   - Routes incoming requests to the backend container with the lowest active connections.
2. **WebSocket & Socket.IO Support**:
   - Upgrades HTTP connections for real-time channels with 24-hour timeouts.
3. **Health Checks & Failover**:
   - `max_fails=3` and `fail_timeout=10s` automatically isolate faulty backend instances.
4. **Traffic Rate Limiting**:
   - Protection against DDoS and API flooding (`30r/s` with a burst buffer of 50).
5. **Real Client IP Forwarding**:
   - `X-Forwarded-For`, `X-Real-IP`, and `X-Forwarded-Proto` headers pass through to NestJS.
6. **SSL / HTTPS Ready**:
   - Pre-configured template in [nginx/conf.d/ssl.conf.template](file:///d:/WFM/nginx/conf.d/ssl.conf.template).

---

## 🛠️ Configuration Files

- **Docker Compose**: [docker-compose.yml](file:///d:/WFM/docker-compose.yml)
- **Nginx Main Config**: [nginx/nginx.conf](file:///d:/WFM/nginx/nginx.conf)
- **Nginx Upstream & Route Rules**: [nginx/conf.d/default.conf](file:///d:/WFM/nginx/conf.d/default.conf)
- **API Multi-Stage Dockerfile**: [api/Dockerfile](file:///d:/WFM/api/Dockerfile)
