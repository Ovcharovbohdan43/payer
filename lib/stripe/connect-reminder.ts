import { toast } from "sonner";

export const STRIPE_CONNECT_SETTINGS_HREF = "/settings#payments";

export function stripeConnectReminderMessage(): string {
  return "Clients can't pay by card until you connect Stripe in Settings.";
}

export function shouldRemindStripeConnect(profile: {
  stripe_connect_account_id?: string | null;
  is_admin?: boolean | null;
} | null): boolean {
  if (!profile || profile.is_admin) return false;
  return !profile.stripe_connect_account_id;
}

export function showStripeConnectReminderToast(openSettings?: () => void) {
  toast.warning(stripeConnectReminderMessage(), {
    duration: 12000,
    action: openSettings
      ? {
          label: "Open Settings",
          onClick: openSettings,
        }
      : undefined,
  });
}
