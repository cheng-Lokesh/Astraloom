param(
  [string]$BaseUrl = "http://localhost:3000",
  [Parameter(Mandatory = $true)]
  [string]$PagePath,
  [Parameter(Mandatory = $true)]
  [string]$ApiPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$pageUri = "$($BaseUrl.TrimEnd('/'))/$($PagePath.TrimStart('/'))"
$apiUri = "$($BaseUrl.TrimEnd('/'))/$($ApiPath.TrimStart('/'))"

$pageResponse = Invoke-WebRequest -Uri $pageUri -UseBasicParsing -TimeoutSec 20
$apiResponse = Invoke-WebRequest -Uri $apiUri -UseBasicParsing -TimeoutSec 20

[pscustomobject]@{
  pageUri = $pageUri
  pageStatus = $pageResponse.StatusCode
  apiUri = $apiUri
  apiStatus = $apiResponse.StatusCode
  ok = ($pageResponse.StatusCode -ge 200 -and $pageResponse.StatusCode -lt 300 -and $apiResponse.StatusCode -ge 200 -and $apiResponse.StatusCode -lt 300)
} | Format-List

if ($pageResponse.StatusCode -lt 200 -or $pageResponse.StatusCode -ge 300 -or $apiResponse.StatusCode -lt 200 -or $apiResponse.StatusCode -ge 300) {
  exit 1
}
