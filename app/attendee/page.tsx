import Link from "next/link";
import { AppHeader } from "@/components/auth/app-header";
import { ForbiddenState } from "@/components/auth/forbidden-state";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadRolePage } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { EventList } from "@/components/attendee/event-list";

export default async function AttendeeHomePage() {
  const { auth, forbidden } = await loadRolePage("ATTENDEE");

  if (forbidden) {
    return (
      <ForbiddenState requiredRole="ATTENDEE" actualRole={auth.profile.role} />
    );
  }

  const supabase = await createClient();

  // Fetch available events
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true });

  // Fetch current registrations of the logged-in attendee
  const { data: registrations, error: regsError } = await supabase
    .from("registrations")
    .select("event_id")
    .eq("attendee_id", auth.user.id);

  const registeredIds = registrations?.map((r) => r.event_id) || [];

  return (
    <div className="min-h-full">
      <AppHeader auth={auth} />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendee Home</CardTitle>
            <CardDescription>
              Discover and register for upcoming events.
            </CardDescription>
          </CardHeader>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Email</dt>
              <dd>{auth.user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Role</dt>
              <dd>{auth.profile.role}</dd>
            </div>
          </dl>
        </Card>

        {/* My Tickets shortcut */}
        <Link
          href="/attendee/tickets"
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm hover:bg-zinc-50 transition-colors"
        >
          <div>
            <p className="font-semibold text-zinc-900">My Tickets</p>
            <p className="mt-0.5 text-xs text-zinc-500">View your registrations</p>
          </div>
          <span className="text-zinc-400">→</span>
        </Link>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Available Events</h2>
          {eventsError && (
            <p className="text-sm text-red-600">Failed to load events: {eventsError.message}</p>
          )}
          {regsError && (
            <p className="text-sm text-amber-600">Failed to load registrations status.</p>
          )}
          {!eventsError && events && (
            <EventList events={events} initialRegisteredIds={registeredIds} />
          )}
        </div>
      </main>
    </div>
  );
}

