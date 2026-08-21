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

        <p className="text-center text-xs text-zinc-500">
          <Link href="/organizer" className="underline">
            Open organizer route
          </Link>{" "}
          (server returns 403 for attendees)
        </p>
      </main>
    </div>
  );
}

