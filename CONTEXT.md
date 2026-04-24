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

## Modules backend implémentés (apps/api/src)

- auth/ — JWT login/register, JWT strategy, JwtAuthGuard
- auth/decorators/ — @CurrentUser(), @Roles()
- auth/guards/ — RolesGuard
- users/ — UsersService (findByEmail, findById, create)
- tenants/ — CRUD studio (create, findBySlug)
- flashes/ — catalogue flashes (create, findAllByTenant, findOne, updateStatus)
- bookings/ — réservations (create avec transaction atomique, findByArtist, findByClient, update)
- storage/ — S3 presigned URLs (getPresignedUploadUrl, deleteFile, getPublicUrl)
- prisma/ — PrismaService global avec adapter-pg

## DTOs validés (class-validator)

- LoginDto, RegisterDto
- CreateTenantDto
- CreateFlashDto, UpdateFlashStatusDto
- CreateBookingDto, UpdateBookingDto
- GetUploadUrlDto

## RBAC

- Role.OWNER, Role.ARTIST, Role.CLIENT
- @Roles() decorator + RolesGuard
- POST /flashes → ARTIST, OWNER
- POST /bookings → CLIENT
- GET /bookings/artist → ARTIST, OWNER

## Storage S3

- Bucket : flashme-dev-593358960427-eu-west-3-an (région eu-west-3, privé)
- Flow : POST /storage/presigned-url → PUT direct vers S3 → stocker le key comme imageUrl
- Dossiers autorisés : flashes, avatars, studios
- MIME types autorisés : image/jpeg, image/png, image/webp
- IAM user : flashme-dev-s3 avec AmazonS3FullAccess

## Tests

- 59 tests unitaires passent (jest)
- Tous les services et controllers sont testés
- StorageService mocke AWS SDK

## Prisma schema

Models : Tenant, User (Role: OWNER/ARTIST/CLIENT), Artist, Flash (FlashStatus: AVAILABLE/BOOKED/DONE), Booking (BookingStatus: PENDING/CONFIRMED/CANCELLED/COMPLETED)
Config : packages/database/prisma.config.ts avec dotenv + defineConfig + datasource url

## Variables d'environnement (apps/api/.env)

DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN=15m, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN=7d, PORT=3001
AWS_REGION=eu-west-3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET=flashme-dev-593358960427-eu-west-3-an

## CI/CD (.github/workflows/ci.yml)

4 jobs parallèles : lint, typecheck, test, build (build needs les 3 autres)
Actions pinnées par hash : checkout, pnpm/action-setup, setup-node@v6, cache@v5
pnpm install --frozen-lockfile --prefer-offline
prisma generate dans typecheck, test, build (pas lint)
paths-ignore : md, txt, gitignore, env.example, docs, vscode, idea, postman

## Husky + lint-staged

pre-commit : lint-staged (eslint --fix + prettier) sur apps/api/\*_/_.ts
pre-push : pnpm --filter api test

## Postman collection

Fichier : apps/api/flashme.postman_collection.json
Groupes : Auth, Tenants, Flashes, Bookings, Storage
Script login : pm.collectionVariables.set('token', pm.response.json().accessToken)

## Commandes utiles

- pnpm dev — démarre tout
- docker compose up -d — démarre PostgreSQL
- cd packages/database && npx prisma generate
- cd packages/database && npx prisma migrate dev
- cd packages/database && npx prisma studio
- cd apps/api && pnpm test

## Git état actuel

Branches : main, develop, feature/\* (rebase → develop → main)
Tout est mergé sur main et develop — tout est vert CI

## Prochaines étapes (dans l'ordre)

1. Stripe Connect — onboarding studio, paiement acompte, commission FlashMe
2. Notifications email (Resend)
3. Notifications SMS (Twilio)
4. Dashboard analytics artiste
5. Terraform AWS (ECS, RDS, S3, CloudFront)
6. Monitoring (CloudWatch + Sentry)

## Décisions business

- Commission : 10% sur l'acompte (30% du prix du flash)
- Exemple flash 50€ : acompte 15€, FlashMe prend 1.50€, Stripe prend 0.78€, studio reçoit 12.72€
- Mode test Stripe en dev, pas de vrai argent
