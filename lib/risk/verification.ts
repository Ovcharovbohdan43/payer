import { scanProhibitedContent } from "@/lib/risk/prohibited-content";
import { describeCountryCurrencyIssue } from "@/lib/risk/country-currency";
import { PAYMENTS_SUPPORT_EMAIL } from "@/lib/risk/constants";

export type SellerVerificationProfile = {
  onboarding_completed?: boolean | null;
  business_name?: string | null;
  business_description?: string | null;
  phone?: string | null;
  website?: string | null;
  company_type?: string | null;
  country?: string | null;
  default_currency?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type SellerVerificationInput = {
  profile: SellerVerificationProfile;
  emailConfirmed: boolean;
};

export type VerificationChecklist = {
  complete: boolean;
  missing: string[];
  prohibited: boolean;
  prohibitedMatches: string[];
};

export function evaluateSellerVerification(
  input: SellerVerificationInput
): VerificationChecklist {
  const { profile, emailConfirmed } = input;
  const missing: string[] = [];

  if (!emailConfirmed) missing.push("Confirm your email address");
  if (!profile.onboarding_completed) missing.push("Complete onboarding");
  if (!profile.first_name?.trim()) missing.push("First name");
  if (!profile.last_name?.trim()) missing.push("Last name");
  if (!profile.business_name?.trim()) missing.push("Business name");
  if (!profile.phone?.trim()) missing.push("Phone number");
  if (!profile.business_description?.trim() || profile.business_description.trim().length < 20) {
    missing.push("Business description (min 20 characters — what you sell and to whom)");
  }
  if (!profile.website?.trim() && !profile.company_type?.trim()) {
    missing.push("Website or industry / company type");
  }
  if (!profile.country?.trim()) missing.push("Country");
  if (!profile.default_currency?.trim()) missing.push("Default currency");

  const currencyIssue = describeCountryCurrencyIssue(
    profile.country,
    profile.default_currency
  );
  if (currencyIssue) missing.push(currencyIssue);

  const prohibitedScan = scanProhibitedContent(
    profile.business_name,
    profile.business_description,
    profile.company_type,
    profile.website
  );

  return {
    complete: missing.length === 0 && !prohibitedScan.flagged,
    missing,
    prohibited: prohibitedScan.flagged,
    prohibitedMatches: prohibitedScan.matches,
  };
}

export function formatVerificationBlockMessage(checklist: VerificationChecklist): string {
  if (checklist.prohibited) {
    return `Your business description may include prohibited categories (${checklist.prohibitedMatches.join(", ")}). Contact ${PAYMENTS_SUPPORT_EMAIL}.`;
  }
  if (checklist.missing.length) {
    return `Complete seller verification before accepting payments: ${checklist.missing.join("; ")}.`;
  }
  return `Seller verification is pending. Contact ${PAYMENTS_SUPPORT_EMAIL}.`;
}
