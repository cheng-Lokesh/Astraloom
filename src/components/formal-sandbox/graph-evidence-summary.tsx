export function GraphEvidenceSummary({ references }: { references: readonly string[] }) {
  const labels = [...new Set(references.map(reference => reference === "seed:submitted" || reference.startsWith("seed_context:") ? "已提交情境" : reference === "key_person:confirmed" ? "已确认人物" : reference === "user_supplement" ? "本人补充说明" : reference.startsWith("agent:") ? "冻结人物快照" : "已保存证据来源"))];
  return <div className="mt-2 text-sm leading-6"><p>{references.length} 条已保存证据</p><ul className="mt-2 flex flex-wrap gap-2">{labels.map(label => <li key={label} className="rounded border border-white/15 px-2.5 py-1">{label}</li>)}</ul><p className="mt-2 text-sm">来源摘要用于核对关系依据，原始证据记录保持保存在账户中。</p></div>;
}
