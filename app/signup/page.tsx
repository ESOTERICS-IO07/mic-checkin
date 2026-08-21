import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getAuthContext } from "@/lib/auth/require-role";

export default async function SignupPage() {
  const auth = await getAuthContext();
  if (auth) {
    redirect(auth.profile.role === "ORGANIZER" ? "/organizer" : "/attendee");
  }

  return (
    <main className="mx-auto flex min-h-full items-center justify-center px-4 py-12">
      <SignupForm />
    </main>
  );
}
