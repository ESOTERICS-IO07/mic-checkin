import Link from "next/link";
import { AppHeader } from "@/components/auth/app-header";
import { requireAuth } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function ScannerDashboardPage() {
    const auth = await requireAuth();
    const supabase = await createClient();

    const { data: assignments, error } = await supabase
        .from("event_staff")
        .select("event_id, role")
        .eq("user_id", auth.user.id)
        .eq("role", "SCANNER");

    if (error) {
        throw new Error(error.message);
    }

    let scannerEvents: { id: string; name: string; starts_at: string; capacity: number; registration_count: number }[] = [];
    
    if (assignments && assignments.length > 0) {
        const eventIds = assignments.map((a) => a.event_id);
        const { data: events, error: eventsError } = await supabase
            .from("events")
            .select("id, name, starts_at, capacity, registration_count")
            .in("id", eventIds);
            
        if (eventsError) {
            throw new Error(eventsError.message);
        }
        
        scannerEvents = events ?? [];
    }

    return (
        <div className="min-h-full">
            <AppHeader auth={auth} />

            <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
                <div>
                    <h1 className="text-2xl font-bold">Scanner Dashboard</h1>
                    <p className="mt-1 text-zinc-600">
                        Events you&apos;re assigned to check in attendees.
                    </p>
                </div>

                {scannerEvents.length === 0 ? (
                    <Card className="p-10 text-center">
                        <h2 className="text-lg font-medium">
                            No scanner assignments yet.
                        </h2>
                        <p className="mt-2 text-zinc-500">
                            Ask an organizer to assign you to an event.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {scannerEvents.map((event) => {
                            const remaining = Math.max(
                                event.capacity - event.registration_count,
                                0
                            );
                            
                            return (
                                <Card key={event.id} className="p-6 flex flex-col">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg">{event.name}</h3>
                                            <p className="text-sm text-zinc-500">
                                                {new Date(event.starts_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700">
                                            SCANNER
                                        </span>
                                    </div>
                                    
                                    <div className="mb-6 grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-zinc-500">Registered</p>
                                            <p className="font-medium">{event.registration_count}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Capacity</p>
                                            <p className="font-medium">{event.capacity}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Remaining</p>
                                            <p className="font-medium">{remaining}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto pt-4 border-t border-zinc-100">
                                        <Link
                                            href={`/organizer/check-in?eventId=${event.id}`}
                                            className="block w-full rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800"
                                        >
                                            Open Check-in
                                        </Link>
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
