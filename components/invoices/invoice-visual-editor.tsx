"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoiceVisualPreview, type InvoicePreviewLineItem } from "@/components/invoices/invoice-visual-preview";
import {
  createInvoiceVisualTemplate,
  deleteInvoiceVisualTemplate,
} from "@/app/invoices/visual-template-actions";
import {
  getDefaultVisualConfig,
  normalizeInvoiceVisualConfig,
  serializeInvoiceVisualConfig,
  type InvoiceVisualConfig,
  type InvoiceVisualTemplateRow,
} from "@/lib/invoice-visual-config";
import { INVOICE_DESIGNS, normalizeInvoiceDesign, type InvoiceDesignKey } from "@/lib/invoice-designs";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Palette, Save, Trash2 } from "lucide-react";

type InvoiceVisualEditorProps = {
  visualConfig: InvoiceVisualConfig;
  onVisualConfigChange: (config: InvoiceVisualConfig) => void;
  visualTemplates: InvoiceVisualTemplateRow[];
  onTemplatesChanged?: () => void;
  businessName: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  companyNumber?: string | null;
  vatNumber?: string | null;
  clientName?: string | null;
  currency: string;
  totalCents: number;
  dueDate?: string | null;
  notes?: string | null;
  lineItems: InvoicePreviewLineItem[];
  paymentProcessingFeeCents?: number;
  disabled?: boolean;
};

export function InvoiceVisualEditor({
  visualConfig,
  onVisualConfigChange,
  visualTemplates,
  onTemplatesChanged,
  businessName,
  logoUrl,
  address,
  phone,
  companyNumber,
  vatNumber,
  clientName,
  currency,
  totalCents,
  dueDate,
  notes,
  lineItems,
  paymentProcessingFeeCents = 0,
  disabled = false,
}: InvoiceVisualEditorProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [selectedSavedTemplate, setSelectedSavedTemplate] = useState("");

  const serializedConfig = useMemo(
    () => serializeInvoiceVisualConfig(visualConfig),
    [visualConfig]
  );

  const updateConfig = (patch: Partial<InvoiceVisualConfig>) => {
    onVisualConfigChange(normalizeInvoiceVisualConfig({ ...visualConfig, ...patch }));
  };

  const applyBaseDesign = (designKey: InvoiceDesignKey) => {
    onVisualConfigChange(getDefaultVisualConfig(designKey));
    setSelectedSavedTemplate("");
  };

  const handleSaveTemplate = async () => {
    setSavePending(true);
    const result = await createInvoiceVisualTemplate(templateName, visualConfig);
    setSavePending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Visual template saved");
    setSaveDialogOpen(false);
    setTemplateName("");
    onTemplatesChanged?.();
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-[#121821]/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Palette className="size-4" />
            Visual invoice editor
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Customize how the invoice looks on the payment page, PDF, and emails. Preview updates live.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setSaveDialogOpen(true)}
          className="border-white/10"
        >
          <Save className="mr-2 size-4" />
          Save visual template
        </Button>
      </div>

      <input type="hidden" name="invoiceDesignConfig" value={serializedConfig} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Base style</Label>
              <Select
                value={visualConfig.baseDesign}
                onValueChange={(value) => applyBaseDesign(normalizeInvoiceDesign(value))}
                disabled={disabled}
              >
                <SelectTrigger className="h-10 rounded-lg border-white/10 bg-[#121821]/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#121821] text-white">
                  {INVOICE_DESIGNS.map((design) => (
                    <SelectItem key={design.key} value={design.key}>
                      {design.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={visualConfig.accentColor}
                  onChange={(event) => updateConfig({ accentColor: event.target.value })}
                  disabled={disabled}
                  className="h-10 w-14 cursor-pointer border-white/10 bg-[#121821]/50 p-1"
                />
                <Input
                  value={visualConfig.accentColor}
                  onChange={(event) => updateConfig({ accentColor: event.target.value })}
                  disabled={disabled}
                  className="h-10 flex-1 rounded-lg border-white/10 bg-[#121821]/50 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Header style</Label>
              <Select
                value={visualConfig.headerStyle}
                onValueChange={(value) =>
                  updateConfig({
                    headerStyle:
                      value === "brand" || value === "dark" || value === "light"
                        ? value
                        : visualConfig.headerStyle,
                  })
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-10 rounded-lg border-white/10 bg-[#121821]/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#121821] text-white">
                  <SelectItem value="brand">Brand color</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pay button</Label>
              <Select
                value={visualConfig.buttonStyle}
                onValueChange={(value) =>
                  updateConfig({
                    buttonStyle: value === "outline" ? "outline" : "filled",
                  })
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-10 rounded-lg border-white/10 bg-[#121821]/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#121821] text-white">
                  <SelectItem value="filled">Filled</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={visualConfig.showLogo}
                onChange={(event) => updateConfig({ showLogo: event.target.checked })}
                disabled={disabled}
              />
              Show logo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={visualConfig.showBusinessDetails}
                onChange={(event) => updateConfig({ showBusinessDetails: event.target.checked })}
                disabled={disabled}
              />
              Show business details
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={visualConfig.showNotes}
                onChange={(event) => updateConfig({ showNotes: event.target.checked })}
                disabled={disabled}
              />
              Show notes
            </label>
          </div>

          <div className="space-y-2">
            <Label>Saved visual templates</Label>
            {visualTemplates.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedSavedTemplate}
                  onValueChange={(value) => {
                    const template = visualTemplates.find((item) => item.id === value);
                    if (template) {
                      onVisualConfigChange(normalizeInvoiceVisualConfig(template.config));
                      setSelectedSavedTemplate(value);
                      toast.success(`Applied "${template.name}"`);
                    }
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-10 min-w-[220px] rounded-lg border-white/10 bg-[#121821]/50">
                    <SelectValue placeholder="Apply saved template…" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#121821] text-white">
                    {visualTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                        {template.is_default ? " (default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No saved visual templates yet. Customize the design and click Save visual template.
              </p>
            )}

            {visualTemplates.length > 0 ? (
              <ul className="space-y-2">
                {visualTemplates.map((template) => (
                  <li
                    key={template.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#121821]/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {INVOICE_DESIGNS.find((design) => design.key === template.config.baseDesign)?.name}
                        {" · "}
                        {template.config.accentColor}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={async () => {
                        const result = await deleteInvoiceVisualTemplate(template.id);
                        if (result.error) toast.error(result.error);
                        else {
                          toast.success("Visual template deleted");
                          onTemplatesChanged?.();
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Live preview</Label>
          <InvoiceVisualPreview
            businessName={businessName}
            logoUrl={logoUrl}
            address={address}
            phone={phone}
            companyNumber={companyNumber}
            vatNumber={vatNumber}
            clientName={clientName}
            currency={currency}
            totalCents={totalCents}
            dueDate={dueDate}
            notes={notes}
            lineItems={lineItems}
            visualConfig={visualConfig}
            paymentProcessingFeeCents={paymentProcessingFeeCents}
            compact
          />
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save visual template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="visualTemplateName">Template name</Label>
            <Input
              id="visualTemplateName"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="e.g. Premium coaching invoice"
              disabled={savePending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveTemplate} disabled={savePending || !templateName.trim()}>
              {savePending ? "Saving…" : "Save template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
