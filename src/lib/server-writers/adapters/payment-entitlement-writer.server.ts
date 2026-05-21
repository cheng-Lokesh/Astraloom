import "server-only";

import {
  blockServerWriterStub,
  createBlockedServerWriterStub,
} from "@/lib/server-writers/adapters/stub-helpers.server";

export const paymentEntitlementWriterStub = createBlockedServerWriterStub({
  contractId: "payment_entitlement_record",
  category: "payments",
  targetTables: ["payments"],
  intendedOperation: "append",
  modulePath:
    "@/lib/server-writers/adapters/payment-entitlement-writer.server",
  exportedSymbol: "paymentEntitlementWriterStub",
  summary:
    "Payment entitlement writer stub reserves the server-only boundary for future verified Stripe entitlement recording without calling Stripe or writing payment rows.",
});

export function probePaymentEntitlementWriterStub() {
  return blockServerWriterStub(paymentEntitlementWriterStub);
}
