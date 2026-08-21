"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isGoogleAuthEnabled } from "@/lib/auth/oauth";

const initialState: AuthActionState = { error: null, notice: null };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const googleEnabled = isGoogleAuthEnabled();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Email and password authentication for attendees and organizers.
        </CardDescription>
      </CardHeader>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
          />
        </div>
        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={!googleEnabled}
        >
          Continue with Google
        </Button>
        {!googleEnabled ? (
          <p className="text-center text-xs text-zinc-500">
            Google sign-in is configured structurally and is not enabled.
          </p>
        ) : null}
        <p className="text-center text-sm text-zinc-600">
          Attendee?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 underline">
            Create an account
          </Link>
        </p>
      </form>
    </Card>
  );
}
