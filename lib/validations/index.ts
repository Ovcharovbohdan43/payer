import { z } from "zod";

/**
 * Shared Zod schemas for client and server validation.
 * Reuse these in react-hook-form and in Server Actions.
 */

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long");

export const registerSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, "Name is required").max(100),
  business_name: z.string().min(1, "Business name is required").max(200),
  password: passwordSchema,
  termsAccepted: z
    .string()
    .optional()
    .refine((v) => v === "true", "You must agree to the Terms of Service"),
});

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
});

export const profileContactSchema = z.object({
  address: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  company_number: z.string().max(50).optional().or(z.literal("")),
  vat_number: z.string().max(50).optional().or(z.literal("")),
});

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: optionalEmailSchema.or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
});

/** Amount in major units (e.g. 99.99). Convert to cents in action. */
export const amountMajorSchema = z
  .number({ error: "Enter a valid amount" })
  .nonnegative("Amount must be positive")
  .finite();

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(1000),
  amount: amountMajorSchema,
  discountPercent: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return 0;
      const n = typeof v === "string" ? parseFloat(v) : v;
      return Math.min(100, Math.max(0, Math.round(n)));
    }),
});

export const invoiceCreateSchema = z.object({
  clientId: z.string().uuid().optional().or(z.literal("")),
  clientName: z.string().min(1, "Client name is required").max(200),
  clientEmail: z.string().max(255).optional().or(z.literal("")),
  currency: z.string().length(3).toUpperCase(),
  dueDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  vatIncluded: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  paymentProcessingFeeIncluded: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  autoRemindEnabled: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  autoRemindDays: z
    .string()
    .optional()
    .default("1,3,7")
    .transform((s) => (s || "1,3,7").replace(/\s/g, ""))
    .refine((s) => /^(1|2|3|5|7|10|14)(,(1|2|3|5|7|10|14))*$/.test(s), "Pick at least one day: 1, 2, 3, 5, 7, 10, 14"),
  recurringEnabled: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  recurringInterval: z
    .enum(["days"])
    .optional()
    .default("days"),
  recurringIntervalValue: z
    .string()
    .optional()
    .default("7")
    .transform((s) => parseInt(s || "7", 10))
    .refine((n) => [1, 7, 14, 21, 30].includes(n), "Interval must be 1, 7, 14, 21, or 30 days"),
  discountType: z
    .enum(["percent", "fixed", "none"])
    .optional()
    .default("none"),
  discountPercent: z
    .string()
    .optional()
    .transform((s) => (s ? parseFloat(s) : 0))
    .pipe(z.number().min(0).max(100)),
  discountCents: z
    .string()
    .optional()
    .transform((s) => (s ? parseInt(s, 10) : 0))
    .pipe(z.number().int().min(0)),
  lineItems: z
    .string()
    .transform((s) => {
      try {
        const arr = JSON.parse(s || "[]");
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    })
    .pipe(z.array(lineItemSchema).min(1, "Add at least one service")),
});
