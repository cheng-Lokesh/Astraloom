Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path

$checks = @(
  @{ Name = "nonempty_service_role"; Pattern = "SUPABASE_SERVICE_ROLE_KEY\s*=\S+" },
  @{ Name = "nonempty_stripe_secret"; Pattern = "STRIPE_SECRET_KEY\s*=\S+" },
  @{ Name = "nonempty_openai_key"; Pattern = "OPENAI_API_KEY\s*=\S+" },
  @{ Name = "nonempty_anthropic_key"; Pattern = "ANTHROPIC_API_KEY\s*=\S+" },
  @{ Name = "openai_secret_literal"; Pattern = "sk-[A-Za-z0-9_-]{20,}" },
  @{ Name = "supabase_secret_literal"; Pattern = "sb_secret_[A-Za-z0-9_-]+" }
)

$rgExcludes = @(
  "--glob", "!node_modules",
  "--glob", "!.next",
  "--glob", "!package-lock.json",
  "--glob", "!*.tsbuildinfo",
  "--glob", "!docs/codex-next-task.md",
  "--glob", "!docs/mvp-qa-environment.md",
  "--glob", "!docs/supabase-auth-sync-setup.md",
  "--glob", "!docs/context-recovery.md",
  "--glob", "!scripts/secret-scan.ps1",
  "--glob", "!src/app/setup/setup-client.tsx",
  "--glob", "!src/app/sync/sync-client.tsx",
  "--glob", "!src/app/auth/callback/auth-callback-client.tsx",
  "--glob", "!src/lib/supabase/client.ts",
  "--glob", "!src/lib/env.ts",
  "--glob", "!src/lib/supabase/config.ts",
  "--glob", "!src/lib/supabase/remote-schema.ts",
  "--glob", "!src/lib/supabase/migration.ts",
  "--glob", "!src/types/env.ts",
  "--glob", "!src/app/login/login-client.tsx",
  "--glob", "!src/app/api/supabase-setup/status/route.ts",
  "--glob", "!src/app/api/supabase-setup/remote-schema/route.ts",
  "--glob", "!src/app/api/system-writers/status/route.ts",
  "--glob", "!src/lib/server-writers/status.ts",
  "--glob", "!src/types/server-writer.ts",
  "--glob", "!src/types/supabase-setup.ts",
  "--glob", "!README.md",
  "--glob", "!.env.example",
  "--glob", "!.env.local",
  "--glob", "!docs/archived/**",
  "--glob", "!docs/cleanup/**",
  "--glob", "!docs/controlled-backend-writers.md",
  "--glob", "!docs/disabled-service-role-adapter.md",
  "--glob", "!docs/migration-proposal.md",
  "--glob", "!docs/writer-execution-guardrail.md",
  "--glob", "!docs/writer-persistence-*.md"
)

Push-Location $repoRoot
try {
  $matches = New-Object System.Collections.Generic.List[string]

  foreach ($check in $checks) {
    $result = & rg -n --hidden @rgExcludes $check.Pattern . 2>$null
    $exit = $LASTEXITCODE

    if ($exit -eq 0) {
      $matches.Add("$($check.Name): $result")
    } elseif ($exit -ne 1) {
      throw "rg failed while running check '$($check.Name)' with exit code $exit"
    }
  }

  if ($matches.Count -gt 0) {
    $matches | ForEach-Object { Write-Output $_ }
    throw "Secret scan found matches"
  }

  Write-Output "NO_MATCH"
} finally {
  Pop-Location
}
