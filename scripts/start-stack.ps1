# Chạy từ thư mục repo (sau khi mở Docker Desktop trên Windows).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "Chua cai Docker. Cai Docker Desktop roi thu lai." -ForegroundColor Red
  exit 1
}

docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker daemon chua chay. Mo Docker Desktop, doi Engine Ready, roi chay lai script nay." -ForegroundColor Yellow
  exit 1
}

& node "$PSScriptRoot/generate-dev-jwt-keys.js"
docker compose up -d --build
Write-Host "Da khoi dong. Gateway: http://localhost:8081/health | MailDev: http://localhost:1080" -ForegroundColor Green
