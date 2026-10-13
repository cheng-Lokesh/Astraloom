import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FormalRunStarter } from "@/components/formal-sandbox/run-starter";
import { parseRevisionQuery } from "@/components/formal-sandbox/model-rule-revision-query";

export default async function StartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  if (!Object.keys(query).length) redirect("/app/new/scene");
  const runId = parseRevisionQuery(query);
  return <AppShell><main className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 sm:px-6">
    {runId ? <FormalRunStarter revisionRunId={runId} /> : <p role="alert">修订入口无效，请从历史结果重新选择。</p>}
    <Link className="mt-6 inline-flex min-h-11 items-center underline underline-offset-4" href={runId ? `/app/simulation/result?run_id=${encodeURIComponent(runId)}` : "/app/archive"}>取消修订，返回{runId ? "原结果" : "历史"}</Link>
  </main></AppShell>;
}
