"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "That password is not correct.");
      return;
    }
    router.refresh();
  }

  return (
    <form className="mx-auto grid max-w-sm gap-4" onSubmit={onSubmit}>
      <label htmlFor="password" className="text-sm font-semibold">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="rounded-md border border-line bg-transparent px-3 py-2.5"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "password-error" : undefined}
      />
      {error && (
        <p id="password-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-on disabled:opacity-60" disabled={pending}>
        {pending ? "Checking" : "Open registrations"}
      </button>
    </form>
  );
}
