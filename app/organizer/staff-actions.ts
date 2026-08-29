"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type StaffActionState = {
    error: string | null;
    success: boolean;
};

export async function addEventScannerAction(
    _prev: StaffActionState,
    formData: FormData,
): Promise<StaffActionState> {
    try {
        await requireRole("ORGANIZER");

        const eventId = formData.get("eventId");
        const email = formData.get("email");

        if (
            typeof eventId !== "string" ||
            !eventId
        ) {
            return {
                error: "Invalid event.",
                success: false,
            };
        }

        if (
            typeof email !== "string" ||
            !email.trim()
        ) {
            return {
                error: "Enter the scanner's email address.",
                success: false,
            };
        }

        const supabase = await createClient();

        const { data, error } = await supabase.rpc(
            "add_event_scanner",
            {
                p_event_id: eventId,
                p_email: email.trim(),
            },
        );

        if (error) {
            return {
                error: error.message,
                success: false,
            };
        }

        switch (data) {
            case "success":
                revalidatePath(`/organizer/events/${eventId}`);

                return {
                    error: null,
                    success: true,
                };

            case "user_not_found":
                return {
                    error:
                        "No account exists with that email. Ask the scanner to sign up first.",
                    success: false,
                };

            case "already_assigned":
                return {
                    error:
                        "This user is already assigned to the event.",
                    success: false,
                };

            case "cannot_assign_self":
                return {
                    error:
                        "You cannot assign yourself as a scanner.",
                    success: false,
                };

            case "event_not_found":
            case "forbidden":
                return {
                    error:
                        "Event not found or access denied.",
                    success: false,
                };

            case "unauthorized":
                return {
                    error: "Unauthorized.",
                    success: false,
                };

            default:
                return {
                    error: `Scanner assignment failed: ${data}`,
                    success: false,
                };
        }
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred.",
            success: false,
        };
    }
}