param(
  [string]$Stage = "core",
  [switch]$SkipBuild,
  [string]$BaseUrl = "http://localhost:3000"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command
  )

  Write-Output "== $Label =="
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE"
  }
}

function Assert-OnlyInitialMigration {
  $migrations = @(Get-ChildItem -LiteralPath "supabase\migrations" -Name)
  if ($migrations.Count -ne 1 -or $migrations[0] -ne "0001_mvp_core_schema.sql") {
    throw "Unexpected migrations: $($migrations -join ', ')"
  }
  Write-Output "MIGRATIONS_OK: $($migrations -join ', ')"
}

function Assert-NoMojibake {
  $pattern = [regex]::Escape([string][char]0xFFFD)
  $result = & rg -n $pattern src docs -S
  $exit = $LASTEXITCODE

  if ($exit -eq 0) {
    $result | ForEach-Object { Write-Output $_ }
    throw "Mojibake smoke scan found replacement-character matches"
  }

  if ($exit -ne 1) {
    throw "Mojibake smoke scan failed with exit code $exit"
  }

  Write-Output "MOJIBAKE_SMOKE_OK"
}

function Assert-NoTopLevelSrcLeak {
  $leakPath = Join-Path (Split-Path -Parent $repoRoot) "src"
  if (Test-Path -LiteralPath $leakPath) {
    throw "Unexpected top-level src leak exists: $leakPath"
  }
  Write-Output "TOP_LEVEL_SRC_OK"
}

function Assert-Stage67Api {
  $apiPath = "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation"
  $uri = "$($BaseUrl.TrimEnd('/'))$apiPath"
  $payload = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 30
  $itemId = $payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationItems[0].id
  $probe = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body (@{ itemId = $itemId } | ConvertTo-Json -Compress) -TimeoutSec 30

  $checks = [ordered]@{
    reconciliationItemCount = $payload.reconciliationItemCount -eq 10
    externalEvidenceUnresolvedCount = $payload.externalEvidenceUnresolvedCount -eq 5
    manualReviewerUnresolvedCount = $payload.manualReviewerUnresolvedCount -eq 5
    reviewNoGoStillBlockedCount = $payload.reviewNoGoStillBlockedCount -eq 10
    sourceNoGoItemCount = $payload.sourceNoGoItemCount -eq 10
    sourceReviewNoGoCount = $payload.sourceReviewNoGoCount -eq 10
    sourceExternalEvidenceReviewNoGoCount = $payload.sourceExternalEvidenceReviewNoGoCount -eq 5
    sourceManualReviewerReviewNoGoCount = $payload.sourceManualReviewerReviewNoGoCount -eq 5
    sourceReconciliationRemediationReviewStillBlockedCount = $payload.sourceReconciliationRemediationReviewStillBlockedCount -eq 10
    checklistReady = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistReady -eq $true
    checklistOnly = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly -eq $true
    sourcePacketReady = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketReady -eq $true
    sourcePacketOnly = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoPacketOnly -eq $true
    reconciliationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted -eq $false
    reconciliationRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationRecorded -eq $false
    noGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted -eq $false
    noGoRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoRecorded -eq $false
    reviewAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted -eq $false
    remediationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationAccepted -eq $false
    finalAccepted = $payload.authorizationReconsiderationFinalDecisionAccepted -eq $false
    authorizationGranted = $payload.implementationAuthorizationGranted -eq $false
    readyForAdapter = $payload.readyForAdapterImplementation -eq $false
    allRuntimeEffectsBlocked = $payload.allRuntimeEffectsBlocked -eq $true
    wouldAcceptReconciliation = $payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation -eq $false
    wouldRecordReconciliation = $payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation -eq $false
    wouldMarkReconciled = $payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciled -eq $false
    wouldPromoteToDecision = $payload.wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationToAuthorizationDecision -eq $false
    wouldCreateServiceRoleClient = $payload.wouldCreateServiceRoleClient -eq $false
    wouldRunTransaction = $payload.wouldRunTransaction -eq $false
    wouldWriteRows = $payload.wouldWriteRows -eq $false
    probeBlocked = $probe.blocked -eq $true
    probeWouldWriteRows = $probe.wouldWriteRows -eq $false
    probeReconciliationAccepted = $probe.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted -eq $false
  }

  $failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
  if ($failed.Count -gt 0) {
    throw "Stage67 API invariant failures: $($failed -join ', ')"
  }

  Write-Output "STAGE67_API_OK"
}

function Assert-Stage68Api {
  $apiPath = "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go"
  $uri = "$($BaseUrl.TrimEnd('/'))$apiPath"
  $payload = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 30
  $itemId = $payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoItems[0].id
  $probe = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body (@{ itemId = $itemId } | ConvertTo-Json -Compress) -TimeoutSec 30

  $checks = [ordered]@{
    noGoItemCount = $payload.noGoItemCount -eq 10
    reconciliationNoGoItemCount = $payload.reconciliationNoGoItemCount -eq 10
    externalEvidenceReconciliationNoGoCount = $payload.externalEvidenceReconciliationNoGoCount -eq 5
    manualReviewerReconciliationNoGoCount = $payload.manualReviewerReconciliationNoGoCount -eq 5
    reconciliationStillBlockedCount = $payload.reconciliationStillBlockedCount -eq 10
    sourceReconciliationItemCount = $payload.sourceReconciliationItemCount -eq 10
    sourceExternalEvidenceUnresolvedCount = $payload.sourceExternalEvidenceUnresolvedCount -eq 5
    sourceManualReviewerUnresolvedCount = $payload.sourceManualReviewerUnresolvedCount -eq 5
    sourceReviewNoGoStillBlockedCount = $payload.sourceReviewNoGoStillBlockedCount -eq 10
    noGoPacketReady = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady -eq $true
    noGoPacketOnly = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly -eq $true
    sourceChecklistReady = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistReady -eq $true
    sourceChecklistOnly = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationChecklistOnly -eq $true
    noGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted -eq $false
    noGoRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRecorded -eq $false
    reconciliationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted -eq $false
    reviewNoGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted -eq $false
    reviewAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted -eq $false
    finalAccepted = $payload.authorizationReconsiderationFinalDecisionAccepted -eq $false
    authorizationGranted = $payload.implementationAuthorizationGranted -eq $false
    readyForAdapter = $payload.readyForAdapterImplementation -eq $false
    allRuntimeEffectsBlocked = $payload.allRuntimeEffectsBlocked -eq $true
    wouldAcceptNoGo = $payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo -eq $false
    wouldRecordNoGo = $payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGo -eq $false
    wouldDenyAuthorization = $payload.wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliation -eq $false
    wouldPromoteToDecision = $payload.wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoToAuthorizationDecision -eq $false
    wouldCreateServiceRoleClient = $payload.wouldCreateServiceRoleClient -eq $false
    wouldRunTransaction = $payload.wouldRunTransaction -eq $false
    wouldWriteRows = $payload.wouldWriteRows -eq $false
    probeBlocked = $probe.blocked -eq $true
    probeWouldWriteRows = $probe.wouldWriteRows -eq $false
    probeNoGoAccepted = $probe.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted -eq $false
  }

  $failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
  if ($failed.Count -gt 0) {
    throw "Stage68 API invariant failures: $($failed -join ', ')"
  }

  Write-Output "STAGE68_API_OK"
}

function Assert-Stage69Api {
  $apiPath = "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation"
  $uri = "$($BaseUrl.TrimEnd('/'))$apiPath"
  $payload = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 30
  $itemId = $payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationItems[0].id
  $probe = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body (@{ itemId = $itemId } | ConvertTo-Json -Compress) -TimeoutSec 30

  $checks = [ordered]@{
    remediationItemCount = $payload.remediationItemCount -eq 10
    externalReconciliationNoGoRemediationRequiredCount = $payload.externalReconciliationNoGoRemediationRequiredCount -eq 5
    manualReconciliationNoGoReviewRequiredCount = $payload.manualReconciliationNoGoReviewRequiredCount -eq 5
    sourceReconciliationNoGoItemCount = $payload.sourceReconciliationNoGoItemCount -eq 10
    sourceReconciliationNoGoCount = $payload.sourceReconciliationNoGoCount -eq 10
    sourceExternalEvidenceReconciliationNoGoCount = $payload.sourceExternalEvidenceReconciliationNoGoCount -eq 5
    sourceManualReviewerReconciliationNoGoCount = $payload.sourceManualReviewerReconciliationNoGoCount -eq 5
    sourceReconciliationStillBlockedCount = $payload.sourceReconciliationStillBlockedCount -eq 10
    remediationPlanReady = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanReady -eq $true
    remediationPlanOnly = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly -eq $true
    sourceNoGoPacketReady = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketReady -eq $true
    sourceNoGoPacketOnly = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoPacketOnly -eq $true
    remediationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted -eq $false
    remediationRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded -eq $false
    remediationStatesAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted -eq $false
    noGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted -eq $false
    reconciliationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted -eq $false
    reviewNoGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted -eq $false
    reviewAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted -eq $false
    finalAccepted = $payload.authorizationReconsiderationFinalDecisionAccepted -eq $false
    authorizationGranted = $payload.implementationAuthorizationGranted -eq $false
    readyForAdapter = $payload.readyForAdapterImplementation -eq $false
    allRuntimeEffectsBlocked = $payload.allRuntimeEffectsBlocked -eq $true
    wouldAcceptRemediation = $payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediation -eq $false
    wouldRecordRemediationEvidence = $payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationEvidence -eq $false
    wouldResolveBlocker = $payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationBlockerResolved -eq $false
    wouldCreateTicket = $payload.wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationTicket -eq $false
    wouldAcceptRemediationState = $payload.wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationState -eq $false
    wouldPromoteToReview = $payload.wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview -eq $false
    wouldCreateServiceRoleClient = $payload.wouldCreateServiceRoleClient -eq $false
    wouldRunTransaction = $payload.wouldRunTransaction -eq $false
    wouldWriteRows = $payload.wouldWriteRows -eq $false
    probeBlocked = $probe.blocked -eq $true
    probeWouldWriteRows = $probe.wouldWriteRows -eq $false
    probeRemediationAccepted = $probe.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted -eq $false
  }

  $failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
  if ($failed.Count -gt 0) {
    throw "Stage69 API invariant failures: $($failed -join ', ')"
  }

  Write-Output "STAGE69_API_OK"
}

function Assert-Stage70Api {
  $apiPath = "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review"
  $uri = "$($BaseUrl.TrimEnd('/'))$apiPath"
  $payload = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 30
  $itemId = $payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewItems[0].id
  $probe = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body (@{ itemId = $itemId } | ConvertTo-Json -Compress) -TimeoutSec 30

  $checks = [ordered]@{
    reviewItemCount = $payload.reviewItemCount -eq 10
    externalEvidenceMissingCount = $payload.externalEvidenceMissingCount -eq 5
    manualReviewerRequiredCount = $payload.manualReviewerRequiredCount -eq 5
    reconciliationNoGoRemediationStillBlockedCount = $payload.reconciliationNoGoRemediationStillBlockedCount -eq 10
    sourceNoGoRemediationItemCount = $payload.sourceNoGoRemediationItemCount -eq 10
    sourceExternalReconciliationNoGoRemediationRequiredCount = $payload.sourceExternalReconciliationNoGoRemediationRequiredCount -eq 5
    sourceManualReconciliationNoGoReviewRequiredCount = $payload.sourceManualReconciliationNoGoReviewRequiredCount -eq 5
    sourceReconciliationNoGoStillBlockedCount = $payload.sourceReconciliationNoGoStillBlockedCount -eq 10
    checklistReady = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistReady -eq $true
    checklistOnly = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly -eq $true
    sourcePlanReady = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanReady -eq $true
    sourcePlanOnly = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationPlanOnly -eq $true
    reviewAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted -eq $false
    reviewRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRecorded -eq $false
    reviewComplete = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewComplete -eq $false
    remediationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted -eq $false
    remediationRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded -eq $false
    remediationStatesAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted -eq $false
    noGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted -eq $false
    reconciliationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted -eq $false
    reviewNoGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted -eq $false
    parentReviewAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted -eq $false
    finalAccepted = $payload.authorizationReconsiderationFinalDecisionAccepted -eq $false
    authorizationGranted = $payload.implementationAuthorizationGranted -eq $false
    readyForAdapter = $payload.readyForAdapterImplementation -eq $false
    allRuntimeEffectsBlocked = $payload.allRuntimeEffectsBlocked -eq $true
    wouldAcceptReview = $payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview -eq $false
    wouldRecordReview = $payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview -eq $false
    wouldStoreReviewEvidence = $payload.wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewEvidence -eq $false
    wouldMarkReviewed = $payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewed -eq $false
    wouldPromoteToReviewNoGo = $payload.wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo -eq $false
    wouldCreateServiceRoleClient = $payload.wouldCreateServiceRoleClient -eq $false
    wouldRunTransaction = $payload.wouldRunTransaction -eq $false
    wouldWriteRows = $payload.wouldWriteRows -eq $false
    probeBlocked = $probe.blocked -eq $true
    probeWouldWriteRows = $probe.wouldWriteRows -eq $false
    probeReviewAccepted = $probe.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted -eq $false
  }

  $failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
  if ($failed.Count -gt 0) {
    throw "Stage70 API invariant failures: $($failed -join ', ')"
  }

  Write-Output "STAGE70_API_OK"
}

function Assert-Stage71Api {
  $apiPath = "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go"
  $uri = "$($BaseUrl.TrimEnd('/'))$apiPath"
  $payload = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 30
  $itemId = $payload.archiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoItems[0].id
  $probe = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body (@{ itemId = $itemId } | ConvertTo-Json -Compress) -TimeoutSec 30

  $checks = [ordered]@{
    noGoItemCount = $payload.noGoItemCount -eq 10
    remediationReviewNoGoItemCount = $payload.remediationReviewNoGoItemCount -eq 10
    externalEvidenceReviewNoGoCount = $payload.externalEvidenceReviewNoGoCount -eq 5
    manualReviewerReviewNoGoCount = $payload.manualReviewerReviewNoGoCount -eq 5
    remediationReviewStillBlockedCount = $payload.remediationReviewStillBlockedCount -eq 10
    sourceReviewItemCount = $payload.sourceReviewItemCount -eq 10
    sourceExternalEvidenceMissingCount = $payload.sourceExternalEvidenceMissingCount -eq 5
    sourceManualReviewerRequiredCount = $payload.sourceManualReviewerRequiredCount -eq 5
    sourceNoGoRemediationStillBlockedCount = $payload.sourceNoGoRemediationStillBlockedCount -eq 10
    noGoPacketReady = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady -eq $true
    noGoPacketOnly = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly -eq $true
    sourceChecklistReady = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistReady -eq $true
    sourceChecklistOnly = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewChecklistOnly -eq $true
    noGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted -eq $false
    noGoRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded -eq $false
    reviewAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted -eq $false
    reviewRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewRecorded -eq $false
    reviewComplete = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewComplete -eq $false
    remediationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted -eq $false
    remediationRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationRecorded -eq $false
    remediationStatesAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationStatesAccepted -eq $false
    parentNoGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoAccepted -eq $false
    reconciliationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationAccepted -eq $false
    reviewNoGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoAccepted -eq $false
    parentReviewAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewAccepted -eq $false
    finalAccepted = $payload.authorizationReconsiderationFinalDecisionAccepted -eq $false
    authorizationGranted = $payload.implementationAuthorizationGranted -eq $false
    readyForAdapter = $payload.readyForAdapterImplementation -eq $false
    allRuntimeEffectsBlocked = $payload.allRuntimeEffectsBlocked -eq $true
    wouldAcceptNoGo = $payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo -eq $false
    wouldRecordNoGo = $payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGo -eq $false
    wouldDenyAuthorization = $payload.wouldDenyImplementationAuthorizationFromArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview -eq $false
    wouldPromoteToDecision = $payload.wouldPromoteArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoToAuthorizationDecision -eq $false
    wouldAcceptReview = $payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview -eq $false
    wouldRecordReview = $payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReview -eq $false
    wouldStoreReviewEvidence = $payload.wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewEvidence -eq $false
    wouldMarkReviewed = $payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewed -eq $false
    wouldCreateServiceRoleClient = $payload.wouldCreateServiceRoleClient -eq $false
    wouldRunTransaction = $payload.wouldRunTransaction -eq $false
    wouldWriteRows = $payload.wouldWriteRows -eq $false
    probeBlocked = $probe.blocked -eq $true
    probeWouldWriteRows = $probe.wouldWriteRows -eq $false
    probeNoGoAccepted = $probe.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted -eq $false
  }

  $failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
  if ($failed.Count -gt 0) {
    throw "Stage71 API invariant failures: $($failed -join ', ')"
  }

  Write-Output "STAGE71_API_OK"
}

function Assert-Stage72Api {
  $apiPath = "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation"
  $uri = "$($BaseUrl.TrimEnd('/'))$apiPath"
  $payload = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 30
  $itemId = $payload.stage72RemediationItems[0].id
  $probe = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body (@{ itemId = $itemId } | ConvertTo-Json -Compress) -TimeoutSec 30

  $checks = [ordered]@{
    remediationItemCount = $payload.remediationItemCount -eq 10
    externalEvidenceRemediationRequiredCount = $payload.externalEvidenceRemediationRequiredCount -eq 5
    manualReviewerRemediationRequiredCount = $payload.manualReviewerRemediationRequiredCount -eq 5
    remediationStillBlockedCount = $payload.remediationStillBlockedCount -eq 10
    sourceNoGoItemCount = $payload.sourceNoGoItemCount -eq 10
    sourceExternalEvidenceReviewNoGoCount = $payload.sourceExternalEvidenceReviewNoGoCount -eq 5
    sourceManualReviewerReviewNoGoCount = $payload.sourceManualReviewerReviewNoGoCount -eq 5
    sourceRemediationReviewStillBlockedCount = $payload.sourceRemediationReviewStillBlockedCount -eq 10
    remediationPlanReady = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady -eq $true
    remediationPlanOnly = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly -eq $true
    sourceNoGoPacketReady = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady -eq $true
    sourceNoGoPacketOnly = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly -eq $true
    remediationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted -eq $false
    remediationRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationRecorded -eq $false
    remediationStatesAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationStatesAccepted -eq $false
    sourceNoGoAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted -eq $false
    sourceNoGoRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded -eq $false
    sourceReviewAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewAccepted -eq $false
    sourceRemediationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationAccepted -eq $false
    finalAccepted = $payload.authorizationReconsiderationFinalDecisionAccepted -eq $false
    authorizationGranted = $payload.implementationAuthorizationGranted -eq $false
    implementationAuthorized = $payload.implementationAuthorized -eq $false
    readyForAdapter = $payload.readyForAdapterImplementation -eq $false
    allRuntimeEffectsBlocked = $payload.allRuntimeEffectsBlocked -eq $true
    wouldAcceptRemediation = $payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediation -eq $false
    wouldRecordRemediationEvidence = $payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationEvidence -eq $false
    wouldResolveBlocker = $payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoBlockerResolved -eq $false
    wouldCreateTicket = $payload.wouldCreateArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationTicket -eq $false
    wouldAcceptRemediationState = $payload.wouldAcceptArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationState -eq $false
    wouldPromoteToReview = $payload.wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview -eq $false
    wouldCreateServiceRoleClient = $payload.wouldCreateServiceRoleClient -eq $false
    wouldRunTransaction = $payload.wouldRunTransaction -eq $false
    wouldWriteRows = $payload.wouldWriteRows -eq $false
    probeBlocked = $probe.blocked -eq $true
    probeWouldWriteRows = $probe.wouldWriteRows -eq $false
    probeRemediationAccepted = $probe.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted -eq $false
  }

  $failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
  if ($failed.Count -gt 0) {
    throw "Stage72 API invariant failures: $($failed -join ', ')"
  }

  Write-Output "STAGE72_API_OK"
}

function Assert-Stage73Api {
  $apiPath = "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation-review"
  $uri = "$($BaseUrl.TrimEnd('/'))$apiPath"
  $payload = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 30
  $itemId = $payload.stage73RemediationReviewItems[0].id
  $probe = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body (@{ itemId = $itemId } | ConvertTo-Json -Compress) -TimeoutSec 30

  $checks = [ordered]@{
    reviewItemCount = $payload.reviewItemCount -eq 10
    externalEvidenceStillMissingCount = $payload.externalEvidenceStillMissingCount -eq 5
    manualReviewerStillRequiredCount = $payload.manualReviewerStillRequiredCount -eq 5
    stage72RemediationStillBlockedCount = $payload.stage72RemediationStillBlockedCount -eq 10
    sourceRemediationItemCount = $payload.sourceRemediationItemCount -eq 10
    sourceExternalEvidenceRemediationRequiredCount = $payload.sourceExternalEvidenceRemediationRequiredCount -eq 5
    sourceManualReviewerRemediationRequiredCount = $payload.sourceManualReviewerRemediationRequiredCount -eq 5
    sourceRemediationStillBlockedCount = $payload.sourceRemediationStillBlockedCount -eq 10
    checklistReady = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistReady -eq $true
    checklistOnly = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewChecklistOnly -eq $true
    sourcePlanReady = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady -eq $true
    sourcePlanOnly = $payload.sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly -eq $true
    reviewAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewAccepted -eq $false
    reviewRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewRecorded -eq $false
    reviewComplete = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewComplete -eq $false
    remediationAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted -eq $false
    remediationRecorded = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationRecorded -eq $false
    remediationStatesAccepted = $payload.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationStatesAccepted -eq $false
    finalAccepted = $payload.authorizationReconsiderationFinalDecisionAccepted -eq $false
    authorizationGranted = $payload.implementationAuthorizationGranted -eq $false
    implementationAuthorized = $payload.implementationAuthorized -eq $false
    readyForAdapter = $payload.readyForAdapterImplementation -eq $false
    allRuntimeEffectsBlocked = $payload.allRuntimeEffectsBlocked -eq $true
    wouldAcceptReview = $payload.wouldAcceptFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview -eq $false
    wouldRecordReview = $payload.wouldRecordFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReview -eq $false
    wouldStoreReviewEvidence = $payload.wouldStoreFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewEvidence -eq $false
    wouldMarkReviewed = $payload.wouldMarkArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewed -eq $false
    wouldPromoteToNoGo = $payload.wouldPromoteToArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewNoGo -eq $false
    wouldCreateServiceRoleClient = $payload.wouldCreateServiceRoleClient -eq $false
    wouldRunTransaction = $payload.wouldRunTransaction -eq $false
    wouldWriteRows = $payload.wouldWriteRows -eq $false
    probeBlocked = $probe.blocked -eq $true
    probeWouldWriteRows = $probe.wouldWriteRows -eq $false
    probeReviewAccepted = $probe.externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationReviewAccepted -eq $false
  }

  $failed = @($checks.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key })
  if ($failed.Count -gt 0) {
    throw "Stage73 API invariant failures: $($failed -join ', ')"
  }

  Write-Output "STAGE73_API_OK"
}

Push-Location $repoRoot
try {
  Invoke-CheckedCommand -Label "lint" -Command { & npm.cmd run lint }

  if (-not $SkipBuild) {
    Invoke-CheckedCommand -Label "build" -Command { & npm.cmd run build }
  }

  Write-Output "== secret scan =="
  & (Join-Path $PSScriptRoot "secret-scan.ps1")

  Write-Output "== migration guard =="
  Assert-OnlyInitialMigration

  Write-Output "== mojibake smoke scan =="
  Assert-NoMojibake

  Write-Output "== workspace leak guard =="
  Assert-NoTopLevelSrcLeak

  if ($Stage -eq "67") {
    Write-Output "== stage 67 API invariants =="
    Assert-Stage67Api
  }

  if ($Stage -eq "68") {
    Write-Output "== stage 68 API invariants =="
    Assert-Stage68Api
  }

  if ($Stage -eq "69") {
    Write-Output "== stage 69 API invariants =="
    Assert-Stage69Api
  }

  if ($Stage -eq "70") {
    Write-Output "== stage 70 API invariants =="
    Assert-Stage70Api
  }

  if ($Stage -eq "71") {
    Write-Output "== stage 71 API invariants =="
    Assert-Stage71Api
  }

  if ($Stage -eq "72") {
    Write-Output "== stage 72 API invariants =="
    Assert-Stage72Api
  }

  if ($Stage -eq "73") {
    Write-Output "== stage 73 API invariants =="
    Assert-Stage73Api
  }

  Write-Output "QA_STAGE_OK"
} finally {
  Pop-Location
}
