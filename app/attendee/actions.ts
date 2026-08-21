"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type RegisterActionState = {
  error: string | null;
  status: "success" | "already_registered" | "event_full" | "unauthorized" | "event_not_found" | null;
  rawToken: string | null;
};

export async function registerForEventAction(
  eventId: string,
): Promise<RegisterActionState> {
  try {
    // 1. Authenticate and require ATTENDEE role
    await requireRole("ATTENDEE");

    // 2. Generate cryptographically random token (32 bytes, base64url)
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const hashBuffer = crypto.createHash("sha256").update(rawToken).digest();
    const hashHex = "\\x" + hashBuffer.toString("hex");
    const prefix = rawToken.substring(0, 8);

    // 3. Call the atomic registration RPC on the database
    const supabase = await createClient();
    const { data: rpcStatus, error: rpcError } = await supabase.rpc(
      "register_for_event",
      {
        p_event_id: eventId,
        p_token_hash: hashHex,
        p_token_lookup_prefix: prefix,
      }
    );

    if (rpcError) {
      return { error: rpcError.message, status: null, rawToken: null };
    }

    const status = rpcStatus as RegisterActionState["status"];

    if (status === "success") {
      revalidatePath("/attendee");
      return { error: null, status, rawToken };
    } else {
      let errorMsg = "";
      if (status === "already_registered") {
        errorMsg = "You are already registered for this event.";
      } else if (status === "event_full") {
        errorMsg = "This event is at full capacity.";
      } else if (status === "event_not_found") {
        errorMsg = "The selected event was not found.";
      } else if (status === "unauthorized") {
        errorMsg = "You are not authorized to register for this event.";
      }
      return { error: errorMsg, status, rawToken: null };
    }
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message, status: null, rawToken: null };
    }
    return { error: "An unexpected error occurred", status: null, rawToken: null };
  }
}
