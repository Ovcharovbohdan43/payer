# GitHub account cleanup — delete repos (keep payer, desboard) and update profile.
# Run after: gh auth login
# If 403 on delete: gh auth refresh -h github.com -s delete_repo
# If profile update fails: gh auth refresh -h github.com -s user
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

$keep = @("payer", "desboard")
$allRepos = gh repo list Ovcharovbohdan43 --limit 200 --json name -q ".[].name" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Could not list repos. Check gh auth."
    exit 1
}
$reposToDelete = $allRepos | Where-Object { $keep -notcontains $_ }

if ($reposToDelete.Count -eq 0) {
    Write-Host "`nNo extra repositories to delete. Kept: $($keep -join ', ')." -ForegroundColor Green
} else {
    Write-Host "`nDeleting $($reposToDelete.Count) repositories (keeping: $($keep -join ', '))..." -ForegroundColor Cyan
    foreach ($name in $reposToDelete) {
        $repo = "Ovcharovbohdan43/$name"
        Write-Host "  Deleting $repo ..." -ForegroundColor Yellow
        gh repo delete $repo --yes 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Deleted $repo" -ForegroundColor Green
        } else {
            Write-Host "  Skip or error: $repo" -ForegroundColor DarkYellow
        }
    }
}

Write-Host "`nUpdating profile (bio, company, location, website)..." -ForegroundColor Cyan
gh api -X PATCH /user -f bio="Full-stack developer. Founder of Puyer - invoicing SaaS for freelancers and micro-businesses." -f company="Puyer Ltd." -f location="Wales" -f blog="https://www.puyer.org/" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Profile updated." -ForegroundColor Green
} else {
    Write-Host "  Profile update failed. Run: gh auth refresh -h github.com -s user" -ForegroundColor Red
}

Write-Host "`nDone. Kept: payer, desboard." -ForegroundColor Green
