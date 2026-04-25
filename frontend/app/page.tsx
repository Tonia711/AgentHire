"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import TempNav from "./temp-nav";

export default function Home() {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [role, setRole] = useState<"business" | "contractor">("business");
  const [status, setStatus] = useState("Choose how you want to enter KiwiContract.");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(
      `${mode === "signup" ? "Sign up" : "Sign in"} ready. Continue as ${role}.`,
    );
  }

  const destination = role === "business" ? "/client" : "/contractor";

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#17211d]">
      <TempNav />
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#587064]">
            KiwiContract
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
            AI-powered contractor management for Aotearoa.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#53645b]">
            Business owners invite contractors, verify identity, sign agreements,
            create invoices, and pay in digital NZ Dollars on Avalanche Fuji.
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
                onClick={() => setMode(item)}
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
                        ? "Invite contractors, run the AI agent, and pay dNZD."
                        : "Complete Civic KYC and sign agreements."}
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
                className="rounded-md border border-[#b9c2b2] px-4 py-3 text-sm font-bold"
                data-testid="prepare-account-button"
                type="submit"
              >
                Prepare account
              </button>
              <Link
                className="rounded-md bg-[#155b49] px-4 py-3 text-center text-sm font-bold text-white"
                data-testid="continue-to-dashboard-link"
                href={destination}
              >
                Continue as {role}
              </Link>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
