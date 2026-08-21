import type { AuthContext } from "@/lib/auth/require-role";
import { RoleBadge } from "@/components/auth/role-badge";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function AppHeader({ auth }: { auth: AuthContext }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">MIC Check-in</p>
        <p className="truncate text-xs text-zinc-500">
          {auth.profile.display_name ?? auth.user.email}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <RoleBadge role={auth.profile.role} />
        <SignOutButton />
      </div>
    </header>
  );
}
