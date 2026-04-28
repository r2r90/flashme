import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantId: z.uuid('Invalid studio ID'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const resendVerificationSchema = z.object({
  email: z.email('Invalid email address'),
});

export type LoginFormValues = z.output<typeof loginSchema>;
export type RegisterFormValues = z.output<typeof registerSchema>;
export type VerifyEmailFormValues = z.output<typeof verifyEmailSchema>;
export type ResendVerificationFormValues = z.output<
  typeof resendVerificationSchema
>;
