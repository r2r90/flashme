# FlashMe — Roadmap & Architecture

## Stack

- **Frontend** : Next.js 14 App Router (apps/web)
- **Backend** : NestJS monolithe modulaire (apps/api)
- **BDD** : PostgreSQL (RDS) + Prisma 7 + Row-Level Security
- **Cache** : Redis (ElastiCache)
- **Storage** : S3 + CloudFront
- **Paiements** : Stripe Connect (commission %)
- **Emails** : Resend / SES
- **SMS** : Twilio
- **Infra** : AWS ECS Fargate + Terraform
- **CI/CD** : GitHub Actions
- **Monorepo** : Turborepo + pnpm

## Architecture

- Multi-tenant via PostgreSQL Row-Level Security
- Monolithe modulaire NestJS (auth, tenants, bookings, flashes, payments, notifications, analytics)
- Commission % sur chaque réservation via Stripe Connect

## Sprints

### ✅ Sprint 1 — Fondations

- [x] Monorepo Turborepo + pnpm
- [x] Next.js (apps/web) + NestJS (apps/api)
- [x] Docker Compose PostgreSQL local
- [x] Prisma 7 schema (Tenant, User, Artist, Flash, Booking)
- [x] Migration BDD init
- [x] Module Auth (register, login, JWT access/refresh)
- [x] JWT Strategy + Guard
- [x] CurrentUser decorator
- [x] Module Tenants (create, findBySlug)
- [x] DTOs avec validation (class-validator)
- [x] Tests unitaires (28/28)
- [x] Husky + lint-staged pre-commit
- [x] CI/CD GitHub Actions (lint, type-check, test, build)
- [x] Git flow (feature → rebase → develop → main)

### ✅ Sprint 2 — Core Booking

- [x] Module Flashes (create, catalogue, findOne, updateStatus)
- [x] Module Bookings (create, findByArtist, findByClient, update)
- [x] Transaction atomique (booking + flash status)
- [x] Postman collection

### ⏳ Sprint 3 — Monétisation

- [ ] RBAC (guards par rôle)
- [ ] Upload images S3
- [ ] Stripe Connect (onboarding studio)
- [ ] Paiement acompte en ligne
- [ ] Notifications email (Resend)
- [ ] Notifications SMS (Twilio)

### ⏳ Sprint 4 — Polish & Launch

- [ ] Dashboard analytics artiste
- [ ] Terraform AWS (ECS, RDS, S3, CloudFront)
- [ ] Monitoring (CloudWatch + Sentry)
- [ ] Staging → Production

## Ports locaux

- web : http://localhost:3000
- api : http://localhost:3001
- db : localhost:5432
- studio : npx prisma studio (packages/database)

## Commandes utiles

- `pnpm dev` — démarre tout
- `docker compose up -d` — démarre PostgreSQL
- `cd packages/database && npx prisma generate` — générer le client Prisma
- `cd packages/database && npx prisma migrate dev` — nouvelle migration
- `cd packages/database && npx prisma studio` — GUI base de données
- `cd apps/api && pnpm test` — lancer les tests

## Git Flow

- `feature/*` → rebase → `develop` → `main`
- `git rebase develop` → `git push --force-with-lease` → `git merge --ff-only`
