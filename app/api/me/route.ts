import { jsonAuthError, requireAuth } from "@/lib/auth/require-role";

export async function GET() {
  try {
    const auth = await requireAuth();
    return Response.json({
      user: auth.user,
      profile: auth.profile,
    });
  } catch (error) {
    return jsonAuthError(error);
  }
}
