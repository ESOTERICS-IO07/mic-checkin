import type { AuthContext } from "@/lib/auth/require-role";
import { RoleBadge } from "@/components/auth/role-badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function AppHeader({ auth }: { auth: AuthContext }) {
  const supabase = await createClient();
  const { data: staffData } = await supabase
    .from("event_staff")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("role", "SCANNER")
    .limit(1);

  const isScanner = staffData && staffData.length > 0;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">MIC Check-in</p>
          <p className="truncate text-xs text-zinc-500">
            {auth.profile.display_name ?? auth.user.email}
          </p>
        </div>
        
        {isScanner && (
          <Link
            href="/scanner"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 hidden sm:block"
          >
            Scanner Dashboard
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isScanner && (
          <Link
            href="/scanner"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:hidden mr-2"
          >
            Scanner
          </Link>
        )}
        <RoleBadge role={auth.profile.role} />
        <SignOutButton />
      </div>
    </header>
  );
}
