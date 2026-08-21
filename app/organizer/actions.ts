"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validations/event";

export type EventActionState = {
  error: string | null;
  success: boolean;
};

export async function createEventAction(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  try {
    // Authenticate and require ORGANIZER role.
    await requireRole("ORGANIZER");

    // Validate form input.
    const parsed = eventSchema.safeParse({
      name: formData.get("name"),
      startsAt: formData.get("startsAt"),
      capacity: formData.get("capacity"),
    });

    if (!parsed.success) {
      const errorMsg = parsed.error.errors
        .map((e) => e.message)
        .join(", ");

      return {
        error: errorMsg,
        success: false,
      };
    }

    const supabase = await createClient();

    console.log("🔥 USING CREATE_EVENT RPC");
    // IMPORTANT:
    // organizer_id is NOT supplied by the client.
    // The database RPC derives it from auth.uid().
    const { error } = await supabase.rpc("create_event", {
      p_name: parsed.data.name,
      p_starts_at: new Date(parsed.data.startsAt).toISOString(),
      p_capacity: parsed.data.capacity,
    });

    if (error) {
      console.error("CREATE EVENT RPC ERROR:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      return {
        error: `${error.message} [${error.code ?? "NO_CODE"}]`,
        success: false,
      };
    }

    revalidatePath("/organizer");

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      error: "An unexpected error occurred",
      success: false,
    };
  }
}