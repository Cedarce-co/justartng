"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { HEARD_ABOUT, registerSchema, type RegisterInput } from "@/lib/validation";

type Success = { emailSent: boolean; calendarUrl: string | null };

export function RegisterForm({
  eventSlug,
  maxGuests,
}: {
  eventSlug: string;
  maxGuests: number;
}) {
  const honeypot = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema, undefined, { mode: "sync" }),
    defaultValues: {
      eventSlug,
      fullName: "",
      email: "",
      phone: "",
      guests: 1,
      heardAbout: "",
      accessibility: "",
      consent: false,
    },
  });

  useEffect(() => {
    if (success) document.getElementById("registration-success")?.focus();
  }, [success]);

  async function onSubmit(values: RegisterInput) {
    setFormError("");
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, eventSlug, company: honeypot.current?.value ?? "" }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { ok: true; emailSent: boolean; calendarUrl: string | null }
      | { ok: false; error?: string; fieldErrors?: Record<string, string> }
      | null;
    if (!response.ok || !payload || payload.ok === false) {
      setFormError(payload && "error" in payload && payload.error ? payload.error : "We couldn't save your registration. Please try again.");
      return;
    }
    setSuccess({ emailSent: payload.emailSent, calendarUrl: payload.calendarUrl });
  }

  if (success) {
    return (
      <div role="status" className="border border-line bg-paper p-6">
        <h2 id="registration-success" tabIndex={-1} className="text-3xl outline-none">
          You're registered
        </h2>
        <p className="mt-3 leading-relaxed">
          {success.emailSent
            ? "A confirmation email is on its way, with the event details and a calendar link."
            : "Your place is saved. Email isn't sending from this server yet, so keep this page if you want the calendar link."}
        </p>
        {success.calendarUrl && (
          <a className="mt-5 inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline" href={success.calendarUrl}>
            Add to calendar
          </a>
        )}
      </div>
    );
  }

  const guestChoices = Array.from({ length: maxGuests }, (_, index) => index + 1);

  return (
    <form noValidate className="relative grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true" inert>
        <label htmlFor="company_website">Website</label>
        <input id="company_website" ref={honeypot} name="company_website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {formError && (
        <p role="alert" className="border border-line bg-paper px-3 py-2 text-danger">
          {formError}
        </p>
      )}

      <Field label="Full name" required error={errors.fullName?.message} id="fullName">
        <input id="fullName" autoComplete="name" className={inputClass} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "fullName-error" : undefined} {...register("fullName")} />
      </Field>

      <Field label="Email" required error={errors.email?.message} id="email">
        <input id="email" type="email" autoComplete="email" className={inputClass} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
      </Field>

      <Field label="Phone" error={errors.phone?.message} id="phone" hint="Optional">
        <input id="phone" type="tel" autoComplete="tel" className={inputClass} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} {...register("phone")} />
      </Field>

      <Field label="Number of guests, including you" required error={errors.guests?.message} id="guests">
        <select id="guests" className={inputClass} aria-invalid={Boolean(errors.guests)} aria-describedby={errors.guests ? "guests-error" : undefined} {...register("guests", { valueAsNumber: true })}>
          {guestChoices.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </Field>

      <Field label="How did you hear about this event?" error={errors.heardAbout?.message} id="heardAbout" hint="Optional">
        <select id="heardAbout" className={inputClass} defaultValue="" {...register("heardAbout")}>
          <option value="">Prefer not to say</option>
          {HEARD_ABOUT.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Accessibility needs" error={errors.accessibility?.message} id="accessibility" hint="Optional">
        <textarea id="accessibility" rows={4} className={inputClass} aria-invalid={Boolean(errors.accessibility)} aria-describedby={errors.accessibility ? "accessibility-error" : undefined} {...register("accessibility")} />
      </Field>

      <div>
        <label className="flex items-start gap-3" htmlFor="consent">
          <input id="consent" type="checkbox" className="mt-1 size-4 accent-accent" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "consent-error" : undefined} {...register("consent")} />
          <span>I agree to be contacted about this event. My details will only be used to manage my registration. (required)</span>
        </label>
        {errors.consent && (
          <p id="consent-error" role="alert" className="mt-1 text-sm text-danger">
            {errors.consent.message}
          </p>
        )}
      </div>

      <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-on disabled:opacity-60" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Sending" : "Register"}
      </button>
    </form>
  );
}

const inputClass = "w-full rounded-md border border-line bg-transparent px-3 py-2.5";

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {required ? " (required)" : ""}
        {hint ? <span className="font-normal text-muted"> · {hint}</span> : null}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
