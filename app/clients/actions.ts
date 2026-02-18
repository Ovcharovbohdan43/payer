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
