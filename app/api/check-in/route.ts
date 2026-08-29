import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

type CheckInRequest = {
    eventId?: unknown;
    tokenHash?: unknown;
};

export async function POST(request: Request) {
    try {
        const auth = await requireAuth();

        const body = (await request.json()) as CheckInRequest;

        if (
            typeof body.eventId !== "string" ||
            !body.eventId.trim() ||
            typeof body.tokenHash !== "string" ||
            !body.tokenHash.trim()
        ) {
            return NextResponse.json(
                { error: "Invalid check-in request." },
                { status: 400 },
            );
        }

        if (!/^[0-9a-fA-F]{64}$/.test(body.tokenHash)) {
            return NextResponse.json(
                { error: "Invalid token hash." },
                { status: 400 },
            );
        }

        const supabase = await createClient();

        if (auth.profile.role !== "ORGANIZER") {
            const { data: staffData } = await supabase
                .from("event_staff")
                .select("id")
                .eq("event_id", body.eventId)
                .eq("user_id", auth.user.id)
                .eq("role", "SCANNER")
                .maybeSingle();

            if (!staffData) {
                return NextResponse.json(
                    { error: "Forbidden: You are not assigned to scan for this event." },
                    { status: 403 }
                );
            }
        } else {
            const { data: eventData } = await supabase
                .from("events")
                .select("id")
                .eq("id", body.eventId)
                .eq("organizer_id", auth.user.id)
                .maybeSingle();

            if (!eventData) {
                return NextResponse.json(
                    { error: "Forbidden: You do not own this event." },
                    { status: 403 }
                );
            }
        }

        const tokenHash = `\\x${body.tokenHash.toLowerCase()}`;

        const { data, error } = await supabase.rpc("check_in_ticket", {
            p_event_id: body.eventId,
            p_token_hash: tokenHash,
        });

        if (error) {
            console.error("Check-in RPC failed:", error.message);

            return NextResponse.json(
                { error: "Check-in failed." },
                { status: 500 },
            );
        }

        return NextResponse.json({
            status: data,
        });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json(
            { error: "Unexpected server error." },
            { status: 500 },
        );
    }
}