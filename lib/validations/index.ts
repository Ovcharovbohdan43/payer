import { z } from "zod";

/**
 * Shared Zod schemas for client and server validation.
 * Reuse these in react-hook-form and in Server Actions.
 */

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

export const optionalEmailSchema = z
  .string()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""));

export const nonEmptyStringSchema = (fieldName: string) =>
  z.string().min(1, `${fieldName} is required`);

export const optionalStringSchema = z.string().optional();

export const amountCentsSchema = z
  .number()
  .int("Amount must be a whole number")
  .nonnegative("Amount must be positive");

export const currencySchema = z
  .string()
  .length(3, "Currency must be a 3-letter code")
  .toUpperCase();

export const onboardingSchema = z.object({
  business_name: z.string().min(1, "Business name is required").max(200),
  default_currency: z.string().length(3).toUpperCase(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  show_vat_fields: z.boolean(),
});
