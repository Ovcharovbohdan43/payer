"use server";

import { createClient } from "@/lib/supabase/server";
import { clientSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export async function listClients(): Promise<ClientRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("clients")
    .select("id, name, email, phone, created_at")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (data ?? []) as ClientRow[];
}

export async function createClientAction(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
  };
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid fields";
    return { error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    })
    .select("id, name, email, phone, created_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/clients");
  return { data: data as ClientRow };
}

export async function updateClientAction(formData: FormData) {
  const clientId = formData.get("clientId");
  if (typeof clientId !== "string" || !clientId) return { error: "Missing client" };

  const raw = {
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
  };
  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid fields";
    return { error: msg };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    })
    .eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath("/clients");
  return {};
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) return { error: error.message };
  revalidatePath("/clients");
  return {};
}

export async function getClientById(id: string): Promise<ClientRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("clients")
    .select("id, name, email, phone, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data as ClientRow | null;
}

export type ClientInvoiceRow = {
  id: string;
  number: string;
  status: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  sent_at: string | null;
  paid_at: string | null;
};

export type ClientOfferRow = {
  id: string;
  number: string;
  status: string;
  amount_cents: number;
  currency: string;
  created_at: string;
};

export type ClientStats = {
  totalPaidCents: number;
  totalUnpaidCents: number;
  paidCount: number;
  unpaidCount: number;
  avgPaymentDays: number | null;
  invoices: ClientInvoiceRow[];
  offers: ClientOfferRow[];
};

export async function getClientStats(clientId: string): Promise<ClientStats | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("id, email")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (!client) return null;

  const clientEmail = (client.email ?? "").trim();
  const orFilter = clientEmail
    ? `client_id.eq.${clientId},client_email.eq.${clientEmail}`
    : `client_id.eq.${clientId}`;

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, number, status, amount_cents, currency, created_at, sent_at, paid_at")
    .eq("user_id", user.id)
    .neq("status", "void")
    .or(orFilter)
    .order("created_at", { ascending: false });

  const { data: offers } = await supabase
    .from("offers")
    .select("id, number, status, amount_cents, currency, created_at")
    .eq("user_id", user.id)
    .or(orFilter)
    .neq("status", "expired")
    .order("created_at", { ascending: false });

  const invList = (invoices ?? []) as ClientInvoiceRow[];
  const offList = (offers ?? []) as ClientOfferRow[];

  let totalPaidCents = 0;
  let totalUnpaidCents = 0;
  let paidCount = 0;
  let unpaidCount = 0;
  const paymentDays: number[] = [];

  for (const inv of invList) {
    const cents = Number(inv.amount_cents);
    if (inv.status === "paid" && inv.paid_at) {
      totalPaidCents += cents;
      paidCount++;
      if (inv.sent_at) {
        const sent = new Date(inv.sent_at).getTime();
        const paid = new Date(inv.paid_at).getTime();
        paymentDays.push(Math.round((paid - sent) / (24 * 60 * 60 * 1000)));
      }
    } else if (!["void"].includes(inv.status)) {
      totalUnpaidCents += cents;
      unpaidCount++;
    }
  }

  const avgPaymentDays =
    paymentDays.length > 0
      ? Math.round(
          paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length
        )
      : null;

  return {
    totalPaidCents,
    totalUnpaidCents,
    paidCount,
    unpaidCount,
    avgPaymentDays,
    invoices: invList,
    offers: offList,
  };
}
