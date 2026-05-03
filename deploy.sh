#!/usr/bin/env bash
# =============================================================================
#  NOVIQ — Full VPS Deployment Script
#  Tested on: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS
#  Usage:     sudo bash deploy.sh
# =============================================================================

set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()   { echo -e "${GREEN}[OK]${NC}  $*"; }
info()  { echo -e "${BLUE}[..] ${NC} $*"; }
warn()  { echo -e "${YELLOW}[!!]${NC}  $*"; }
error() { echo -e "${RED}[ERR]${NC} $*"; exit 1; }
step()  { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${NC}\n"; }

# ─── Must run as root ────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Run this script as root:  sudo bash deploy.sh"

# ─── Banner ──────────────────────────────────────────────────────────────────
echo -e "${BOLD}${CYAN}"
echo "  ███╗   ██╗ ██████╗ ██╗   ██╗██╗ ██████╗ "
echo "  ████╗  ██║██╔═══██╗██║   ██║██║██╔═══██╗"
echo "  ██╔██╗ ██║██║   ██║██║   ██║██║██║   ██║"
echo "  ██║╚██╗██║██║   ██║╚██╗ ██╔╝██║██║▄▄ ██║"
echo "  ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║╚██████╔╝"
echo "  ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝ ╚══▀▀═╝ "
echo -e "${NC}"
echo -e "${BOLD}  Full VPS Deployment — CMMS Admin Panel${NC}"
echo "  ─────────────────────────────────────────"
echo ""

# =============================================================================
#  SECTION 1 — CONFIGURATION
# =============================================================================
step "Configuration"

# Detect server public IP as default
DEFAULT_IP=$(curl -sf --max-time 4 https://ipv4.icanhazcurl.com || hostname -I | awk '{print $1}')

# Prompt for all settings
read -rp "  App directory        [/var/www/noviq]: "      APP_DIR;  APP_DIR="${APP_DIR:-/var/www/noviq}"
read -rp "  Domain or IP         [$DEFAULT_IP]: "         DOMAIN;   DOMAIN="${DOMAIN:-$DEFAULT_IP}"
read -rp "  Nginx listen port    [80]: "                  NGINX_PORT; NGINX_PORT="${NGINX_PORT:-80}"
read -rp "  PostgreSQL DB name   [noviq_db]: "            DB_NAME;  DB_NAME="${DB_NAME:-noviq_db}"
read -rp "  PostgreSQL user      [noviq_admin]: "         DB_USER;  DB_USER="${DB_USER:-noviq_admin}"
read -srp " PostgreSQL password  [auto-generated]: "      DB_PASS;  echo ""
if [[ -z "$DB_PASS" ]]; then
  DB_PASS=$(openssl rand -base64 20 | tr -dc 'A-Za-z0-9' | head -c 24)
  warn "Generated DB password: ${DB_PASS}  (saved to $APP_DIR/.env)"
fi
read -srp " Session secret      [auto-generated]: "       SESSION_SECRET; echo ""
if [[ -z "$SESSION_SECRET" ]]; then
  SESSION_SECRET=$(openssl rand -base64 48)
fi
read -rp "  GitHub repo URL      [leave blank to copy local files]: " REPO_URL

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
APP_PORT=5000  # hardcoded in server/index.ts

echo ""
info "App directory : $APP_DIR"
info "Domain / IP   : $DOMAIN:$NGINX_PORT"
info "Database URL  : postgresql://${DB_USER}:*****@localhost:5432/${DB_NAME}"
info "App port      : $APP_PORT (internal)"
echo ""
read -rp "  Proceed? [y/N]: " CONFIRM
[[ "${CONFIRM,,}" == "y" ]] || error "Aborted."

# =============================================================================
#  SECTION 2 — SYSTEM PACKAGES
# =============================================================================
step "Installing system packages"

info "Updating package lists..."
apt-get update -qq

info "Installing base tools (curl, git, build-essential, nginx, ufw)..."
apt-get install -y -qq curl git build-essential nginx ufw postgresql postgresql-contrib

# ── Node.js 20 LTS ──────────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ $(node -e "process.exit(process.version.slice(1).split('.')[0] < 20 ? 1 : 0)") -ne 0 ]]; then
  info "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -quiet
  apt-get install -y -qq nodejs
else
  log "Node.js $(node --version) already installed"
fi

# ── PM2 ─────────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Installing PM2..."
  npm install -g pm2 --quiet
else
  log "PM2 $(pm2 --version) already installed"
fi

log "System packages ready — Node $(node --version), npm $(npm --version)"

# =============================================================================
#  SECTION 3 — POSTGRESQL SETUP
# =============================================================================
step "PostgreSQL database setup"

info "Starting and enabling PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

info "Creating database user and database (idempotent)..."
sudo -u postgres psql -v ON_ERROR_STOP=0 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE USER "${DB_USER}" WITH PASSWORD '${DB_PASS}';
    RAISE NOTICE 'User ${DB_USER} created.';
  ELSE
    ALTER USER "${DB_USER}" WITH PASSWORD '${DB_PASS}';
    RAISE NOTICE 'User ${DB_USER} password updated.';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE "${DB_NAME}" OWNER "${DB_USER}"'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')
\gexec

GRANT ALL PRIVILEGES ON DATABASE "${DB_NAME}" TO "${DB_USER}";
SQL

# Grant schema-level permissions (needed for PostgreSQL 15+)
sudo -u postgres psql -d "${DB_NAME}" -v ON_ERROR_STOP=0 <<SQL
GRANT ALL ON SCHEMA public TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${DB_USER}";
SQL

log "PostgreSQL: database '${DB_NAME}' and user '${DB_USER}' ready"

# =============================================================================
#  SECTION 4 — APPLICATION FILES
# =============================================================================
step "Setting up application files"

if [[ -n "$REPO_URL" ]]; then
  info "Cloning from $REPO_URL ..."
  if [[ -d "$APP_DIR/.git" ]]; then
    info "Repo already exists — pulling latest changes..."
    git -C "$APP_DIR" pull
  else
    rm -rf "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
  fi
else
  info "Copying local project files to $APP_DIR ..."
  mkdir -p "$APP_DIR"
  # Copy all project files, excluding node_modules, dist, .git, and logs
  rsync -a --exclude='node_modules/' --exclude='dist/' --exclude='.git/' \
            --exclude='*.log' --exclude='.local/' \
            "$(dirname "$(realpath "$0")")/" "$APP_DIR/"
fi

log "Application files ready at $APP_DIR"

# =============================================================================
#  SECTION 5 — PATCH DB DRIVER FOR LOCAL POSTGRESQL
# =============================================================================
step "Patching DB driver for standard PostgreSQL"

# @neondatabase/serverless uses WebSocket protocol which doesn't work with local
# PostgreSQL. We patch server/db.ts to use the standard 'pg' driver instead.
info "Replacing server/db.ts with standard pg driver..."

cat > "$APP_DIR/server/db.ts" <<'DBTS'
// VPS build — uses standard pg (TCP) instead of @neondatabase/serverless (WebSocket)
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to create a .env file?");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle({ client: pool, schema });
DBTS

log "server/db.ts patched — using standard pg over TCP"

# =============================================================================
#  SECTION 6 — ENVIRONMENT FILE
# =============================================================================
step "Creating .env file"

cat > "$APP_DIR/.env" <<ENV
# NOVIQ — Production Environment
# Generated by deploy.sh on $(date -u +"%Y-%m-%d %H:%M UTC")

NODE_ENV=production
PORT=${APP_PORT}

DATABASE_URL=${DATABASE_URL}
SESSION_SECRET=${SESSION_SECRET}
ENV

chmod 600 "$APP_DIR/.env"
log ".env written to $APP_DIR/.env"

# =============================================================================
#  SECTION 7 — INSTALL DEPENDENCIES & BUILD
# =============================================================================
step "Installing npm dependencies"

cd "$APP_DIR"

info "Installing production dependencies (this may take 1-3 minutes)..."
npm install --prefer-offline 2>&1 | tail -5

# Install standard pg adapter (needed after db.ts patch)
info "Installing pg and drizzle-orm/node-postgres adapter..."
npm install pg drizzle-orm 2>&1 | tail -3

log "Dependencies installed"

# ── Patch vite.config.ts for VPS (remove Replit-only plugins) ────────────────
step "Patching vite.config.ts for production build"

cat > "$APP_DIR/vite.config.ts" <<'VITECFG'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
VITECFG

log "vite.config.ts patched — Replit-only plugins removed"

step "Building frontend and backend"

export DATABASE_URL="$DATABASE_URL"
export NODE_ENV=production

info "Building frontend (Vite)..."
npx vite build 2>&1 | tail -10

info "Compiling backend (esbuild)..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  2>&1 | tail -5

log "Build complete — frontend in dist/public/, backend in dist/index.js"

# =============================================================================
#  SECTION 8 — DATABASE SCHEMA & SEED
# =============================================================================
step "Initializing database schema"

info "Pushing Drizzle schema to database (creates all tables)..."
# db:push is safe on a FRESH database — it creates missing tables without dropping data
DATABASE_URL="$DATABASE_URL" npx drizzle-kit push --force 2>&1 | tail -15

# Create the connect-pg-simple session table
info "Creating session store table..."
PGPASSWORD="$DB_PASS" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=0 <<SQL
CREATE TABLE IF NOT EXISTS "session" (
  "sid"    varchar NOT NULL COLLATE "default",
  "sess"   json    NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
) WITH (OIDS=FALSE);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
SQL

log "Database schema initialized — seed runs automatically on first app start"

# =============================================================================
#  SECTION 9 — PM2 PROCESS MANAGER
# =============================================================================
step "Setting up PM2"

mkdir -p "$APP_DIR/logs"

cat > "$APP_DIR/ecosystem.config.cjs" <<ECOJS
module.exports = {
  apps: [{
    name: 'noviq',
    script: 'dist/index.js',
    cwd: '${APP_DIR}',
    interpreter: 'node',
    node_args: '',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: '${DATABASE_URL}',
      SESSION_SECRET: '${SESSION_SECRET}',
      PORT: '${APP_PORT}'
    },
    error_file: '${APP_DIR}/logs/err.log',
    out_file:   '${APP_DIR}/logs/out.log',
    log_file:   '${APP_DIR}/logs/combined.log',
    time: true
  }]
};
ECOJS

# Stop any old instance gracefully
pm2 stop noviq 2>/dev/null || true
pm2 delete noviq 2>/dev/null || true

info "Starting NOVIQ with PM2..."
pm2 start "$APP_DIR/ecosystem.config.cjs"

info "Saving PM2 process list..."
pm2 save

info "Enabling PM2 startup on boot..."
pm2 startup systemd -u root --hp /root 2>&1 | grep -v "^$" || true

log "PM2 setup complete — app running on port $APP_PORT"

# =============================================================================
#  SECTION 10 — NGINX REVERSE PROXY
# =============================================================================
step "Configuring Nginx"

NGINX_CONF="/etc/nginx/sites-available/noviq"

cat > "$NGINX_CONF" <<NGINXCFG
# NOVIQ — Nginx reverse proxy
# Generated by deploy.sh on $(date -u +"%Y-%m-%d %H:%M UTC")

server {
    listen ${NGINX_PORT};
    server_name ${DOMAIN};

    # Increase body size for file uploads (CSV, SQL, images)
    client_max_body_size 50M;

    # Proxy all traffic to the Node.js app
    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;

        # WebSocket support (used by Vite HMR and app ws connections)
        proxy_set_header   Upgrade    \$http_upgrade;
        proxy_set_header   Connection "upgrade";

        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts — generous for large CSV imports
        proxy_read_timeout    120s;
        proxy_connect_timeout  10s;
    }

    # Serve uploaded files directly (bypass Node.js for speed)
    location /uploads/ {
        alias ${APP_DIR}/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Security headers
    add_header X-Frame-Options       "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy       "strict-origin-when-cross-origin";
}
NGINXCFG

# Enable site (remove default if present)
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/noviq
rm -f /etc/nginx/sites-enabled/default

info "Testing Nginx configuration..."
nginx -t

info "Reloading Nginx..."
systemctl reload nginx
systemctl enable nginx

log "Nginx configured — listening on port $NGINX_PORT"

# =============================================================================
#  SECTION 11 — FIREWALL (UFW)
# =============================================================================
step "Configuring firewall"

info "Allowing SSH (22), HTTP ($NGINX_PORT), HTTPS (443)..."
ufw allow ssh
ufw allow "$NGINX_PORT/tcp"
ufw allow 443/tcp
# Do NOT expose port 5000 externally — Nginx handles all traffic
ufw --force enable

log "Firewall active"

# =============================================================================
#  SECTION 12 — UPLOADS DIRECTORY PERMISSIONS
# =============================================================================
step "Setting file permissions"

mkdir -p "$APP_DIR/uploads"
chown -R www-data:www-data "$APP_DIR/uploads" 2>/dev/null || true
chmod -R 755 "$APP_DIR/uploads"
chmod 600 "$APP_DIR/.env"

log "Permissions set"

# =============================================================================
#  HEALTH CHECK
# =============================================================================
step "Health check"

info "Waiting for app to start (10s)..."
sleep 10

HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/api/auth/me" 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" == "401" || "$HTTP_CODE" == "200" ]]; then
  log "App is responding (HTTP $HTTP_CODE from /api/auth/me)"
else
  warn "App not responding yet (HTTP $HTTP_CODE) — check logs with: pm2 logs noviq"
fi

# =============================================================================
#  SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║           DEPLOYMENT COMPLETE — NOVIQ               ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}App URL:${NC}         http://${DOMAIN}:${NGINX_PORT}"
echo ""
echo -e "  ${BOLD}Default login:${NC}"
echo -e "    Username:  admin"
echo -e "    Password:  admin123"
echo ""
echo -e "  ${BOLD}Database:${NC}        $DB_NAME  (user: $DB_USER)"
echo -e "  ${BOLD}Credentials:${NC}     stored in $APP_DIR/.env"
echo -e "  ${BOLD}Logs:${NC}            $APP_DIR/logs/"
echo -e "  ${BOLD}App files:${NC}       $APP_DIR"
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo -e "    pm2 status                  — check app status"
echo -e "    pm2 logs noviq              — live app logs"
echo -e "    pm2 restart noviq           — restart app"
echo -e "    pm2 stop noviq              — stop app"
echo -e "    nginx -t && nginx -s reload — reload Nginx config"
echo -e "    bash $APP_DIR/deploy.sh     — re-deploy (update)"
echo ""
echo -e "  ${BOLD}To enable HTTPS (Let's Encrypt):${NC}"
echo -e "    apt install certbot python3-certbot-nginx -y"
echo -e "    certbot --nginx -d ${DOMAIN}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
