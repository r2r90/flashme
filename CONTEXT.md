# FlashMe — Contexte technique pour nouvelle conversation

## Prompt système

Agis en tant que Lead Dev Senior Full-Stack & DevOps pour m'aider à construire un SaaS de réservation de flashes de tatouage. Je suis fondateur/développeur solo. Exigences : clean code, TypeScript strict, tests, CI/CD, production-ready.

## Projet

**FlashMe** — SaaS multi-tenant pour studios de tatouage. Les clients réservent des flashes en ligne. Monétisation par commission % sur chaque réservation via Stripe Connect.

## Stack

- Monorepo Turborepo + pnpm
- Frontend : Next.js 14 App Router (apps/web) port 3000
- Backend : NestJS monolithe modulaire (apps/api) port 3001
- BDD : PostgreSQL + Prisma 7 + adapter-pg
- Infra : AWS (S3, ECS Fargate, RDS, CloudFront)
- CI/CD : GitHub Actions
- Git flow : feature/\* → rebase → develop → main

## État actuel du backend (apps/api/src)

### Modules implémentés

- auth/ — JWT login/register, JWT strategy, JwtAuthGuard
- auth/decorators/ — @CurrentUser(), @Roles()
- auth/guards/ — RolesGuard
- users/ — UsersService (findByEmail, findById, create)
- tenants/ — CRUD studio (create, findBySlug)
- flashes/ — catalogue flashes (create, findAllByTenant, findOne, updateStatus)
- bookings/ — réservations (create avec transaction atomique, findByArtist, findByClient, update)
- storage/ — S3 presigned URLs upload (getPresignedUploadUrl, deleteFile, getPublicUrl)
- prisma/ — PrismaService global avec adapter-pg

### DTOs validés (class-validator)

- LoginDto, RegisterDto
- CreateTenantDto
- CreateFlashDto, UpdateFlashStatusDto
- CreateBookingDto, UpdateBookingDto
- GetUploadUrlDto

### RBAC

- Role.OWNER, Role.ARTIST, Role.CLIENT
- @Roles() decorator + RolesGuard
- POST /flashes → ARTIST, OWNER seulement
- POST /bookings → CLIENT seulement
- GET /bookings/artist → ARTIST, OWNER seulement

## Tests

- 37 tests unitaires passent (jest)
- Fichiers spec : auth, tenants, flashes, bookings, prisma, users, roles.guard

## Prisma schema (packages/database/prisma/schema.prisma)

Models : Tenant, User (Role: OWNER/ARTIST/CLIENT), Artist, Flash (FlashStatus: AVAILABLE/BOOKED/DONE), Booking (BookingStatus: PENDING/CONFIRMED/CANCELLED/COMPLETED)
Config : packages/database/prisma.config.ts avec dotenv + defineConfig + datasource url

## Variables d'environnement (apps/api/.env — ne pas committer)

DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN (15m), JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN (7d), PORT=3001
AWS_REGION=eu-west-3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET=flashme-dev-593358960427-eu-west-3-an

## CI/CD (.github/workflows/ci.yml)

4 jobs parallèles : lint, typecheck, test, build (build needs les 3 autres)
Actions : checkout@hash, pnpm/action-setup@hash, setup-node@v6 node 24, cache@v5@hash
pnpm install --frozen-lockfile --prefer-offline
prisma generate dans typecheck, test, build (pas lint)
paths-ignore : md, txt, gitignore, env.example, docs, vscode, idea, postman

## Husky + lint-staged

pre-commit : lint-staged (eslint --fix + prettier)
pre-push : pnpm --filter api test

## Prochaines étapes (dans l'ordre)

1. Tests unitaires StorageService (mocker AWS SDK)
2. Commit + merge feature/s3-upload dans develop
3. Upload images S3 — intégration dans FlashesService (imageUrl depuis S3 key)
4. Stripe Connect (onboarding studio + paiement acompte + commission)
5. Notifications email (Resend)
6. Notifications SMS (Twilio)
7. Dashboard analytics artiste
8. Terraform AWS (ECS, RDS, S3, CloudFront)
9. Monitoring (CloudWatch + Sentry)

## Commandes utiles

- pnpm dev — démarre tout
- docker compose up -d — démarre PostgreSQL
- cd packages/database && npx prisma generate
- cd packages/database && npx prisma migrate dev
- cd packages/database && npx prisma studio
- cd apps/api && pnpm test

## Git état actuel

Branch courante : feature/s3-upload
À faire : tests StorageService → commit → merge develop → merge main
