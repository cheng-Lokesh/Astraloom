"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui-foundation";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";

export function FormalRunStartError({ errorCode }: { errorCode: string }) {
  if (errorCode === "world_model_required") {
    return (
      <p role="alert" className="mt-2 max-w-xs text-sm text-[var(--risk-red)]">
        Add an explicit resource and per-step usage amount before starting. {" "}
        <Link href="/app/reality-profile" className="underline underline-offset-4">
          Update Reality Profile
        </Link>
      </p>
    );
  }

  return (
    <p role="alert" className="mt-2 max-w-xs text-sm text-[var(--risk-red)]">
      Run could not start: {errorCode}. Review the locked Graph and retry.
    </p>
  );
}

export function FormalRunStarter({ graphId }: { graphId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    const response = await createFormalSandboxClient().start({
      graphSnapshotId: graphId,
      idempotencyKey: crypto.randomUUID(),
      horizonDays: 30,
    });
    if (!response.ok) {
      setError(response.errorCode);
      setPending(false);
      return;
    }
    router.push(`/app/simulation/running?run_id=${response.data.run.id}`);
  }

  return (
    <div className="shrink-0">
      <Button
        variant="onDark"
        loading={pending}
        disabled={pending}
        onClick={() => void start()}
        className="!w-auto px-4 py-3"
        loadingLabel="Starting formal Run"
      >
        Start 30-day Run
      </Button>
      {error ? <FormalRunStartError errorCode={error} /> : null}
    </div>
  );
}
