# TattoBook — Roadmap & Architecture

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
- [x] Module Tenants (create, findBySlug)
- [ ] CI/CD GitHub Actions de base

### ✅ Sprint 2 — Core Booking
- [x] Module Flashes (create, catalogue, findOne, updateStatus)
- [ ] Module Bookings (créneaux, réservation)
- [ ] Calendrier artiste

### ⏳ Sprint 3 — Monétisation
- [ ] Stripe Connect (onboarding studio)
- [ ] Paiement acompte en ligne
- [ ] Notifications email (Resend)
- [ ] Notifications SMS (Twilio)

### ⏳ Sprint 4 — Polish & Launch
- [ ] Dashboard analytics artiste
- [ ] CI/CD GitHub Actions complet
- [ ] Terraform AWS (ECS, RDS, S3, CloudFront)
- [ ] Monitoring (CloudWatch + Sentry)
- [ ] Staging → Production

## Ports locaux
- web  : http://localhost:3000
- api  : http://localhost:3001
- db   : localhost:5432
- studio : npx prisma studio (packages/database)

## Commandes utiles
- `pnpm dev` — démarre tout
- `docker compose up -d` — démarre PostgreSQL
- `cd packages/database && npx prisma migrate dev` — nouvelle migration
- `cd packages/database && npx prisma studio` — GUI base de données
