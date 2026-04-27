import { Role } from '@prisma/client';

/**
 * Safe user object — never includes password.
 * Used in API responses after login/register.
 */
export interface SafeUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * JWT payload stored in access/refresh tokens.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tenantId: string | null;
}

/**
 * Login endpoint response.
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

/**
 * Authenticated user extracted from JWT by @CurrentUser().
 */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
}

/**
 * Command for RegisterUseCase.
 */
export interface RegisterCommand {
  email: string;
  password: string;
  tenantId: string;
}
