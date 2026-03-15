# GitHub account cleanup — delete repos (keep payer, desboard) and update profile.
# Run after: gh auth login
# Usage: .\scripts\github-cleanup.ps1

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) not found. Install from https://cli.github.com/ then run: gh auth login"
    exit 1
}

Write-Host "Checking gh auth status..." -ForegroundColor Cyan
$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Not logged in. Run: gh auth login"
    exit 1
}

$reposToDelete = @(
    "Ovcharovbohdan43/consoleJsProject",
    "Ovcharovbohdan43/exgo",
    "Ovcharovbohdan43/hush_v2",
    "Ovcharovbohdan43/ovcharovbohdan43.github.io"
)

Write-Host "`nDeleting repositories..." -ForegroundColor Cyan
foreach ($repo in $reposToDelete) {
    Write-Host "  Deleting $repo ..." -ForegroundColor Yellow
    gh repo delete $repo --yes 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Deleted $repo" -ForegroundColor Green
    } else {
        Write-Host "  Skip or error (maybe already deleted): $repo" -ForegroundColor DarkYellow
    }
}

Write-Host "`nUpdating profile (bio, company, location, website)..." -ForegroundColor Cyan
gh api -X PATCH /user -f bio="WEB - developer, founder of Puyer" -f company="Puyer Ltd." -f location="Wales" -f blog="https://www.puyer.org/" | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Profile updated." -ForegroundColor Green
} else {
    Write-Host "  Profile update failed (check gh auth)." -ForegroundColor Red
}

Write-Host "`nDone. Kept: payer, desboard." -ForegroundColor Green
