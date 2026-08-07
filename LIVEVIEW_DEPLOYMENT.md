# Production Deployment Guide for Phoenix LiveView

## Architecture in Production

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer (Nginx)                   │
│                  SSL Termination (Let's Encrypt)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
┌──────────────────┐                  ┌──────────────────┐
│  Phoenix Server  │                  │  Phoenix Server  │
│   (LiveView +    │←─── PubSub ────→│   (LiveView +    │
│    Channels)     │                  │    Channels)     │
│   Port 4000      │                  │   Port 4001      │
└──────────────────┘                  └──────────────────┘
        ↓                                      ↓
        └──────────────────┬──────────────────┘
                           ↓
                  ┌─────────────────┐
                  │  Node.js API    │
                  │  Port 3001      │
                  └─────────────────┘
                           ↓
                  ┌─────────────────┐
                  │   PostgreSQL    │
                  └─────────────────┘
```

---

## 1. Deployment Options

### Option A: Single Server (Small Scale)

**Suitable for:** MVP, small user base (<1000 concurrent users)

```
Server Specs:
- 2 vCPUs
- 4GB RAM
- 50GB SSD
- Ubuntu 22.04 LTS
```

**Services:**
- Phoenix (LiveView + Channels)
- Node.js API
- PostgreSQL
- Nginx (reverse proxy)

### Option B: Multi-Server (Production Scale)

**Suitable for:** Production, >1000 concurrent users

```
Phoenix Servers (2+):
- 2 vCPUs, 4GB RAM each
- Auto-scaling group

Node.js Servers (2+):
- 2 vCPUs, 4GB RAM each
- Auto-scaling group

Database:
- Managed PostgreSQL (RDS/DigitalOcean)
- 4 vCPUs, 8GB RAM

Redis:
- For distributed PubSub
- 2GB RAM

Load Balancer:
- Nginx or cloud provider LB
```

---

## 2. Docker Setup

### `Dockerfile` for Phoenix

```dockerfile
# Build stage
FROM elixir:1.15-alpine AS build

# Install build dependencies
RUN apk add --no-cache build-base npm git

# Set working directory
WORKDIR /app

# Install hex and rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Set build environment
ENV MIX_ENV=prod

# Copy mix files
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mix deps.compile

# Copy assets
COPY assets assets
COPY priv priv

# Compile assets
RUN cd assets && npm install && npm run deploy
RUN mix phx.digest

# Copy application code
COPY lib lib
COPY config config

# Compile application
RUN mix compile

# Build release
RUN mix release

# Runtime stage
FROM alpine:3.18 AS app

# Install runtime dependencies
RUN apk add --no-cache openssl ncurses-libs libstdc++

# Create app user
RUN addgroup -g 1000 phoenix && \
    adduser -D -u 1000 -G phoenix phoenix

WORKDIR /app

# Copy release from build stage
COPY --from=build --chown=phoenix:phoenix /app/_build/prod/rel/realtime_gateway ./

USER phoenix

# Expose port
EXPOSE 4000

# Set environment
ENV HOME=/app

# Start command
CMD ["bin/realtime_gateway", "start"]
```

### `docker-compose.yml` (Development)

```yaml
version: '3.8'

services:
  phoenix:
    build:
      context: ./realtime_gateway
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - PHX_HOST=localhost
      - PORT=4000
      - SECRET_KEY_BASE=${SECRET_KEY_BASE}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_API_URL=http://nodejs:3001
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/suq_dev
    depends_on:
      - db
      - nodejs
    networks:
      - suq_network

  nodejs:
    build:
      context: ./backend-core
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/suq_dev
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - db
    networks:
      - suq_network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=suq_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - suq_network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - phoenix
      - nodejs
    networks:
      - suq_network

networks:
  suq_network:
    driver: bridge

volumes:
  postgres_data:
```

---

## 3. Nginx Configuration

### `/etc/nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=5r/s;

    # Upstream servers
    upstream phoenix_backend {
        least_conn;
        server phoenix1:4000 max_fails=3 fail_timeout=30s;
        server phoenix2:4001 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream nodejs_backend {
        least_conn;
        server nodejs1:3001 max_fails=3 fail_timeout=30s;
        server nodejs2:3002 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Phoenix LiveView (Web App)
        location / {
            proxy_pass http://phoenix_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;

            # Rate limiting
            limit_req zone=ws_limit burst=20 nodelay;
        }

        # Phoenix WebSocket (for LiveView)
        location /live/websocket {
            proxy_pass http://phoenix_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }

        # Phoenix Channels (for Mobile App)
        location /socket/websocket {
            proxy_pass http://phoenix_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }

        # Node.js API
        location /api/ {
            proxy_pass http://nodejs_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;

            # Rate limiting
            limit_req zone=api_limit burst=50 nodelay;
        }

        # Static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://phoenix_backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## 4. Phoenix Production Configuration

### `config/prod.exs`

```elixir
import Config

config :realtime_gateway, RealtimeGatewayWeb.Endpoint,
  cache_static_manifest: "priv/static/cache_manifest.json",
  server: true

config :logger, level: :info

config :phoenix, :serve_endpoints, true
```

### `config/runtime.exs`

```elixir
import Config

if config_env() == :prod do
  # Validate required environment variables
  required_env_vars = [
    "SECRET_KEY_BASE",
    "JWT_SECRET",
    "NODE_API_URL",
    "PHX_HOST"
  ]

  Enum.each(required_env_vars, fn var ->
    unless System.get_env(var) do
      raise """
      Environment variable #{var} is missing.
      Please set all required environment variables.
      """
    end
  end)

  # Database configuration (if Phoenix needs direct DB access)
  database_url = System.get_env("DATABASE_URL")

  if database_url do
    config :realtime_gateway, RealtimeGateway.Repo,
      url: database_url,
      pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
      ssl: true
  end

  # Endpoint configuration
  config :realtime_gateway, RealtimeGatewayWeb.Endpoint,
    url: [
      host: System.get_env("PHX_HOST"),
      port: 443,
      scheme: "https"
    ],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: String.to_integer(System.get_env("PORT") || "4000"),
      transport_options: [socket_opts: [:inet6]]
    ],
    secret_key_base: System.get_env("SECRET_KEY_BASE"),
    check_origin: [
      "https://#{System.get_env("PHX_HOST")}",
      "https://www.#{System.get_env("PHX_HOST")}"
    ]

  # JWT configuration
  config :joken, default_signer: System.get_env("JWT_SECRET")

  # Node.js API URL
  config :realtime_gateway,
    node_api_url: System.get_env("NODE_API_URL")

  # Redis for distributed PubSub (if using multiple Phoenix instances)
  redis_url = System.get_env("REDIS_URL")

  if redis_url do
    config :realtime_gateway, RealtimeGateway.PubSub,
      adapter: Phoenix.PubSub.Redis,
      url: redis_url
  end
end
```

### `rel/env.sh.eex` (Release configuration)

```bash
#!/bin/sh

# Configure BEAM
export RELEASE_DISTRIBUTION=name
export RELEASE_NODE=<%= @release.name %>@${HOSTNAME}
export RELEASE_COOKIE=${RELEASE_COOKIE:-secret-cookie-change-me}

# Configure networking
export ERL_AFLAGS="-kernel inet_dist_listen_min 9100 inet_dist_listen_max 9155"

# Performance tuning
export ELIXIR_ERL_OPTIONS="+K true +A 32 +SDio 32"
```

---

## 5. Systemd Service (Alternative to Docker)

### `/etc/systemd/system/phoenix.service`

```ini
[Unit]
Description=Phoenix LiveView Server
After=network.target postgresql.service

[Service]
Type=simple
User=phoenix
Group=phoenix
WorkingDirectory=/opt/realtime_gateway
Environment="PORT=4000"
Environment="MIX_ENV=prod"
Environment="PHX_HOST=yourdomain.com"
EnvironmentFile=/opt/realtime_gateway/.env
ExecStart=/opt/realtime_gateway/bin/realtime_gateway start
ExecStop=/opt/realtime_gateway/bin/realtime_gateway stop
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=phoenix

[Install]
WantedBy=multi-user.target
```

### Enable and start service

```bash
sudo systemctl daemon-reload
sudo systemctl enable phoenix
sudo systemctl start phoenix
sudo systemctl status phoenix
```

---

## 6. SSL/TLS with Let's Encrypt

### Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### Obtain certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Auto-renewal

```bash
sudo certbot renew --dry-run

# Add to crontab
0 0 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 7. Monitoring and Logging

### Application Monitoring

```elixir
# Add to mix.exs
{:telemetry_metrics, "~> 0.6"},
{:telemetry_poller, "~> 1.0"},
{:phoenix_live_dashboard, "~> 0.8"}
```

### Prometheus Metrics

```elixir
# lib/realtime_gateway_web/telemetry.ex
defmodule RealtimeGatewayWeb.Telemetry do
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def init(_arg) do
    children = [
      {:telemetry_poller, measurements: periodic_measurements(), period: 10_000}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  def metrics do
    [
      # Phoenix Metrics
      summary("phoenix.endpoint.stop.duration",
        unit: {:native, :millisecond}
      ),
      summary("phoenix.router_dispatch.stop.duration",
        tags: [:route],
        unit: {:native, :millisecond}
      ),

      # LiveView Metrics
      summary("phoenix.live_view.mount.stop.duration",
        unit: {:native, :millisecond}
      ),

      # Channel Metrics
      counter("phoenix.channel_joined.count"),
      summary("phoenix.channel_handled_in.stop.duration",
        unit: {:native, :millisecond}
      ),

      # VM Metrics
      summary("vm.memory.total", unit: {:byte, :megabyte}),
      summary("vm.total_run_queue_lengths.total"),
      summary("vm.total_run_queue_lengths.cpu"),
      summary("vm.total_run_queue_lengths.io")
    ]
  end

  defp periodic_measurements do
    []
  end
end
```

### Log Aggregation

```bash
# Install Filebeat for log shipping to ELK stack
sudo apt install filebeat

# Configure filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/phoenix/*.log
  json.keys_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

---

## 8. Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] JWT_SECRET matches Node.js
- [ ] Database migrations run
- [ ] SSL certificates obtained
- [ ] Nginx configuration tested
- [ ] Firewall rules configured
- [ ] Backup strategy in place

### Deployment
- [ ] Build Docker images
- [ ] Push to container registry
- [ ] Deploy to servers
- [ ] Run health checks
- [ ] Monitor logs for errors
- [ ] Test WebSocket connections
- [ ] Test LiveView functionality
- [ ] Test API endpoints

### Post-Deployment
- [ ] Monitor application metrics
- [ ] Check error rates
- [ ] Verify real-time features
- [ ] Test mobile app connectivity
- [ ] Monitor database performance
- [ ] Set up alerts

---

## 9. Scaling Strategies

### Horizontal Scaling

```bash
# Add more Phoenix instances
docker-compose up --scale phoenix=3

# Update Nginx upstream
upstream phoenix_backend {
    server phoenix1:4000;
    server phoenix2:4001;
    server phoenix3:4002;
}
```

### Redis for Distributed PubSub

```elixir
# config/runtime.exs
config :realtime_gateway, RealtimeGateway.PubSub,
  adapter: Phoenix.PubSub.Redis,
  url: System.get_env("REDIS_URL"),
  node_name: System.get_env("NODE_NAME")
```

### Database Connection Pooling

```elixir
config :realtime_gateway, RealtimeGateway.Repo,
  pool_size: 20,
  queue_target: 50,
  queue_interval: 1000
```

This deployment guide provides production-ready configuration for scaling your Phoenix LiveView application.
