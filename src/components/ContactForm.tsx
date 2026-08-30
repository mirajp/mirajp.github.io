import { useState, useId } from "react";
import type { FormEvent } from "react";

interface FormValues {
  name: string;
  email: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_EMAIL = "miraj@miraj.dev";

type Status = "idle" | "loading" | "success";

export default function ContactForm() {
  const [values, setValues] = useState<FormValues>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [status, setStatus] = useState<Status>("idle");

  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const errorSummaryId = useId();

  function validate(v: FormValues): Partial<FormValues> {
    const next: Partial<FormValues> = {};
    if (!v.name.trim()) next.name = "Enter your name.";
    if (!v.email.trim()) next.email = "Enter your email.";
    else if (!EMAIL_RE.test(v.email)) next.email = "Enter a valid email address.";
    if (!v.message.trim()) next.message = "Enter a message.";
    return next;
  }

  function handleChange(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus("loading");

    // No form backend on a static GitHub Pages deploy, so the working
    // fallback is a pre-filled mailto — this genuinely opens the visitor's
    // mail client rather than silently (and falsely) claiming to submit.
    const subject = encodeURIComponent(`Portfolio contact from ${values.name}`);
    const body = encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`);

    window.setTimeout(() => {
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      setStatus("success");
    }, 500);
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-lg border border-success/30 bg-green-50 p-6 text-sm text-green-900 dark:bg-green-950/20 dark:text-green-200"
      >
        <p className="font-semibold">Your email client should be opening now.</p>
        <p className="mt-1 text-green-800 dark:text-green-300">
          Nothing sends automatically — review the pre-filled message and hit send from there. Prefer to copy
          the address instead?{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      {errorCount > 0 && (
        <div
          id={errorSummaryId}
          role="alert"
          className="rounded-md border border-error/30 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-300"
        >
          {errorCount === 1 ? "1 field needs" : `${errorCount} fields need`} attention below.
        </div>
      )}

      <div>
        <label htmlFor={nameId} className="text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
          disabled={status === "loading"}
          className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted disabled:opacity-60"
        />
        {errors.name && (
          <p id={`${nameId}-error`} className="mt-1.5 text-sm text-error">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={emailId} className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          disabled={status === "loading"}
          className="mt-1.5 block w-full min-h-11 rounded-md border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted disabled:opacity-60"
        />
        {errors.email && (
          <p id={`${emailId}-error`} className="mt-1.5 text-sm text-error">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={messageId} className="text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id={messageId}
          rows={5}
          value={values.message}
          onChange={(e) => handleChange("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${messageId}-error` : undefined}
          disabled={status === "loading"}
          className="mt-1.5 block w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted disabled:opacity-60"
        />
        {errors.message && (
          <p id={`${messageId}-error`} className="mt-1.5 text-sm text-error">
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Preparing message…
          </>
        ) : (
          "Send message"
        )}
      </button>
    </form>
  );
}
