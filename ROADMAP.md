# FlashMe — Roadmap & Architecture

## Stack

- **Frontend** : Next.js 14 App Router (apps/web)
- **Backend** : NestJS monolithe modulaire (apps/api)
- **BDD** : PostgreSQL (RDS) + Prisma 7
- **Storage** : S3 + CloudFront
- **Paiements** : Stripe Connect (commission %)
- **Emails** : Resend
- **SMS** : Twilio
- **Infra** : AWS ECS Fargate + Terraform
- **CI/CD** : GitHub Actions
- **Monorepo** : Turborepo + pnpm

## Architecture

- Multi-tenant (tenantId sur chaque ressource)
- Monolithe modulaire NestJS (auth, tenants, bookings, flashes, stripe, notifications, analytics)
- Commission 10% sur l'acompte (30% du prix du flash) via Stripe Connect

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
- [x] Tests unitaires
- [x] Husky + lint-staged pre-commit
- [x] CI/CD GitHub Actions (lint, typecheck, test, build)
- [x] Git flow (feature → rebase → develop → merge --ff-only → main)

### ✅ Sprint 2 — Core Booking

- [x] Module Flashes (create, catalogue, findOne, updateStatus)
- [x] Module Bookings (create, findByArtist, findByClient, update)
- [x] RBAC (RolesGuard, @Roles decorator, Role.OWNER/ARTIST/CLIENT)
- [x] Upload images S3 (presigned URLs, CloudFront)
- [x] Transaction atomique (booking + flash status)
- [x] Postman collection

### ✅ Sprint 3 — Monétisation

- [x] Stripe Connect onboarding studio
- [x] Paiement acompte (PaymentIntent + commission FlashMe)
- [x] Webhooks Stripe (account.updated, payment_intent.succeeded)
- [x] Branch protection + CI required checks sur main

### ⏳ Sprint 4 — Notifications backend

- [ ] Confirmation email au signup (vérification email)
- [ ] Email confirmation booking client
- [ ] Email notification artiste (nouvelle réservation)
- [ ] SMS rappel rendez-vous (Twilio)

### ⏳ Sprint 5 — Frontend

- [ ] Setup Next.js (Tailwind, shadcn/ui, React Query, Zustand)
- [ ] Pages auth (signup, login, verify email)
- [ ] Dashboard studio owner (onboarding Stripe, gestion flashes)
- [ ] Catalogue flashes public (par studio/slug)
- [ ] Flow réservation client (choix flash → date → paiement Stripe)
- [ ] Dashboard artiste (bookings, revenus)

### ⏳ Sprint 6 — Infra & Production

- [ ] Terraform AWS (ECS Fargate, RDS, S3, CloudFront)
- [ ] Staging environment
- [ ] Monitoring (CloudWatch + Sentry)
- [ ] Production launch

### ⏳ Sprint 7 — Post-launch

- [ ] Tests E2E Playwright (flow complet signup → booking → paiement)
- [ ] Dashboard analytics owner
- [ ] Optimisations performance

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
- `pnpm --filter api test` — lancer les tests

## Git Flow

- `feature/*` → rebase sur develop → merge --ff-only sur main
- Ne jamais force push sur `main` ou `develop`
- Garder les branches feature sur origin (historique visible)
