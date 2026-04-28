# FlashMe ⚡

> SaaS platform for tattoo studios — manage flash designs, accept bookings, and collect payments online.

FlashMe gives tattoo studios their own branded booking page where clients can browse available flash designs and reserve them instantly. Studios get paid via Stripe Connect, and FlashMe takes a small commission on each deposit.

---

## Architecture

```
flashme/
├── apps/
│   ├── api/          → NestJS backend (port 3001)
│   └── web/          → Next.js 14 frontend (port 3000)
├── packages/
│   ├── database/     → Prisma schema, migrations, config
│   ├── eslint-config/
│   ├── typescript-config/
│   └── ui/           → Shared UI components
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

**Monorepo** powered by Turborepo + pnpm. Backend is a modular monolith — each domain (auth, bookings, flashes, stripe, storage, notifications) is an independent NestJS module with its own use-cases, DTOs, and tests.

---

## Tech Stack

| Layer    | Technology                         |
| -------- | ---------------------------------- |
| Frontend | Next.js 14 (App Router)            |
| Backend  | NestJS (modular monolith)          |
| Database | PostgreSQL + Prisma 7              |
| Payments | Stripe Connect (commission model)  |
| Storage  | AWS S3 + presigned URLs            |
| Email    | Resend                             |
| Auth     | JWT (access + refresh tokens)      |
| Monorepo | Turborepo + pnpm                   |
| CI/CD    | GitHub Actions                     |
| Infra    | AWS (ECS Fargate, RDS, CloudFront) |

---

## Business Model

FlashMe operates as a **SaaS-first** platform — each studio gets its own branded space (e.g. `flashme.com/ink-paris`).

- Client pays a **30% deposit** when booking a flash
- FlashMe takes a **10% commission** on the deposit
- Example: flash at €50 → deposit €15 → FlashMe gets €1.50, studio gets ~€12.72 (after Stripe fees)
- Marketplace discovery planned after 100+ studios onboarded

---

## Backend Modules

```
apps/api/src/
├── modules/
│   ├── auth/            → Register, login, email verification, JWT
│   ├── bookings/        → Create/update bookings, deposit calculation
│   ├── flashes/         → Flash catalogue CRUD, status management
│   ├── notifications/   → Email service (Resend), verification templates
│   ├── storage/         → S3 presigned URLs, file management
│   ├── stripe/          → Connect onboarding, payments, webhooks
│   ├── tenants/         → Studio CRUD, slug-based routing
│   └── users/           → User lookup and creation
└── shared/
    ├── decorators/      → @CurrentUser(), @Roles()
    ├── guards/          → JwtAuthGuard, RolesGuard
    ├── prisma/          → PrismaService (global)
    └── types/           → Shared TypeScript interfaces
```

---

## API Endpoints

### Auth

| Method | Endpoint                    | Auth | Description                     |
| ------ | --------------------------- | ---- | ------------------------------- |
| POST   | `/auth/register`            | —    | Register + verification email   |
| POST   | `/auth/login`               | —    | Login (requires verified email) |
| POST   | `/auth/verify-email`        | —    | Verify email with token         |
| POST   | `/auth/resend-verification` | —    | Resend verification email       |

### Tenants

| Method | Endpoint         | Auth | Description   |
| ------ | ---------------- | ---- | ------------- |
| POST   | `/tenants`       | —    | Create studio |
| GET    | `/tenants/:slug` | —    | Get studio    |

### Flashes

| Method | Endpoint              | Auth | Roles         | Description      |
| ------ | --------------------- | ---- | ------------- | ---------------- |
| POST   | `/flashes`            | JWT  | ARTIST, OWNER | Create flash     |
| GET    | `/flashes/tenant/:id` | —    | —             | Get catalogue    |
| GET    | `/flashes/:id`        | —    | —             | Get flash detail |
| PATCH  | `/flashes/:id/status` | JWT  | ARTIST, OWNER | Update status    |

### Bookings

| Method | Endpoint              | Auth | Roles         | Description       |
| ------ | --------------------- | ---- | ------------- | ----------------- |
| POST   | `/bookings`           | JWT  | CLIENT        | Create booking    |
| GET    | `/bookings/me`        | JWT  | CLIENT        | My bookings       |
| GET    | `/bookings/artist/me` | JWT  | ARTIST        | Artist's bookings |
| GET    | `/bookings/tenant`    | JWT  | OWNER         | Tenant's bookings |
| PATCH  | `/bookings/:id`       | JWT  | ARTIST, OWNER | Update booking    |

### Stripe

| Method | Endpoint                 | Auth | Roles  | Description             |
| ------ | ------------------------ | ---- | ------ | ----------------------- |
| POST   | `/stripe/onboarding`     | JWT  | OWNER  | Start Stripe onboarding |
| POST   | `/stripe/payment-intent` | JWT  | CLIENT | Create payment intent   |
| POST   | `/stripe/webhook`        | —    | —      | Stripe webhook handler  |

### Storage

| Method | Endpoint                 | Auth | Description       |
| ------ | ------------------------ | ---- | ----------------- |
| POST   | `/storage/presigned-url` | JWT  | Get S3 upload URL |

---

## Database Schema

```
Tenant  ──< User ──< Booking >── Flash >── Artist
   │                                          │
   └──────────────────────────────────────────┘
```

**Models:** `Tenant`, `User` (OWNER/ARTIST/CLIENT), `Artist`, `Flash` (AVAILABLE/BOOKED/DONE), `Booking` (PENDING/CONFIRMED/CANCELLED/COMPLETED)

Key fields: Stripe Connect IDs on Tenant, email verification on User, deposit tracking on Booking.

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker

### Setup

```bash
# Clone and install
git clone git@github.com:r2r90/flashme.git
cd flashme
pnpm install

# Start PostgreSQL
docker compose up -d

# Setup database
cd packages/database
npx prisma generate
npx prisma migrate dev
cd ../..

# Configure environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your keys (Stripe, AWS, Resend, JWT secrets)

# Start dev servers
pnpm dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://flashme:flashme@localhost:5432/flashme

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3
AWS_REGION=eu-west-3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_COMMISSION_RATE=0.10

# Email
RESEND_API_KEY=re_xxx
FROM_EMAIL=onboarding@resend.dev

# App
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## Development

```bash
pnpm dev                    # Start all apps
pnpm --filter api test      # Run API tests
pnpm lint                   # Lint all packages

# Database
cd packages/database
npx prisma studio           # Visual DB editor
npx prisma migrate dev      # Create migration
npx prisma generate         # Regenerate client
```

### Git Flow

```
feature/*  →  rebase on develop  →  merge --ff-only  →  push develop
develop    →  merge --ff-only main (release)
```

Never force push on `main` or `develop`.

### CI/CD

GitHub Actions runs 4 parallel jobs on every push: **lint**, **typecheck**, **test**, **build**. Build requires the other 3 to pass. Branch protection enforces all checks on `main`.

---

## Tests

**103 tests** across **23 test suites** — all passing.

Every service, controller, and use-case has unit tests. Mocks are used for external services (Prisma, Stripe, AWS S3, Resend).

```bash
cd apps/api && pnpm test
```

---

## RBAC

Three roles with granular access control:

| Role     | Can do                                              |
| -------- | --------------------------------------------------- |
| `OWNER`  | Manage studio, Stripe onboarding, view all bookings |
| `ARTIST` | Create flashes, manage bookings                     |
| `CLIENT` | Browse flashes, book, pay deposit                   |

Enforced via `@Roles()` decorator + `RolesGuard` on every protected endpoint.

---

## Roadmap

- [x] Auth (register, login, JWT, email verification)
- [x] Tenants (studio CRUD)
- [x] Flashes (catalogue, status management)
- [x] Bookings (create, update, deposit calculation)
- [x] Storage (S3 presigned URLs)
- [x] Stripe Connect (onboarding, payments, webhooks)
- [x] Email verification (Resend)
- [x] Strict TypeScript typing
- [x] CI/CD (GitHub Actions, branch protection)
- [ ] Swagger API documentation
- [ ] Frontend (Next.js pages, booking flow, dashboards)
- [ ] SMS notifications (Twilio)
- [ ] Terraform (ECS Fargate, RDS, CloudFront)
- [ ] Monitoring (CloudWatch + Sentry)
- [ ] E2E tests (Playwright)

---

## Database Schema

![ERD](./packages/database/prisma/ERD.svg)

## License

Private — all rights reserved.
