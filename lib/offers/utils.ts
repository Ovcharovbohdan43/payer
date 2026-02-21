/**
 * Offer helpers: status labels, public URL.
 */

export const OFFER_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "declined",
  "expired",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
};

export function getPublicOfferUrl(publicId: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/o/${publicId}`;
}
