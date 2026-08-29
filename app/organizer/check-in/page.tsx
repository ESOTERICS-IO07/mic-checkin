import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { QRScanner } from "@/components/organizer/qr-scanner";

type CheckInPageProps = {
    searchParams: Promise<{
        eventId?: string;
    }>;
};

export default async function CheckInPage({
    searchParams,
}: CheckInPageProps) {
    const auth = await requireAuth();
    const params = await searchParams;
    const eventId = params.eventId;

    const supabase = await createClient();

    if (!eventId) {
        return (
            <main className="mx-auto w-full max-w-2xl px-6 py-10">
                <div className="rounded-lg border bg-white p-6">
                    <h1 className="text-2xl font-bold">QR Check-in</h1>

                    <p className="mt-2 text-zinc-600">
                        Select an event before starting the scanner.
                    </p>

                    <Link
                        href="/organizer"
                        className="mt-6 inline-block font-medium underline"
                    >
                        ← Back to organizer
                    </Link>
                </div>
            </main>
        );
    }

    let hasAccess = false;
    let event = null;

    if (auth.profile.role === "ORGANIZER") {
        const { data, error } = await supabase
            .from("events")
            .select("id, name, starts_at, capacity, registration_count")
            .eq("id", eventId)
            .eq("organizer_id", auth.user.id)
            .maybeSingle();
        
        if (!error && data) {
            hasAccess = true;
            event = data;
        }
    } else {
        const { data: staffData } = await supabase
            .from("event_staff")
            .select("id")
            .eq("event_id", eventId)
            .eq("user_id", auth.user.id)
            .eq("role", "SCANNER")
            .maybeSingle();

        if (staffData) {
            hasAccess = true;
            const { data, error } = await supabase
                .from("events")
                .select("id, name, starts_at, capacity, registration_count")
                .eq("id", eventId)
                .maybeSingle();
            
            if (!error && data) {
                event = data;
            } else {
                hasAccess = false;
            }
        }
    }

    if (!hasAccess || !event) {
        return (
            <main className="mx-auto w-full max-w-2xl px-6 py-10">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                    <h1 className="text-xl font-bold text-red-800">
                        Event not found or access denied
                    </h1>

                    <p className="mt-2 text-red-700">
                        You can only check in attendees if you are the organizer or an assigned scanner.
                    </p>

                    <Link
                        href={auth.profile.role === "ORGANIZER" ? "/organizer" : "/scanner"}
                        className="mt-6 inline-block font-medium underline"
                    >
                        ← Back to dashboard
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-2xl px-6 py-10">
            <div className="mb-6">
                <Link
                    href={auth.profile.role === "ORGANIZER" ? "/organizer" : "/scanner"}
                    className="text-sm font-medium text-zinc-600 underline"
                >
                    ← Back to dashboard
                </Link>
            </div>

            <section className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                        Organizer check-in
                    </p>

                    <h1 className="mt-1 text-3xl font-bold">{event.name}</h1>

                    <p className="mt-2 text-zinc-600">
                        {new Date(event.starts_at).toLocaleString()}
                    </p>

                    <div className="mt-4 flex gap-6 text-sm text-zinc-600">
                        <span>
                            Registered:{" "}
                            <strong className="text-zinc-900">
                                {event.registration_count}
                            </strong>
                        </span>

                        <span>
                            Capacity:{" "}
                            <strong className="text-zinc-900">
                                {event.capacity}
                            </strong>
                        </span>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h2 className="mb-4 text-xl font-semibold">
                        Scan attendee ticket
                    </h2>

                    <p className="mb-5 text-sm text-zinc-600">
                        Ask the attendee to display their QR ticket and scan it with the
                        camera.
                    </p>

                    <QRScanner eventId={event.id} />
                </div>
            </section>
        </main>
    );
}