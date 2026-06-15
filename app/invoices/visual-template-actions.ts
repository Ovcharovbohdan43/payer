"use server";

import { createClient } from "@/lib/supabase/server";
import {
  normalizeInvoiceVisualConfig,
  serializeInvoiceVisualConfig,
  type InvoiceVisualConfig,
  type InvoiceVisualTemplateRow,
} from "@/lib/invoice-visual-config";
import { revalidatePath } from "next/cache";

const TEMPLATE_NAME_MAX_LENGTH = 200;

function mapVisualTemplateRow(row: {
  id: string;
  user_id: string;
  name: string;
  config: unknown;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}): InvoiceVisualTemplateRow {
  return {
    ...row,
    config: normalizeInvoiceVisualConfig(row.config),
  };
}

export async function listInvoiceVisualTemplates(): Promise<InvoiceVisualTemplateRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("invoice_visual_templates")
    .select("id, user_id, name, config, is_default, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];
  return data.map(mapVisualTemplateRow);
}

export async function getInvoiceVisualTemplate(
  id: string
): Promise<InvoiceVisualTemplateRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("invoice_visual_templates")
    .select("id, user_id, name, config, is_default, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapVisualTemplateRow(data);
}

export async function createInvoiceVisualTemplate(
  name: string,
  config: InvoiceVisualConfig,
  options?: { setAsDefault?: boolean }
): Promise<{ error?: string; template?: InvoiceVisualTemplateRow }> {
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Template name is required" };
  if (trimmedName.length > TEMPLATE_NAME_MAX_LENGTH) {
    return { error: `Template name must be at most ${TEMPLATE_NAME_MAX_LENGTH} characters` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const normalizedConfig = normalizeInvoiceVisualConfig(config);

  const { data: template, error } = await supabase
    .from("invoice_visual_templates")
    .insert({
      user_id: user.id,
      name: trimmedName,
      config: JSON.parse(serializeInvoiceVisualConfig(normalizedConfig)),
      is_default: options?.setAsDefault ?? false,
    })
    .select("id, user_id, name, config, is_default, created_at, updated_at")
    .single();

  if (error || !template) return { error: error?.message ?? "Failed to save visual template" };

  if (options?.setAsDefault) {
    await supabase
      .from("invoice_visual_templates")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .neq("id", template.id);

    await supabase
      .from("profiles")
      .update({ default_invoice_visual_template_id: template.id })
      .eq("id", user.id);
  }

  revalidatePath("/invoices/new");
  revalidatePath("/settings");
  return { template: mapVisualTemplateRow(template) };
}

export async function deleteInvoiceVisualTemplate(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("invoice_visual_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  await supabase
    .from("profiles")
    .update({ default_invoice_visual_template_id: null })
    .eq("id", user.id)
    .eq("default_invoice_visual_template_id", id);

  revalidatePath("/invoices/new");
  revalidatePath("/settings");
  return {};
}

export async function setDefaultInvoiceVisualTemplate(
  id: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (id) {
    const { data: template } = await supabase
      .from("invoice_visual_templates")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!template) return { error: "Visual template not found" };

    await supabase
      .from("invoice_visual_templates")
      .update({ is_default: false })
      .eq("user_id", user.id);

    await supabase
      .from("invoice_visual_templates")
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ default_invoice_visual_template_id: id })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/invoices/new");
  revalidatePath("/settings");
  return {};
}
