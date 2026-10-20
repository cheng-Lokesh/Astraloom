import { AppShell } from "@/components/app-shell";
import { B3Client } from "@/components/life-climate/b3/b3-client";
export const dynamic = "force-dynamic";
export default function B3Page() { return <AppShell><B3Client /></AppShell>; }
