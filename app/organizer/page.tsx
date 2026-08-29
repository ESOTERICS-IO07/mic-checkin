import Link from "next/link";

import { AppHeader } from "@/components/auth/app-header";
import { ForbiddenState } from "@/components/auth/forbidden-state";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadRolePage } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { CreateEventForm } from "@/components/organizer/create-event-form";
import { EventCard } from "@/components/organizer/event-card";
import { StatCard } from "@/components/organizer/stat-card";

export default async function OrganizerHomePage() {
  const { auth, forbidden } = await loadRolePage("ORGANIZER");

  if (forbidden) {
    return (
      <ForbiddenState
        requiredRole="ORGANIZER"
        actualRole={auth.profile.role}
      />
    );
  }

  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", auth.user.id)
    .order("starts_at", { ascending: true });

  /*
   * The events query is enough to calculate the overview
   * metrics that Phase E1 needs.
   */
  const totalEvents = events?.length ?? 0;

  const totalCapacity =
    events?.reduce(
      (sum, event) => sum + event.capacity,
      0,
    ) ?? 0;

  const totalRegistered =
    events?.reduce(
      (sum, event) => sum + event.registration_count,
      0,
    ) ?? 0;

  return (
    <div className="min-h-full">
      <AppHeader auth={auth} />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* Organizer identity */}
        <Card>
          <CardHeader>
            <CardTitle>Organizer Dashboard</CardTitle>

            <CardDescription>
              Manage your events and monitor registrations.
            </CardDescription>
          </CardHeader>

          <div className="px-6 pb-6">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">
                  Email
                </dt>

                <dd>{auth.user.email}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">
                  Role
                </dt>

                <dd>{auth.profile.role}</dd>
              </div>
            </dl>
          </div>
        </Card>

        {/* Overview statistics */}
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold">
              Overview
            </h2>

            <p className="text-sm text-zinc-500">
              Your event activity at a glance.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Events"
              value={totalEvents}
              description="Events you organize"
            />

            <StatCard
              label="Capacity"
              value={totalCapacity}
              description="Total available seats"
            />

            <StatCard
              label="Registered"
              value={totalRegistered}
              description="Total registrations"
            />
          </div>
        </section>

        {/* Create event */}
        <CreateEventForm />

        {/* Events */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Your Events
            </h2>

            <p className="text-sm text-zinc-500">
              Manage registration and check-in for your events.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-red-600">
              Failed to load events: {error.message}
            </p>
          ) : null}

          {!error && (!events || events.length === 0) ? (
            <Card>
              <div className="p-8 text-center">
                <p className="font-medium text-zinc-900">
                  No events yet
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Create your first event above.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {events?.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                />
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-zinc-500">
          <Link
            href="/attendee"
            className="underline"
          >
            Open attendee route
          </Link>{" "}
          (server returns 403 for organizers)
        </p>
      </main>
    </div>
  );
}