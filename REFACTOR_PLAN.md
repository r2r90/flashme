# FlashMe — Refactor Plan

## Architecture target

Modular Monolith by Business Module.

Goal:

- one business module = one folder
- easy navigation
- clean NestJS structure
- no overengineering
- keep tests green after every move

---

## Target structure

```txt
apps/api/src/
  shared/
    prisma/
    config/
    decorators/
    guards/
    filters/
    logging/
    exceptions/

  auth/
    dto/
    decorators/
    guards/
    strategies/
    use-cases/
    auth.controller.ts
    auth.service.ts
    auth.module.ts

  users/
    dto/
    use-cases/
    users.service.ts
    users.module.ts

  tenants/
    dto/
    use-cases/
    tenants.controller.ts
    tenants.service.ts
    tenants.module.ts

  flashes/
    dto/
    policies/
    use-cases/
    flashes.controller.ts
    flashes.service.ts
    flashes.module.ts

  bookings/
    dto/
    policies/
    use-cases/
    bookings.controller.ts
    bookings.service.ts
    bookings.module.ts

  storage/
    dto/
    services/
    storage.controller.ts
    storage.module.ts

  stripe/
    dto/
    use-cases/
    handlers/
    services/
    stripe.controller.ts
    stripe.module.ts
```
