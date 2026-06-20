import {
  ArrowUpRight,
  Check,
  CreditCard,
  Plus,
  QrCode,
  Search,
  Users,
} from 'lucide-react'

function Bar({ w, c = 'bg-white/10' }: { w: string; c?: string }) {
  return <div className={`h-2 rounded-full ${c}`} style={{ width: w }} />
}

/* ---------------------------------- Shell --------------------------------- */

function ScreenShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col bg-[#0e131b]">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="ml-3 truncate text-xs font-medium text-white/40">
          {title}
        </span>
      </div>
      <div className="flex-1 overflow-hidden p-4 sm:p-5">{children}</div>
    </div>
  )
}

/* -------------------------------- Dashboard ------------------------------- */

export function DashboardScreen() {
  return (
    <ScreenShell title="puyer.org/dashboard">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Good afternoon, Alex</p>
          <p className="text-xs text-white/40">Here&apos;s your week</p>
        </div>
        <div className="flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-medium text-primary-foreground">
          <Plus className="h-3.5 w-3.5" /> New invoice
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Paid', value: '£4,280', tone: 'text-emerald-400' },
          { label: 'Pending', value: '£1,150', tone: 'text-amber' },
          { label: 'Overdue', value: '£320', tone: 'text-white' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/5 bg-white/[0.03] p-3"
          >
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              {s.label}
            </p>
            <p className={`mt-1 text-base font-semibold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-white/70">Recent invoices</p>
          <ArrowUpRight className="h-3.5 w-3.5 text-white/30" />
        </div>
        <div className="mt-3 space-y-3">
          {[
            { n: 'Maple Café', a: '£640', s: 'Paid', c: 'text-emerald-400' },
            { n: 'J. Whitfield', a: '£220', s: 'Viewed', c: 'text-brand' },
            { n: 'Oak & Co.', a: '£1,150', s: 'Sent', c: 'text-white/50' },
          ].map((r) => (
            <div key={r.n} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-[10px] font-semibold text-brand">
                  {r.n.slice(0, 2)}
                </span>
                <span className="text-xs text-white/80">{r.n}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-medium ${r.c}`}>{r.s}</span>
                <span className="text-xs font-semibold text-white">{r.a}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  )
}

/* --------------------------------- Offers --------------------------------- */

export function OffersScreen() {
  return (
    <ScreenShell title="puyer.org/offers">
      <p className="text-sm font-semibold text-white">Offers</p>
      <p className="text-xs text-white/40">Reusable service packages</p>
      <div className="mt-4 space-y-3">
        {[
          { n: 'Boiler service', p: '£90', d: 'Annual inspection + report' },
          { n: 'Logo & brand kit', p: '£450', d: 'Logo, palette, guidelines' },
          { n: 'Deep clean', p: '£140', d: '3-bed home, 4 hours' },
        ].map((o) => (
          <div
            key={o.n}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3"
          >
            <div>
              <p className="text-xs font-medium text-white">{o.n}</p>
              <p className="text-[10px] text-white/40">{o.d}</p>
            </div>
            <span className="rounded-md bg-brand/15 px-2 py-1 text-xs font-semibold text-brand">
              {o.p}
            </span>
          </div>
        ))}
      </div>
    </ScreenShell>
  )
}

/* --------------------------------- Clients -------------------------------- */

export function ClientsScreen() {
  return (
    <ScreenShell title="puyer.org/clients">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Clients</p>
        <Users className="h-4 w-4 text-white/30" />
      </div>
      <div className="mt-3 flex h-8 items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3">
        <Search className="h-3.5 w-3.5 text-white/30" />
        <span className="text-xs text-white/30">Search clients…</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {[
          { n: 'Maple Café', e: 'hello@maple.co', t: '£3,240' },
          { n: 'James Whitfield', e: 'james@wf.com', t: '£880' },
          { n: 'Oak & Co.', e: 'accounts@oak.co', t: '£5,100' },
          { n: 'Rivera Studio', e: 'studio@rivera.io', t: '£2,000' },
        ].map((c) => (
          <div
            key={c.n}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/70">
                {c.n.slice(0, 1)}
              </span>
              <div>
                <p className="text-xs text-white/85">{c.n}</p>
                <p className="text-[10px] text-white/40">{c.e}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-white/80">{c.t}</span>
          </div>
        ))}
      </div>
    </ScreenShell>
  )
}

/* ----------------------------- Create invoice ----------------------------- */

export function CreateInvoiceScreen() {
  return (
    <ScreenShell title="puyer.org/invoices/new">
      <p className="text-sm font-semibold text-white">New invoice</p>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            Client
          </p>
          <p className="mt-1 text-xs font-medium text-white">Maple Café</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/80">Boiler service</span>
            <span className="text-xs font-semibold text-white">£90.00</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-xs text-white/80">Parts &amp; labour</span>
            <span className="text-xs font-semibold text-white">£45.00</span>
          </div>
          <div className="mt-2.5 border-t border-white/5 pt-2.5">
            <Bar w="40%" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <span className="text-xs text-white/50">VAT (20%)</span>
          <span className="text-xs text-white/80">£27.00</span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-brand/30 bg-brand/10 p-3">
          <span className="text-xs font-medium text-white">Total due</span>
          <span className="text-sm font-bold text-white">£162.00</span>
        </div>

        <div className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand text-xs font-semibold text-primary-foreground">
          <Check className="h-3.5 w-3.5" /> Create &amp; send link
        </div>
      </div>
    </ScreenShell>
  )
}

/* ------------------------------ Payment page ------------------------------ */

export function PaymentScreen() {
  return (
    <ScreenShell title="pay.puyer.org/inv_8f2a">
      <div className="flex flex-col items-center text-center">
        <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
          Invoice #INV-1042
        </span>
        <p className="mt-3 text-2xl font-bold text-white">£162.00</p>
        <p className="text-xs text-white/40">Maple Café · Due in 7 days</p>

        <div className="mt-4 flex h-24 w-24 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
          <QrCode className="h-14 w-14 text-white/70" />
        </div>
        <p className="mt-2 text-[10px] text-white/40">Scan to pay on mobile</p>

        <div className="mt-4 flex w-full flex-col gap-2">
          <div className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand text-xs font-semibold text-primary-foreground">
            <CreditCard className="h-3.5 w-3.5" /> Pay with card
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Klarna', 'Clearpay', 'Zilch'].map((m) => (
              <div
                key={m}
                className="flex h-8 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-[10px] font-medium text-white/60"
              >
                {m}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[10px] text-white/30">Powered by Stripe</p>
      </div>
    </ScreenShell>
  )
}

export const PRODUCT_SCREENS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'See paid, pending and overdue at a glance.',
    Screen: DashboardScreen,
  },
  {
    id: 'offers',
    label: 'Offers',
    description: 'Save reusable service packages for one-tap invoices.',
    Screen: OffersScreen,
  },
  {
    id: 'clients',
    label: 'Clients',
    description: 'Every client, contact and lifetime value in one place.',
    Screen: ClientsScreen,
  },
  {
    id: 'create',
    label: 'Create invoice',
    description: 'Line items, VAT and due dates in seconds.',
    Screen: CreateInvoiceScreen,
  },
  {
    id: 'payment',
    label: 'Payment page',
    description: 'Card, Klarna, Clearpay, Zilch and a scannable QR code.',
    Screen: PaymentScreen,
  },
] as const
