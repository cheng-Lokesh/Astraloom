import { buildWriterSchemaVerification } from "@/lib/server-writers/schema-verification";

import { WriterSchemaVerificationClientPage } from "./writer-schema-verification-client";

export default async function WriterSchemaVerificationPage() {
  const payload = await buildWriterSchemaVerification();

  return <WriterSchemaVerificationClientPage payload={payload} />;
}
