import { RoleBadge } from "@/components/auth/role-badge";
import type { UserRole } from "@/lib/supabase/database.types";

export function ForbiddenState({
  requiredRole,
  actualRole,
}: {
  requiredRole: UserRole;
  actualRole: UserRole;
}) {
  const home = actualRole === "ORGANIZER" ? "/organizer" : "/attendee";

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">403 Forbidden</h1>
      <p className="text-sm text-zinc-600">
        This route requires the <RoleBadge role={requiredRole} /> role. Your
        account is <RoleBadge role={actualRole} />. Authorization is enforced
        on the server, not by hiding UI.
      </p>
      <a href={home} className="text-sm font-medium underline">
        Go to your home
      </a>
    </main>
  );
}
