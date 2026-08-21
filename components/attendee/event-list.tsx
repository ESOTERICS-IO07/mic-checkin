"use client";

import { useState, useTransition } from "react";
import { registerForEventAction } from "@/app/attendee/actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/attendee/ticket-card";
import type { TicketPayload } from "@/lib/types/ticket";

type Event = {
  id: string;
  name: string;
  starts_at: string;
  capacity: number;
  registration_count: number;
};

type EventListProps = {
  events: Event[];
  initialRegisteredIds: string[];
};

type ActiveTicket = {
  eventId: string;
  eventName: string;
  eventDate: string;
  /** JSON.stringify(TicketPayload) — raw token only available post-registration */
  qrPayload: string;
};

export function EventList({ events, initialRegisteredIds }: EventListProps) {
  const [registeredIds, setRegisteredIds] = useState<string[]>(initialRegisteredIds);
  const [activeTicket, setActiveTicket] = useState<ActiveTicket | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const handleRegister = (event: Event) => {
    setErrorMsg(null);
    setActiveEventId(event.id);
    startTransition(async () => {
      const res = await registerForEventAction(event.id);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.status === "success" && res.rawToken) {
        const payload: TicketPayload = {
          v: 1,
          eventId: event.id,
          token: res.rawToken,
        };
        setRegisteredIds((prev) => [...prev, event.id]);
        setActiveTicket({
          eventId: event.id,
          eventName: event.name,
          eventDate: event.starts_at,
          qrPayload: JSON.stringify(payload),
        });
      }
      setActiveEventId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Registration confirmed — ticket + QR */}
      {activeTicket && (
        <div className="space-y-2">
          <Card className="border-emerald-200 bg-emerald-50 px-4 py-3">
            <CardHeader className="p-0">
              <CardTitle className="text-base text-emerald-900">
                Registration confirmed ✓
              </CardTitle>
            </CardHeader>
          </Card>

          <TicketCard
            eventName={activeTicket.eventName}
            eventDate={activeTicket.eventDate}
            registrationIdPrefix={activeTicket.eventId.substring(0, 8)}
            status="registered"
            qrPayload={activeTicket.qrPayload}
          />

          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => setActiveTicket(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {errorMsg && (
        <div
          className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          role="alert"
        >
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            No events are available at this time.
          </p>
        ) : (
          events.map((event) => {
            const isRegistered = registeredIds.includes(event.id);
            const remaining = event.capacity - event.registration_count;
            const isFull = remaining <= 0;
            const registeringThis = isPending && activeEventId === event.id;

            return (
              <Card key={event.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900">{event.name}</h3>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Starts:{" "}
                      {new Date(event.starts_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  {isRegistered && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      Registered
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-2 text-xs">
                  <div>
                    <span className="text-zinc-500">Capacity:</span>{" "}
                    <span className="font-medium text-zinc-800">
                      {event.capacity}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Registered:</span>{" "}
                    <span className="font-medium text-zinc-800">
                      {event.registration_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Remaining:</span>{" "}
                    <span
                      className={`font-semibold ${isFull ? "text-red-600" : "text-zinc-800"}`}
                    >
                      {isFull ? "Full" : remaining}
                    </span>
                  </div>
                </div>

                {!isRegistered && (
                  <Button
                    className="mt-2 w-full"
                    disabled={isPending || isFull}
                    onClick={() => handleRegister(event)}
                  >
                    {registeringThis
                      ? "Registering…"
                      : isFull
                        ? "Event Full"
                        : "Register"}
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
