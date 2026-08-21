"use client";

import { useState, useTransition } from "react";
import { registerForEventAction } from "@/app/attendee/actions";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export function EventList({ events, initialRegisteredIds }: EventListProps) {
  const [registeredIds, setRegisteredIds] = useState<string[]>(initialRegisteredIds);
  const [ticketToken, setTicketToken] = useState<{ eventName: string; token: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const handleRegister = (eventId: string, eventName: string) => {
    setErrorMsg(null);
    setActiveEventId(eventId);
    startTransition(async () => {
      const res = await registerForEventAction(eventId);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.status === "success" && res.rawToken) {
        setRegisteredIds((prev) => [...prev, eventId]);
        setTicketToken({ eventName, token: res.rawToken });
      }
      setActiveEventId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Ticket / Token Display */}
      {ticketToken && (
        <Card className="border-emerald-200 bg-emerald-50 text-emerald-950 p-4 space-y-2">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-emerald-900 text-base">Registration Confirmed!</CardTitle>
            <CardDescription className="text-emerald-700">
              Save your QR code token. It will not be shown again.
            </CardDescription>
          </CardHeader>
          <div className="bg-white border border-emerald-100 p-3 rounded font-mono text-xs break-all select-all">
            mic:{ticketToken.token}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
            onClick={() => setTicketToken(null)}
          >
            Dismiss
          </Button>
        </Card>
      )}

      {errorMsg && (
        <div className="p-3 text-xs bg-red-50 text-red-700 rounded border border-red-200" role="alert">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">No events are available at this time.</p>
        ) : (
          events.map((event) => {
            const isRegistered = registeredIds.includes(event.id);
            const remaining = event.capacity - event.registration_count;
            const isFull = remaining <= 0;
            const registeringThis = isPending && activeEventId === event.id;

            return (
              <Card key={event.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-zinc-900">{event.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Starts: {new Date(event.starts_at).toLocaleString()}
                    </p>
                  </div>
                  {isRegistered && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Registered
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-xs">
                  <div>
                    <span className="text-zinc-500">Capacity:</span>{" "}
                    <span className="font-medium text-zinc-800">{event.capacity}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Registered:</span>{" "}
                    <span className="font-medium text-zinc-800">{event.registration_count}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Remaining:</span>{" "}
                    <span className={`font-semibold ${isFull ? "text-red-600" : "text-zinc-800"}`}>
                      {isFull ? "Full" : remaining}
                    </span>
                  </div>
                </div>

                {!isRegistered && (
                  <Button
                    className="w-full mt-2"
                    disabled={isPending || isFull}
                    onClick={() => handleRegister(event.id, event.name)}
                  >
                    {registeringThis ? "Registering..." : isFull ? "Event Full" : "Register"}
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
