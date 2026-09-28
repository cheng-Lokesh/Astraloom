import { AppShell } from "@/components/app-shell";
import { LifeClimateClient } from "./life-climate-client";

export const dynamic = "force-dynamic";

export default function LifeClimatePage() {
  return <AppShell><LifeClimateClient /></AppShell>;
}
