# FlashMe 🎨

SaaS platform for tattoo studios — manage flash designs and accept bookings online.

## Tech Stack

- **Frontend** — Next.js 14 App Router
- **Backend** — NestJS (modular monolith)
- **Database** — PostgreSQL + Prisma 7
- **Monorepo** — Turborepo + pnpm
- **CI/CD** — GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker

### Setup

```bash
# Install dependencies
pnpm install

# Start database
docker compose up -d

# Generate Prisma client
cd packages/database && npx prisma generate

# Run migrations
cd packages/database && npx prisma migrate dev

# Copy env files
cp apps/api/.env.example apps/api/.env

# Start dev servers
pnpm dev
```

## Apps

| App | URL                   | Description      |
| --- | --------------------- | ---------------- |
| web | http://localhost:3000 | Next.js frontend |
| api | http://localhost:3001 | NestJS backend   |

## API Endpoints

| Method | Endpoint            | Auth | Description    |
| ------ | ------------------- | ---- | -------------- |
| POST   | /auth/register      | —    | Register user  |
| POST   | /auth/login         | —    | Login          |
| POST   | /tenants            | —    | Create studio  |
| GET    | /tenants/:slug      | —    | Get studio     |
| POST   | /flashes            | JWT  | Create flash   |
| GET    | /flashes/tenant/:id | —    | Get catalogue  |
| POST   | /bookings           | JWT  | Create booking |
| PATCH  | /bookings/:id       | JWT  | Update booking |

## Development

```bash
pnpm dev          # Start all apps
pnpm test         # Run tests (from apps/api)
pnpm lint         # Lint all packages
```
