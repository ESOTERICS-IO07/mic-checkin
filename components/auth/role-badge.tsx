import type { UserRole } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        role === "ORGANIZER"
          ? "bg-amber-100 text-amber-900"
          : "bg-sky-100 text-sky-900",
      )}
    >
      {role}
    </span>
  );
}
