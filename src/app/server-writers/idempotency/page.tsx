import { buildWriterIdempotencyModel } from "@/lib/server-writers/idempotency";

import { WriterIdempotencyClientPage } from "./writer-idempotency-client";

export default function WriterIdempotencyPage() {
  return (
    <WriterIdempotencyClientPage payload={buildWriterIdempotencyModel()} />
  );
}
