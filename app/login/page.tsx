import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthContext } from "@/lib/auth/require-role";
import { safeInternalPath } from "@/lib/auth/safe-path";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const auth = await getAuthContext();
  if (auth?.profile.role === "ORGANIZER") {
    redirect("/organizer");
  }
  if (auth?.profile.role === "ATTENDEE") {
    redirect("/attendee");
  }

  const params = await searchParams;
  const nextPath = safeInternalPath(params.next);

  return (
    <main className="mx-auto flex min-h-full items-center justify-center px-4 py-12">
      <LoginForm nextPath={nextPath} />
    </main>
  );
}
