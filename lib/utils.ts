import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mask email for display: first 2 chars of local part + ***@ + first char of domain + ***.
 * Example: user@example.com → us***@e***
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***"
  const [local, domain] = email.split("@")
  const localMask = local.length <= 2 ? local + "***" : local.slice(0, 2) + "***"
  const domainMask = domain ? domain[0] + "***" : "***"
  return `${localMask}@${domainMask}`
}
