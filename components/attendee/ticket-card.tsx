"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import type { RegistrationStatus } from "@/lib/supabase/database.types";

type TicketCardProps = {
  eventName: string;
  /** ISO 8601 datetime string */
  eventDate: string;
  /** First 8 chars of the registration UUID — display only */
  registrationIdPrefix: string;
  status: RegistrationStatus;
  /**
   * JSON-stringified TicketPayload: { v: 1, eventId, token }
   *
   * Present only immediately after a successful registration — the raw token
   * is never stored in the database, so historical registrations cannot
   * supply this value.
   */
  qrPayload?: string;
};

function StatusBadge({ status }: { status: RegistrationStatus }) {
  if (status === "checked_in") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-blue-800">
        Checked In
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-emerald-800">
      Registered
    </span>
  );
}

export function TicketCard({
  eventName,
  eventDate,
  registrationIdPrefix,
  status,
  qrPayload,
}: TicketCardProps) {
  const formattedDate = new Date(eventDate).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Card className="overflow-hidden p-0">
      {/* Header strip */}
      <div className="bg-zinc-900 px-5 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          MIC Check-In · Ticket
        </p>
        <h2 className="mt-1 text-lg font-bold leading-snug">{eventName}</h2>
        <p className="mt-0.5 text-sm text-zinc-300">{formattedDate}</p>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center gap-4 px-5 py-6">
        <StatusBadge status={status} />

        {/* QR code or unavailability notice */}
        {qrPayload ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="rounded-xl border border-zinc-100 bg-white p-3 shadow-sm"
              aria-label="Ticket QR code"
            >
              <QRCodeSVG
                value={qrPayload}
                size={240}
                level="M"
                marginSize={2}
              />
            </div>
            <p className="text-center text-sm font-medium text-zinc-600">
              Show this QR code at check-in.
            </p>
          </div>
        ) : (
          <div className="w-full rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
            <p className="text-sm text-zinc-500">
              QR code is only available immediately after registration.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Refresh the page after registering to see your ticket.
            </p>
          </div>
        )}

        {/* Divider + Registration ID */}
        <div className="w-full border-t border-dashed border-zinc-200 pt-4 text-center">
          <p className="text-xs uppercase tracking-widest text-zinc-400">
            Registration ID
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-700">
            {registrationIdPrefix}
          </p>
        </div>
      </div>
    </Card>
  );
}
