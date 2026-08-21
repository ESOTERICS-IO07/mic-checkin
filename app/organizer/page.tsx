import Link from "next/link";
import { AppHeader } from "@/components/auth/app-header";
import { ForbiddenState } from "@/components/auth/forbidden-state";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadRolePage } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { CreateEventForm } from "@/components/organizer/create-event-form";

export default async function OrganizerHomePage() {
  const { auth, forbidden } = await loadRolePage("ORGANIZER");

  if (forbidden) {
    return (
      <ForbiddenState requiredRole="ORGANIZER" actualRole={auth.profile.role} />
    );
  }

  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", auth.user.id)
    .order("starts_at", { ascending: true });

  return (
    <div className="min-h-full">
      <AppHeader auth={auth} />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Organizer Home</CardTitle>
            <CardDescription>
              Manage your events and track attendee capacities.
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

        {/* Event Creation Form */}
        <CreateEventForm />

        {/* Owned Events List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Events</h2>
          {error && (
            <p className="text-sm text-red-600">Failed to load events: {error.message}</p>
          )}
          {!error && (!events || events.length === 0) ? (
            <p className="text-sm text-zinc-500">No events created yet.</p>
          ) : (
            <div className="space-y-3">
              {events?.map((event) => {
                const remaining = event.capacity - event.registration_count;
                return (
                  <Card key={event.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-zinc-900">{event.name}</h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                        Cap: {event.capacity}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Starts: {new Date(event.starts_at).toLocaleString()}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 text-xs">
                      <div>
                        <span className="text-zinc-500">Registered:</span>{" "}
                        <span className="font-medium text-zinc-800">{event.registration_count}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Remaining:</span>{" "}
                        <span className="font-medium text-zinc-800">{remaining}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-500">
          <Link href="/attendee" className="underline">
            Open attendee route
          </Link>{" "}
          (server returns 403 for organizers)
        </p>
      </main>
    </div>
  );
}

