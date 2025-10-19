# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Seguridad Vial** (Road Safety) traffic violation management system consisting of a monorepo with multiple services for managing traffic infractions, notifications, and consultations. The system processes camera-based violations, generates PDF notifications, and provides web interfaces for both administrative and public-facing queries.

## Architecture

### Multi-Service Docker Architecture

The system consists of 5 containerized services orchestrated by Docker Compose:

1. **`sv_api` (Backend - Main API)**: NestJS application handling infractions, notifications, and presencial actas (in-person tickets)
2. **`consultas_api` (ConsultasSV Backend)**: Separate NestJS service for public queries/consultations (git submodule)
3. **`sv_web` (Frontend)**: React + Vite single-page application for administrative interface
4. **`sv_db`**: PostgreSQL 15 database (shared by all services)
5. **`sv_mailhog`**: MailHog for development email testing

**Key Design**: The main API (`sv_api`) and ConsultasSV API (`consultas_api`) are separate NestJS applications that share the same PostgreSQL database but have independent codebases and concerns.

### Backend (`sv_api`) - Main API

**Tech Stack**: NestJS + TypeScript (ESM modules), PostgreSQL via `pg`, JWT authentication

**Core Modules** (located in `backend/src/`):
- **`infracciones`**: Traffic violation CRUD, OCR/ANPR extraction from camera files, auto-correlativo generation via DB triggers
- **`notificaciones`**: PDF notification generation using `pdf-lib` with template overlays, email sending via nodemailer
- **`presencial`**: In-person ticket (acta presencial) PDF generation with cinemático data
- **`titulares`**: Vehicle owner management and lookups
- **`uploads`**: File upload handling (images, txt files from cameras)
- **`auth`**: JWT-based authentication with cookie support
- **`db`**: Global database module providing `pg` Pool injection

**Important Patterns**:
- ESM modules: All imports use `.js` extensions even for TypeScript files
- Database: Direct `pg` Pool queries (no ORM), injected as `@Inject('PG')`
- File uploads stored in `/data/uploads` (Docker volume `uploads_data`)
- PDF templates in `/app/templates` (mounted from `backend/templates/`)
- Auto-incrementing correlativos per series handled by PostgreSQL trigger `trg_infracciones_correlativo`

### Backend (`consultas_api`) - ConsultasSV

**Location**: `ConsultasSV/backend` (git submodule)

**Purpose**: Public-facing API for querying infractions by license plate or acta number, independent of main API but shares same database

**Tech Stack**: NestJS + TypeScript (ESM), PostgreSQL

**Key Difference**: This service does NOT generate PDFs - it delegates PDF generation to `sv_api` via internal API calls using `INTERNAL_API_TOKEN`

### Frontend (`sv_web`)

**Tech Stack**: React 18 + TypeScript, Vite, Tailwind CSS v4, Framer Motion

**Structure**:
- `App.tsx`: Entry point with `AuthProvider` and `ProtectedApp` wrapper
- `LoginPage.tsx`: Authentication UI
- `SeguridadVialWebUI.tsx`: Main administrative dashboard
- `NewInfraccion.tsx`: Infraction creation form with OCR/camera file handling
- `presencial/ActaPresencial.tsx`: In-person ticket creation form
- `auth.tsx`: Auth context provider with JWT cookie management

**Deployment**: Built as static files, served via Nginx at port 8080, proxies API requests to backend services

### Database

**Connection**: PostgreSQL 15 on `sv_db:5432`, database `svdb`, credentials `sv:svpass`

**Migration System**: Sequential SQL files in `backend/sql/` executed on container init:
- `001_infracciones.sql` - `012_actas_presenciales.sql`: Schema migrations
- `bootstrap.sql`: Seed data (usuarios, etc.)

**Key Tables**:
- `infracciones`: Traffic violations with auto-correlativo per `serie`
- `titulares`: Vehicle owners/drivers
- `notificaciones`: Notification records linked to infracciones
- `actas_presenciales`: In-person tickets with cinemático device info
- `usuarios`: System users with bcrypt passwords

**Important**: ConsultasSV mounts `backend/sql` for migrations, not a separate SQL directory

## Development Commands

### Docker Operations (Makefile)

```bash
make up          # Build and start all containers
make down        # Stop and remove containers
make logs        # Tail logs from all services
make rebuild     # Rebuild containers from scratch (--no-cache)
make psql        # Connect to PostgreSQL CLI
make seed        # Re-run SQL migrations (if volumes exist)
make smoke       # Run backend smoke tests against localhost:3000
```

### Backend (Main API - `sv_api`)

```bash
cd backend
npm run dev          # Development mode with watch (requires local DB)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled code from dist/main.js
npm run smoke        # Run smoke tests (requires BASE_URL env)
npm test             # Run Jest tests
npm run test:watch   # Jest in watch mode
```

**Environment**: See `.env.example` for required vars (`DATABASE_URL`, `JWT_SECRET`, `PWD_SALT`)

### Backend (ConsultasSV)

```bash
cd ConsultasSV/backend
npm run build        # Compile TypeScript
npm start            # Run from dist/main.js
npm run dev          # Watch mode (requires build first)
npm run seed         # Generate dummy data via gen-dummies script
```

### Frontend

```bash
cd frontend
npm run dev          # Vite dev server on port 5173
npm run build        # Production build to dist/
npm run preview      # Preview production build on port 5174
```

## Common Workflows

### Adding a New Database Migration

1. Create `backend/sql/0XX_description.sql` with next sequential number
2. Migrations run automatically on `sv_db` container init
3. For existing volumes: `make seed` or `docker compose exec db psql ...`

### Generating PDFs

**Notifications**: `POST /api/notificaciones/:id/pdf` on `sv_api` generates notification PDFs from `notificacion-template.pdf`

**Actas Presenciales**: `POST /api/actas-presenciales/:id/pdf` generates in-person ticket PDFs from `acta-presencial-template.pdf`

**PDF Coordinates**: Environment variables control text placement (e.g., `NOTIF_PHOTO_X_MM`, `PRES_ACTA_X_MM`) - see docker-compose.yml for full list

### Debugging PDF Layouts

Set `NOTIF_DEBUG_GRID=true` or `PRES_DEBUG_GRID=true` in docker-compose.yml to render coordinate grids on PDFs for template alignment

### Testing Email

MailHog UI at `http://localhost:8025` captures all SMTP emails sent during development

### Accessing Containers

```bash
docker compose exec api bash        # sv_api shell
docker compose exec consultas_api bash
docker compose exec web sh          # Nginx (Alpine)
```

## Key Environment Variables

**Required** (in `.env` or docker-compose.yml):
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing key
- `PWD_SALT`: Password hashing salt
- `INTERNAL_API_TOKEN`: Shared secret for inter-service API calls

**PDF Template Paths**:
- `TEMPLATE_DIR`: Location of PDF templates (default `/app/templates`)
- `PRES_TPL_PDF`: Path to acta presencial template PDF

**Directories**:
- `DATA_DIR`: Persistent data root (default `/data`)
- `UPLOAD_DIR`: File uploads location (default `/data/uploads`)

## Important Technical Details

### ESM Module Resolution

The backend uses ESM with TypeScript. **All imports must include `.js` extensions** even when importing TypeScript files:

```typescript
import { NotificacionesService } from '../notificaciones/notificaciones.service.js';
```

### Database Access Pattern

No ORM is used. Services inject `@Inject('PG') private readonly db: Pool` and execute raw SQL:

```typescript
const result = await this.db.query('SELECT * FROM infracciones WHERE id = $1', [id]);
```

### Auto-Correlativo System

Infraction numbers (`nro_correlativo`) auto-increment per `serie` via PostgreSQL trigger `trg_infracciones_correlativo`. Do not manually set correlativos in INSERT statements.

### Inter-Service Communication

`consultas_api` calls `sv_api` for PDF generation using:
- Base URL: `INTERNAL_API_BASE` (http://sv_api:3000/api)
- Authentication: `INTERNAL_API_TOKEN` header

### Frontend-Backend Integration

Frontend uses cookie-based JWT auth. API responses include `Set-Cookie` headers with `httpOnly` JWT tokens. Frontend auth context (`auth.tsx`) manages token state and API calls.

### Volume Mounts

- `uploads_data`: Shared between `sv_api`, `consultas_api`, and `sv_db` for file uploads
- `sv_data`: Persistent data including PDF outputs
- `sv_pgdata`: PostgreSQL data persistence
- `backend/templates`: Read-only templates for PDF generation

## Port Mappings

- `8080`: Nginx frontend (main entry point)
- `3000`: sv_api (backend main API)
- `5432`: PostgreSQL
- `8025`: MailHog web UI
- `1025`: MailHog SMTP

Frontend Nginx proxies `/api/*` to `sv_api:3000` and `/consultas/*` serves the ConsultasSV static build.

## Testing

**Backend Smoke Tests**: `make smoke` or `cd backend && npm run smoke` - runs `tests/smoke.ts` against running API

**Jest Tests**: `npm test` in backend (currently configured with `--passWithNoTests`)

## Git Submodule

`ConsultasSV` is a git submodule. To update:
```bash
git submodule update --remote ConsultasSV
```
