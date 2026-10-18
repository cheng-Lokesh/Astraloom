import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Follow actual value imports/re-exports, including mixed type/value declarations. */
function browserDependencies(entry: string) {
  const reached = new Set<string>();
  const forbidden: string[] = [];
  const visit = (filename: string, chain: string[]) => {
    if (reached.has(filename)) return;
    reached.add(filename);
    const parsed = ts.createSourceFile(filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
    for (const statement of parsed.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined;
      if (clause?.isTypeOnly || (ts.isExportDeclaration(statement) && statement.isTypeOnly)) continue;
      const bindings = clause?.namedBindings;
      if (!clause?.name && bindings && ts.isNamedImports(bindings) && bindings.elements.every(item => item.isTypeOnly)) continue;
      if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause) && statement.exportClause.elements.every(item => item.isTypeOnly)) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier)) continue;
      const target = specifier.text;
      if (target.startsWith("node:") || target === "server-only") {
        forbidden.push([...chain, target].join(" -> "));
        continue;
      }
      if (!target.startsWith("@/") && !target.startsWith(".")) continue;
      const base = target.startsWith("@/") ? path.resolve(srcRoot, target.slice(2)) : path.resolve(path.dirname(filename), target);
      const resolved = [base + ".ts", base + ".tsx", path.join(base, "index.ts"), path.join(base, "index.tsx")].find(existsSync);
      if (!resolved) throw new Error("Unresolved local browser import: " + target);
      visit(resolved, [...chain, path.relative(srcRoot, resolved).replaceAll("\\", "/")]);
    }
  };
  visit(path.resolve(srcRoot, entry), [entry]);
  return { reached: [...reached].map(filename => path.relative(srcRoot, filename).replaceAll("\\", "/")), forbidden };
}

describe("formal sandbox browser contracts", () => {
  it("keeps the actual browser client dependency closure outside Node and trajectory replay", () => {
    const dependencies = browserDependencies("lib/formal-sandbox/client.ts");
    expect(dependencies.forbidden).toEqual([]);
    expect(dependencies.reached).not.toContain("lib/digital-life/guard-observations.ts");
    expect(dependencies.reached).not.toContain("lib/v2/trajectory-analysis/trajectory-result-validation.ts");
  });
});
