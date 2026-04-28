// ── Enums ────────────────────────────────────────────────────────
export enum Role {
  OWNER = 'OWNER',
  ARTIST = 'ARTIST',
  CLIENT = 'CLIENT',
}

export enum FlashStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  DONE = 'DONE',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

// ── Auth ─────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface MessageResponse {
  message: string;
}

// ── Tenant ───────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  stripeOnboardingDone: boolean;
  stripeChargesEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Flash ────────────────────────────────────────────────────────
export interface Artist {
  id: string;
  bio: string | null;
  user: { email: string };
}

export interface Flash {
  id: string;
  tenantId: string;
  artistId: string;
  title: string;
  description: string | null;
  imageUrl: string;
  price: number;
  status: FlashStatus;
  createdAt: string;
  updatedAt: string;
  artist: Artist;
}

// ── Booking ──────────────────────────────────────────────────────
export interface Booking {
  id: string;
  tenantId: string;
  clientId: string;
  flashId: string;
  scheduledAt: string;
  status: BookingStatus;
  depositAmount: number;
  depositPaid: boolean;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
  flash?: Flash;
}

// ── API Errors ───────────────────────────────────────────────────
export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}
