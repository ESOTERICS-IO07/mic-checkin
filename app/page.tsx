import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/require-role";

export default async function HomePage() {
  const auth = await getAuthContext();

  if (auth?.profile.role === "ORGANIZER") {
    redirect("/organizer");
  }

  if (auth?.profile.role === "ATTENDEE") {
    redirect("/attendee");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">MIC Check-in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Event registration and QR check-in. Sign in with your role; organizer
          signup is not public.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium"
        >
          Attendee signup
        </Link>
      </div>
    </main>
  );
}
