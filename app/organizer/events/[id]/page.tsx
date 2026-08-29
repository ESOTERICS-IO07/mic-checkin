import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/auth/app-header";
import { ForbiddenState } from "@/components/auth/forbidden-state";
import { Card } from "@/components/ui/card";
import { loadRolePage } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { AddScannerForm } from "@/components/organizer/add-scanner-form";

type EventDashboardPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EventDashboardPage({
    params,
}: EventDashboardPageProps) {
    const { auth, forbidden } = await loadRolePage("ORGANIZER");

    if (forbidden) {
        return (
            <ForbiddenState
                requiredRole="ORGANIZER"
                actualRole={auth.profile.role}
            />
        );
    }

    const { id } = await params;

    const supabase = await createClient();

    /*
     * IMPORTANT:
     * We filter by BOTH event ID and organizer ID.
     *
     * This prevents an organizer from accessing
     * another organizer's event simply by changing
     * the URL.
     */
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .eq("organizer_id", auth.user.id)
        .maybeSingle();

    if (eventError) {
        throw new Error(eventError.message);
    }

    if (!event) {
        notFound();
    }

    /*
     * Get registration information for this event.
     *
     * We only need status here. We don't expose
     * token_hash or any ticket secret.
     */
    const { data: registrations, error: registrationError } =
        await supabase
            .from("registrations")
            .select("id, status, created_at")
            .eq("event_id", event.id);

    if (registrationError) {
        throw new Error(registrationError.message);
    }

    const { data: staff, error: staffError } = await supabase
        .from("event_staff")
        .select("id, user_id, role, created_at")
        .eq("event_id", event.id);

    if (staffError) {
        throw new Error(staffError.message);
    }

    const totalRegistered = registrations?.length ?? 0;

    const checkedIn =
        registrations?.filter(
            (registration) => registration.status === "checked_in",
        ).length ?? 0;

    const remaining = Math.max(
        event.capacity - event.registration_count,
        0,
    );

    const registrationRate =
        event.capacity > 0
            ? Math.round(
                (event.registration_count / event.capacity) * 100,
            )
            : 0;

    const attendanceRate =
        totalRegistered > 0
            ? Math.round((checkedIn / totalRegistered) * 100)
            : 0;

    const isFull =
        event.registration_count >= event.capacity;

    return (
        <div className="min-h-full">
            <AppHeader auth={auth} />

            <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
                {/* Back navigation */}
                <Link
                    href="/organizer"
                    className="text-sm font-medium text-zinc-600 underline hover:text-zinc-900"
                >
                    ← Back to organizer
                </Link>

                {/* Event header */}
                <Card className="p-6">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Event Dashboard
                                </p>

                                <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
                                    {event.name}
                                </h1>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {new Date(event.starts_at).toLocaleString()}
                                </p>
                            </div>

                            <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${isFull
                                        ? "bg-red-100 text-red-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                            >
                                {isFull ? "FULL" : "REGISTRATION OPEN"}
                            </span>
                        </div>

                        <div className="flex gap-3 border-t border-zinc-100 pt-4">
                            <Link
                                href={`/organizer/events/${event.id}/check-in`}
                                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                            >
                                Open Check-in
                            </Link>
                        </div>
                    </div>
                </Card>

                {/* Main statistics */}
                <section>
                    <h2 className="mb-3 text-lg font-semibold">
                        Event Overview
                    </h2>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="p-5">
                            <p className="text-sm text-zinc-500">
                                Capacity
                            </p>

                            <p className="mt-2 text-3xl font-semibold">
                                {event.capacity}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                                Maximum attendees
                            </p>
                        </Card>

                        <Card className="p-5">
                            <p className="text-sm text-zinc-500">
                                Registered
                            </p>

                            <p className="mt-2 text-3xl font-semibold">
                                {event.registration_count}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                                {registrationRate}% of capacity
                            </p>
                        </Card>

                        <Card className="p-5">
                            <p className="text-sm text-zinc-500">
                                Remaining
                            </p>

                            <p className="mt-2 text-3xl font-semibold">
                                {remaining}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                                Available spots
                            </p>
                        </Card>

                        <Card className="p-5">
                            <p className="text-sm text-zinc-500">
                                Checked In
                            </p>

                            <p className="mt-2 text-3xl font-semibold">
                                {checkedIn}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                                {attendanceRate}% attendance
                            </p>
                        </Card>
                    </div>
                </section>

                {/* Registration progress */}
                <Card className="p-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    Registration
                                </h2>

                                <p className="text-sm text-zinc-500">
                                    Event capacity utilization
                                </p>
                            </div>

                            <p className="font-medium">
                                {event.registration_count} / {event.capacity}
                            </p>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                            <div
                                className="h-full rounded-full bg-zinc-900"
                                style={{
                                    width: `${Math.min(registrationRate, 100)}%`,
                                }}
                            />
                        </div>

                        <p className="text-xs text-zinc-500">
                            {remaining === 0
                                ? "This event has reached capacity."
                                : `${remaining} spot${remaining === 1 ? "" : "s"
                                } remaining.`}
                        </p>
                    </div>
                </Card>

                {/* Event Staff */}
                <Card className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="font-semibold">Event Staff</h2>
                            <p className="text-sm text-zinc-500">
                                Manage volunteers who can scan tickets for this event.
                            </p>
                        </div>

                        <AddScannerForm eventId={event.id} />

                        <div className="mt-6 border-t border-zinc-100 pt-6">
                            <h3 className="mb-3 text-sm font-medium text-zinc-900">
                                Assigned Scanners
                            </h3>
                            {staff && staff.length > 0 ? (
                                <ul className="space-y-3">
                                    {staff.map((s) => (
                                        <li
                                            key={s.id}
                                            className="flex flex-col gap-2 rounded-md bg-zinc-50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="font-medium text-zinc-900">
                                                    Scanner assigned
                                                </p>
                                                <p className="text-xs text-zinc-500 break-all">
                                                    ID: {s.user_id}
                                                </p>
                                            </div>
                                            <span className="self-start rounded-full bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 sm:self-auto">
                                                {s.role}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-zinc-500">
                                    No scanners assigned yet.
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Attendance */}
                <Card className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="font-semibold">
                                Attendance
                            </h2>

                            <p className="text-sm text-zinc-500">
                                Check-in progress for registered attendees
                            </p>
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-4xl font-semibold">
                                    {attendanceRate}%
                                </p>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {checkedIn} of {totalRegistered} checked in
                                </p>
                            </div>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                            <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{
                                    width: `${Math.min(attendanceRate, 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Registration breakdown */}
                <Card className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="font-semibold">
                                Registration Status
                            </h2>

                            <p className="text-sm text-zinc-500">
                                Current attendee ticket states
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg bg-zinc-50 p-4">
                                <p className="text-sm text-zinc-500">
                                    Registered
                                </p>

                                <p className="mt-1 text-2xl font-semibold">
                                    {totalRegistered - checkedIn}
                                </p>

                                <p className="text-xs text-zinc-500">
                                    Awaiting check-in
                                </p>
                            </div>

                            <div className="rounded-lg bg-emerald-50 p-4">
                                <p className="text-sm text-emerald-700">
                                    Checked In
                                </p>

                                <p className="mt-1 text-2xl font-semibold text-emerald-900">
                                    {checkedIn}
                                </p>

                                <p className="text-xs text-emerald-700">
                                    Successfully checked in
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
}