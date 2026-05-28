"use client";

import { useRouter } from "next/navigation";

import { createTrialWorkspace } from "@/lib/trial/sample-workspace";

type TrialSampleButtonProps = {
  className?: string;
  children?: React.ReactNode;
  target?: string;
};

export function TrialSampleButton({
  className,
  children = "Try a complete destiny sandbox sample",
  target = "/app/simulation/result",
}: TrialSampleButtonProps) {
  const router = useRouter();

  function loadTrial() {
    createTrialWorkspace();
    router.push(target);
  }

  return (
    <button type="button" onClick={loadTrial} className={className}>
      {children}
    </button>
  );
}
