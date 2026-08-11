# Sync selected local .env keys to Vercel Production (no secret echo).
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

function Get-DotEnvMap([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  foreach ($line in Get-Content $path) {
    if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("#")) { continue }
    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { continue }
    $key = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $map[$key] = $value
  }
  return $map
}

$map = Get-DotEnvMap $envFile

$keys = @(
  "JWT_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "INTOUCHPAY_USERNAME",
  "INTOUCHPAY_ACCOUNT_NUMBER",
  "INTOUCHPAY_PARTNER_PASSWORD",
  "INTOUCHPAY_BASE_URL",
  "INTOUCHPAY_ENV",
  "INTOUCHPAY_CALLBACK_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_FROM_NAME",
  "SUPPORT_EMAIL"
)

if (-not $map["NEXT_PUBLIC_APP_URL"]) { $map["NEXT_PUBLIC_APP_URL"] = "https://www.ituzebnb.com" }
if (-not $map["INTOUCHPAY_CALLBACK_URL"]) { $map["INTOUCHPAY_CALLBACK_URL"] = "https://www.ituzebnb.com/api/payment/intouchpay/callback" }

$set = 0
$skipped = @()
$failed = @()

foreach ($key in $keys) {
  $value = $map[$key]
  if ([string]::IsNullOrWhiteSpace($value)) {
    $skipped += $key
    continue
  }

  $temp = [System.IO.Path]::GetTempFileName()
  try {
    [System.IO.File]::WriteAllText($temp, $value)
    if ($key.StartsWith("NEXT_PUBLIC_")) {
      cmd /c "type `"$temp`" | vercel env add $key production --force"
    } else {
      cmd /c "type `"$temp`" | vercel env add $key production --force --sensitive"
    }
    if ($LASTEXITCODE -eq 0) {
      Write-Host "SET $key"
      $set++
    } else {
      Write-Host "FAILED $key (exit $LASTEXITCODE)"
      $failed += $key
    }
  } finally {
    Remove-Item -Force $temp -ErrorAction SilentlyContinue
  }
}

Write-Host "Done. set=$set skipped=$($skipped -join ',') failed=$($failed -join ',')"
