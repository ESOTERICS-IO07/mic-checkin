import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/database.types";
import { trySupabasePublicEnv } from "@/lib/env";

export class AuthError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export type AuthContext = {
  user: { id: string; email: string | undefined };
  profile: {
    id: string;
    role: UserRole;
    display_name: string | null;
  };
};

export async function getAuthContext(): Promise<AuthContext | null> {
  if (!trySupabasePublicEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return {
    user: { id: user.id, email: user.email },
    profile,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new AuthError(401, "Unauthorized");
  }
  return ctx;
}

export async function requireRole(role: UserRole): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (ctx.profile.role !== role) {
    throw new AuthError(403, "Forbidden");
  }
  return ctx;
}

export async function requireAuthPage(): Promise<AuthContext> {
  try {
    return await requireAuth();
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }
}

export async function requireRolePage(role: UserRole): Promise<AuthContext> {
  try {
    return await requireRole(role);
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }
}

export function jsonAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json(
      {
        error: error.message,
        code: error.status === 401 ? "unauthorized" : "forbidden",
      },
      { status: error.status },
    );
  }
  throw error;
}

export async function loadRolePage(role: UserRole): Promise<{
  auth: AuthContext;
  forbidden: boolean;
}> {
  try {
    return { auth: await requireRolePage(role), forbidden: false };
  } catch (error) {
    if (error instanceof AuthError && error.status === 403) {
      const ctx = await getAuthContext();
      if (!ctx) {
        redirect("/login");
      }
      return { auth: ctx, forbidden: true };
    }
    throw error;
  }
}
