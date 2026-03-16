"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const TEMPLATE_NAME_MAX_LENGTH = 200;
const TEMPLATE_ITEMS_MAX = 50;

export type InvoiceTemplateItemRow = {
  id: string;
  template_id: string;
  description: string;
  amount_cents: number;
  discount_percent: number;
  sort_order: number;
};

export type InvoiceTemplateRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  items?: InvoiceTemplateItemRow[];
};

/** Item shape when creating a template (from form: amount in major units). */
export type InvoiceTemplateItemInput = {
  description: string;
  amount: number;
  discountPercent?: number;
};

/**
 * List all invoice templates for the current user with their items (for dropdown and preview).
 */
export async function listInvoiceTemplates(): Promise<InvoiceTemplateRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: templates, error: templatesError } = await supabase
    .from("invoice_templates")
    .select("id, user_id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (templatesError || !templates?.length) return [];

  const ids = templates.map((t) => t.id);
  const { data: items, error: itemsError } = await supabase
    .from("invoice_template_items")
    .select("id, template_id, description, amount_cents, discount_percent, sort_order")
    .in("template_id", ids)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (itemsError) return templates as InvoiceTemplateRow[];

  const itemsByTemplate = (items ?? []).reduce(
    (acc, item) => {
      const tid = item.template_id;
      if (!acc[tid]) acc[tid] = [];
      acc[tid].push(item as InvoiceTemplateItemRow);
      return acc;
    },
    {} as Record<string, InvoiceTemplateItemRow[]>
  );

  return templates.map((t) => ({
    ...t,
    items: itemsByTemplate[t.id] ?? [],
  })) as InvoiceTemplateRow[];
}

/**
 * Get one template with items (for applying to form).
 */
export async function getInvoiceTemplate(
  templateId: string
): Promise<InvoiceTemplateRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: template, error: templateError } = await supabase
    .from("invoice_templates")
    .select("id, user_id, name, created_at")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .single();

  if (templateError || !template) return null;

  const { data: items } = await supabase
    .from("invoice_template_items")
    .select("id, template_id, description, amount_cents, discount_percent, sort_order")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  return {
    ...template,
    items: (items ?? []) as InvoiceTemplateItemRow[],
  } as InvoiceTemplateRow;
}

/**
 * Create a new invoice template with the given name and items.
 * Items: description, amount (in major units), discountPercent 0–100.
 */
export async function createInvoiceTemplate(
  name: string,
  items: InvoiceTemplateItemInput[]
): Promise<{ error?: string; data?: InvoiceTemplateRow }> {
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Template name is required" };
  if (trimmedName.length > TEMPLATE_NAME_MAX_LENGTH)
    return { error: `Name must be at most ${TEMPLATE_NAME_MAX_LENGTH} characters` };

  const validItems = items.filter(
    (i) => typeof i.description === "string" && i.description.trim() !== "" && typeof i.amount === "number" && !Number.isNaN(i.amount)
  );
  if (validItems.length === 0) return { error: "Add at least one line with description and amount" };
  if (validItems.length > TEMPLATE_ITEMS_MAX)
    return { error: `At most ${TEMPLATE_ITEMS_MAX} lines per template` };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: template, error: insertError } = await supabase
    .from("invoice_templates")
    .insert({
      user_id: user.id,
      name: trimmedName,
    })
    .select("id, user_id, name, created_at")
    .single();

  if (insertError) return { error: insertError.message };
  if (!template) return { error: "Failed to create template" };

  const itemRows = validItems.map((item, idx) => ({
    template_id: template.id,
    description: item.description.trim(),
    amount_cents: Math.round(item.amount * 100),
    discount_percent: Math.min(100, Math.max(0, item.discountPercent ?? 0)),
    sort_order: idx,
  }));

  const { error: itemsError } = await supabase
    .from("invoice_template_items")
    .insert(itemRows);

  if (itemsError) {
    await supabase.from("invoice_templates").delete().eq("id", template.id);
    return { error: itemsError.message };
  }

  revalidatePath("/invoices");
  revalidatePath("/invoices/new");

  return {
    data: {
      ...template,
      items: itemRows.map((row, idx) => ({
        id: "",
        template_id: template.id,
        description: row.description,
        amount_cents: row.amount_cents,
        discount_percent: row.discount_percent,
        sort_order: idx,
      })),
    } as InvoiceTemplateRow,
  };
}

/**
 * Delete an invoice template (and its items via cascade).
 */
export async function deleteInvoiceTemplate(
  templateId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("invoice_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/invoices");
  revalidatePath("/invoices/new");
  return {};
}

/**
 * Rename an invoice template.
 */
export async function renameInvoiceTemplate(
  templateId: string,
  name: string
): Promise<{ error?: string }> {
  const trimmedName = name.trim();
  if (!trimmedName) return { error: "Template name is required" };
  if (trimmedName.length > TEMPLATE_NAME_MAX_LENGTH)
    return { error: `Name must be at most ${TEMPLATE_NAME_MAX_LENGTH} characters` };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("invoice_templates")
    .update({ name: trimmedName })
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/invoices");
  revalidatePath("/invoices/new");
  return {};
}
