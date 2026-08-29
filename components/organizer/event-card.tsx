import Link from "next/link";
import { Card } from "@/components/ui/card";

type OrganizerEvent = {
    id: string;
    name: string;
    starts_at: string;
    capacity: number;
    registration_count: number;
};

type EventCardProps = {
    event: OrganizerEvent;
};

export function EventCard({ event }: EventCardProps) {
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

    const progressWidth = Math.min(registrationRate, 100);

    return (
        <Card className="p-5">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-zinc-900">
                            {event.name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                            {new Date(event.starts_at).toLocaleString()}
                        </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        {event.capacity} capacity
                    </span>
                </div>

                {/* Registration progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">
                            Registration
                        </span>

                        <span className="font-medium text-zinc-700">
                            {event.registration_count} / {event.capacity}
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div
                            className="h-full rounded-full bg-zinc-900 transition-all"
                            style={{ width: `${progressWidth}%` }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4">
                    <div>
                        <p className="text-xs text-zinc-500">
                            Registered
                        </p>

                        <p className="mt-1 font-medium text-zinc-900">
                            {event.registration_count}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-zinc-500">
                            Remaining
                        </p>

                        <p className="mt-1 font-medium text-zinc-900">
                            {remaining}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-zinc-100 pt-4">
                    <Link
                        href={`/organizer/check-in?eventId=${event.id}`}
                        className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800"
                    >
                        Open Check-in
                    </Link>

                    <Link
                        href={`/organizer/events/${event.id}`}
                        className="flex-1 rounded-md border border-zinc-200 px-4 py-2 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                        Dashboard
                    </Link>
                </div>
            </div>
        </Card>
    );
}