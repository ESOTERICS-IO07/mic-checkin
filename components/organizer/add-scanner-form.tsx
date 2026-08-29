"use client";

import { useActionState } from "react";
import { addEventScannerAction } from "@/app/organizer/staff-actions";

const initialState = {
    error: null,
    success: false,
};

export function AddScannerForm({
    eventId,
}: {
    eventId: string;
}) {
    const [state, formAction, pending] = useActionState(
        addEventScannerAction,
        initialState,
    );

    return (
        <form action={formAction} className="space-y-3">
            <input
                type="hidden"
                name="eventId"
                value={eventId}
            />

            <div className="flex gap-2">
                <input
                    name="email"
                    type="email"
                    placeholder="scanner@email.com"
                    required
                    className="min-w-0 flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />

                <button
                    type="submit"
                    disabled={pending}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                    {pending ? "Adding..." : "Add Scanner"}
                </button>
            </div>

            {state.error ? (
                <p className="text-sm text-red-600" role="alert">
                    {state.error}
                </p>
            ) : null}

            {state.success ? (
                <p className="text-sm text-emerald-600" role="status">
                    Scanner added successfully.
                </p>
            ) : null}
        </form>
    );
}