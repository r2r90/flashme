/**
 * Standard API response with a message.
 * Used by endpoints that don't return data (verify-email, resend, etc.)
 */
export interface MessageResponse {
  message: string;
}

/**
 * Paginated response wrapper.
 * Ready for when we add pagination to list endpoints.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
