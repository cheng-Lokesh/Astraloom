import { buildWriterExecutionGuardrail } from "@/lib/server-writers/guardrail";

import { WriterGuardrailClientPage } from "./writer-guardrail-client";

export default function WriterGuardrailPage() {
  return (
    <WriterGuardrailClientPage payload={buildWriterExecutionGuardrail()} />
  );
}
