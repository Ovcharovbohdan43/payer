import { LiveActivityFeed } from "@/components/admin/live-activity-feed";

export default function AdminActivityPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Live activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time feed of page views, sign-ins, checkouts, and admin actions
        </p>
      </div>
      <LiveActivityFeed pollMs={5000} />
    </div>
  );
}
