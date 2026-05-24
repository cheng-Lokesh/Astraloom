"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import {
  activatePlaceholderEntitlement,
  blockPlaceholderEntitlement,
  buildBillingSupportDraft,
  createSupportTicket,
  markCheckoutCreated,
} from "@/lib/billing/build";
import {
  clearBillingSupportDraft,
  loadBillingSupportDraft,
  saveBillingSupportDraft,
} from "@/lib/billing/storage";
import { loadClaimLedgerDraft } from "@/lib/claims/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { BillingSupportDraft } from "@/types/billing-support";

const unlockModules = [
  "Complete Event Log with every evidence event",
  "NPC-specific path summaries",
  "Relation before/after changes",
  "Parallel-self differences",
  "Key variables and strategy options",
];

export default function BillingPage() {
  const [seedContext] = useState(() => loadSeedContextDraft());
  const [claimLedger] = useState(() => {
    const seed = loadSeedContextDraft();
    return seed ? loadClaimLedgerDraft(seed.id) : null;
  });
  const [billing, setBilling] = useState<BillingSupportDraft>(
    () => loadBillingSupportDraft() ?? buildBillingSupportDraft(),
  );
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  function persist(nextBilling: BillingSupportDraft, nextMessage: string) {
    saveBillingSupportDraft(nextBilling);
    setBilling(nextBilling);
    setMessage(nextMessage);
  }

  function submitIntent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContact = contact.trim();
    if (trimmedContact.length < 4) {
      setMessage("Add an email, handle, or phone number for beta follow-up.");
      return;
    }

    const summary = [
      `contact: ${trimmedContact}`,
      `question: ${seedContext?.questionText ?? "not provided"}`,
      `claims: ${claimLedger?.claims.length ?? 0}`,
      "intent: beta unlock interest; no real payment created",
    ].join("\n");
    const ticket = createSupportTicket("unlock_intent", summary, null);
    const nextPayment = activatePlaceholderEntitlement(billing.payment);

    persist(
      {
        ...billing,
        payment: nextPayment,
        tickets: [ticket, ...billing.tickets],
        unlockIntents: [ticket, ...(billing.unlockIntents ?? [])],
        updatedAt: new Date().toISOString(),
      },
      "Unlock intent recorded locally. No charge was made and claims were not changed.",
    );
    setContact("");
  }

  async function createCheckout() {
    if (!seedContext) {
      setMessage("Create or sync a Seed Context before starting checkout.");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setMessage("Supabase is not configured, so Stripe checkout cannot start yet.");
      return;
    }

    setCheckoutLoading(true);
    setMessage("");

    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;

      if (!accessToken) {
        setMessage("Sign in before starting checkout.");
        return;
      }

      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          seedContextId: seedContext.id,
          simulationRunId: null,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        checkout_url?: string;
        checkout_session_id?: string;
        error_code?: string;
        blocked_codes?: string[];
      };

      if (!response.ok || !payload.ok || !payload.checkout_url) {
        setMessage(
          payload.blocked_codes?.join(", ") ||
            payload.error_code ||
            "Stripe checkout is not ready.",
        );
        return;
      }

      const nextPayment = markCheckoutCreated(
        billing.payment,
        payload.checkout_session_id ?? "stripe_checkout_pending",
      );
      persist(
        { ...billing, payment: nextPayment, updatedAt: new Date().toISOString() },
        "Stripe Checkout created. Entitlement will unlock only after webhook confirmation.",
      );
      window.location.href = payload.checkout_url;
    } finally {
      setCheckoutLoading(false);
    }
  }

  function blockUnlock() {
    persist(
      {
        ...billing,
        payment: blockPlaceholderEntitlement(billing.payment),
        updatedAt: new Date().toISOString(),
      },
      "Unlock placeholder blocked. Safety gates and evidence rules still control output.",
    );
  }

  function reset() {
    clearBillingSupportDraft();
    setBilling(buildBillingSupportDraft());
    setMessage("Local billing/support mock reset.");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <StatusPill tone="ready">Stripe checkout gated</StatusPill>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
              Unlock deeper evidence and strategy, not stronger claims.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
              Stripe Checkout is now the real paid Beta path when server gates
              are enabled. Checkout does not grant entitlement by itself; only a
              verified webhook can unlock paid evidence sections.
            </p>
            {seedContext ? (
              <div className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  Current question
                </p>
                <p className="mt-2 text-sm leading-7 text-[#3f483d]">
                  {seedContext.questionText}
                </p>
              </div>
            ) : null}
          </main>

          <form
            onSubmit={submitIntent}
            className="rounded-lg bg-[#11150f] p-6 text-white"
          >
            <h2 className="text-xl font-semibold">Join beta unlock list</h2>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Start checkout for the current simulation. Paid unlock expands
              evidence and strategy depth; it cannot change claim direction or
              bypass safety downgrade.
            </p>
            <button
              type="button"
              onClick={createCheckout}
              disabled={checkoutLoading}
              className="mt-6 w-full rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading ? "Creating checkout..." : "Start Stripe Checkout"}
            </button>
            <div className="my-5 h-px bg-white/10" />
            <p className="text-sm leading-6 text-white/62">
              If checkout is not enabled for your account yet, leave contact
              info to create a support ticket without charging anything.
            </p>
            <label className="mt-6 block">
              <span className="text-sm font-semibold text-white/78">Contact</span>
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="email / phone / handle"
                className="mt-2 w-full rounded-md border border-white/12 bg-white px-3 py-3 text-sm text-[#11150f] outline-none focus:border-[#b7e6c6]"
              />
            </label>
            <button
              type="submit"
              className="mt-4 w-full rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              Record unlock intent
            </button>
            <button
              type="button"
              onClick={blockUnlock}
              className="mt-3 w-full rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              Block unlock placeholder
            </button>
            {message ? <p className="mt-4 text-sm leading-6 text-white/62">{message}</p> : null}
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-[#11150f]">
              Unlock value
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {unlockModules.map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
                >
                  <p className="text-sm font-semibold leading-6 text-[#11150f]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </main>

          <aside className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-[#11150f]">
              Local payment ledger
            </h2>
            <dl className="mt-5 space-y-4 text-sm leading-6 text-[#62695d]">
              <LedgerRow label="Provider" value={billing.payment.provider} />
              <LedgerRow label="Status" value={billing.payment.status} />
              <LedgerRow label="Entitlement" value={billing.payment.entitlementStatus} />
              <LedgerRow label="Amount" value={`${billing.payment.amountCents} cents`} />
              <LedgerRow label="Unlock intents" value={`${billing.unlockIntents?.length ?? 0}`} />
            </dl>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/app/simulation/result"
                className="inline-flex justify-center rounded-md bg-[#11150f] px-4 py-3 text-sm font-semibold text-white"
              >
                Back to Result Sandbox
              </Link>
              <Link
                href="/app/support"
                className="inline-flex justify-center rounded-md border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#11150f]"
              >
                Support / refund / delete
              </Link>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#11150f]"
              >
                Reset local ledger
              </button>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-[#11150f]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
