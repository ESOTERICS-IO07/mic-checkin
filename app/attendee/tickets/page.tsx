import Link from "next/link";
import { AppHeader } from "@/components/auth/app-header";
import { ForbiddenState } from "@/components/auth/forbidden-state";
import { Card } from "@/components/ui/card";
import { loadRolePage } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type { RegistrationStatus } from "@/lib/supabase/database.types";

type RegistrationRow = {
  id: string;
  status: RegistrationStatus;
  created_at: string;
  event: {
    id: string;
    name: string;
    starts_at: string;
  } | null;
};

function StatusBadge({ status }: { status: RegistrationStatus }) {
  if (status === "checked_in") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-blue-800">
        Checked In
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-emerald-800">
      Registered
    </span>
  );
}

export default async function MyTicketsPage() {
  const { auth, forbidden } = await loadRolePage("ATTENDEE");

  if (forbidden) {
    return (
      <ForbiddenState requiredRole="ATTENDEE" actualRole={auth.profile.role} />
    );
  }

  const supabase = await createClient();

  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("id, status, created_at, event:events(id, name, starts_at)")
    .eq("attendee_id", auth.user.id)
    .order("created_at", { ascending: false })
    .returns<RegistrationRow[]>();

  return (
    <div className="min-h-full">
      <AppHeader auth={auth} />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {/* Back nav */}
        <Link
          href="/attendee"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← Back to events
        </Link>

        <div>
          <h1 className="text-xl font-bold text-zinc-900">My Tickets</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your event registrations. QR codes are only shown immediately after
            registering.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600">
            Failed to load registrations: {error.message}
          </p>
        )}

        {registrations && registrations.length === 0 && (
          <Card className="py-10 text-center text-sm text-zinc-500">
            You have not registered for any events yet.{" "}
            <Link href="/attendee" className="underline">
              Browse events
            </Link>
            .
          </Card>
        )}

        {registrations && registrations.length > 0 && (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const eventName = reg.event?.name ?? "Unknown event";
              const eventDate = reg.event?.starts_at
                ? new Date(reg.event.starts_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—";

              return (
                <Card key={reg.id} className="overflow-hidden p-0">
                  {/* Header */}
                  <div className="bg-zinc-900 px-5 py-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                      MIC Check-In · Ticket
                    </p>
                    <h2 className="mt-1 text-base font-bold leading-snug">
                      {eventName}
                    </h2>
                    <p className="mt-0.5 text-sm text-zinc-300">{eventDate}</p>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col items-center gap-4 px-5 py-5">
                    <StatusBadge status={reg.status} />

                    {/* QR unavailable notice */}
                    <div className="w-full rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-center">
                      <p className="text-sm text-zinc-500">
                        QR code is only available immediately after
                        registration.
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Return to{" "}
                        <Link href="/attendee" className="underline">
                          events
                        </Link>{" "}
                        and register again to obtain a new ticket.
                      </p>
                    </div>

                    {/* Registration ID */}
                    <div className="w-full border-t border-dashed border-zinc-200 pt-3 text-center">
                      <p className="text-xs uppercase tracking-widest text-zinc-400">
                        Registration ID
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-zinc-700">
                        {reg.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
