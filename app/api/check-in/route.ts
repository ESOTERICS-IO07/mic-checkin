import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

type CheckInRequest = {
    eventId?: unknown;
    tokenHash?: unknown;
};

export async function POST(request: Request) {
    try {
        await requireRole("ORGANIZER");

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