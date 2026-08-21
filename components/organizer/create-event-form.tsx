"use client";

import { useActionState, useEffect, useRef } from "react";
import { createEventAction, type EventActionState } from "@/app/organizer/actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: EventActionState = { error: null, success: false };

export function CreateEventForm() {
  const [state, formAction, pending] = useActionState(createEventAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state.success]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Event</CardTitle>
        <CardDescription>
          Add a new event. The organizer ID is securely set on the server.
        </CardDescription>
      </CardHeader>
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Event Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. MIC Annual Hackathon"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startsAt">Start Date & Time</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            required
            placeholder="e.g. 100"
          />
        </div>
        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-600" role="status">
            Event created successfully!
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating..." : "Create Event"}
        </Button>
      </form>
    </Card>
  );
}
