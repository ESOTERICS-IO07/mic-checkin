/**
 * Google OAuth is prepared for a later phase. It must not replace
 * email/password as the working authentication path.
 */
export function isGoogleAuthEnabled() {
  return process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_ENABLED === "true";
}
