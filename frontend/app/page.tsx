"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../lib/supabase";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [role, setRole] = useState<"business" | "contractor">("business");
  const [status, setStatus] = useState("Choose how you want to enter KiwiContract.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function ensureBusinessProfile(input: { userId: string; name: string }) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const { data: existing, error: fetchError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existing) {
      return;
    }

    const { error } = await supabase.from("businesses").insert({
      user_id: input.userId,
      name: input.name || "KiwiContract business",
      chain_id: 43113,
    });

    if (error) {
      throw error;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setStatus("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const accountName = String(form.get("accountName") ?? "").trim();
    const email =
      mode === "signin"
        ? accountName
        : String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const destination = role === "business" ? "/business" : "/contractor";

    setIsSubmitting(true);
    setStatus(mode === "signup" ? "Creating your account..." : "Signing you in...");

    try {
      if (mode === "signup") {
        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            displayName: accountName,
            role,
          }),
        });
        const signupPayload = await signupResponse.json();

        if (!signupResponse.ok) {
          throw new Error(signupPayload?.error ?? "Sign up failed");
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        router.push(destination);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const savedRole = data.user?.user_metadata?.role;
      const nextRole = savedRole === "business" || savedRole === "contractor" ? savedRole : role;

      if (nextRole === "business" && data.user) {
        await ensureBusinessProfile({
          userId: data.user.id,
          name: data.user.user_metadata?.display_name ?? accountName,
        });
      }

      router.push(nextRole === "business" ? "/business" : "/contractor");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#17211d]">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#587064]">
            KiwiContract
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
            AI-powered contractor management for Aotearoa.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#53645b]">
            Business owners post jobs, match with contractors, verify trust records,
            receive bills, and pay with a wallet when the work is done.
          </p>
        </div>

        <article className="rounded-lg border border-[#d9ded2] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex rounded-md border border-[#cfd8ca] p-1" role="tablist" aria-label="Account action">
            {(["signup", "signin"] as const).map((item) => (
              <button
                aria-selected={mode === item}
                className={`flex-1 rounded px-4 py-3 text-sm font-bold capitalize ${
                  mode === item ? "bg-[#155b49] text-white" : "text-[#435149]"
                }`}
                data-testid={`${item}-mode-button`}
                key={item}
                onClick={() => {
                  setMode(item);
                  setStatus("Choose how you want to enter KiwiContract.");
                }}
                role="tab"
                type="button"
              >
                {item === "signup" ? "Sign up" : "Sign in"}
              </button>
            ))}
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <fieldset className="grid gap-3">
              <legend className="text-sm font-semibold">I am a</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["business", "contractor"] as const).map((item) => (
                  <label
                    className={`rounded-lg border p-4 ${
                      role === item
                        ? "border-[#155b49] bg-[#e7f2ee]"
                        : "border-[#d9ded2] bg-[#fbfcf8]"
                    }`}
                    htmlFor={`${item}-role`}
                    key={item}
                  >
                    <input
                      checked={role === item}
                      className="mr-2"
                      data-testid={`${item}-role-radio`}
                      id={`${item}-role`}
                      name="role"
                      onChange={() => setRole(item)}
                      type="radio"
                      value={item}
                    />
                    <span className="font-bold capitalize">{item}</span>
                    <span className="mt-2 block text-sm text-[#607066]">
                      {item === "business"
                        ? "Post jobs, review matches, and pay contractor bills."
                        : "Complete your checklist and manage accepted work."}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="grid gap-2 text-sm font-semibold" htmlFor="account-name">
              {mode === "signup" ? "Name or business" : "Email"}
              <input
                className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal"
                data-testid="account-name-input"
                id="account-name"
                name="accountName"
                required
                type={mode === "signin" ? "email" : "text"}
              />
            </label>

            {mode === "signup" && (
              <label className="grid gap-2 text-sm font-semibold" htmlFor="account-email">
                Email
                <input
                  className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal"
                  data-testid="account-email-input"
                  id="account-email"
                  name="email"
                  required
                  type="email"
                />
              </label>
            )}

            <label className="grid gap-2 text-sm font-semibold" htmlFor="account-password">
              Password
              <input
                className="rounded-md border border-[#cfd8ca] bg-[#fbfcf8] px-3 py-3 font-normal"
                data-testid="account-password-input"
                id="account-password"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </label>

            <p className="text-sm text-[#607066]" aria-live="polite">
              {status}
            </p>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                className="rounded-md bg-[#155b49] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
                data-testid="prepare-account-button"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? mode === "signup"
                    ? "Creating..."
                    : "Signing in..."
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
