# Build and package for cPanel deployment
# Run this script from the project root
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\build-and-package-cpanel.ps1

param(
    [string]$OutputZip = "cpanel-standalone.zip"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Consensus AI Detector - cPanel Build & Package" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectRoot

# Step 1: Generate Prisma client with all Linux targets
Write-Host "[1/5] Generating Prisma client (with Linux binary targets)..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: prisma generate failed" -ForegroundColor Red; exit 1 }
Write-Host "     OK" -ForegroundColor Green

# Step 2: Build Next.js app
Write-Host "[2/5] Building Next.js app (this takes 2-5 minutes)..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm run build failed" -ForegroundColor Red; exit 1 }
Write-Host "     Build complete!" -ForegroundColor Green

# Step 3: Copy static assets into standalone directory (required!)
Write-Host "[3/5] Copying static assets into standalone directory..." -ForegroundColor Yellow
$standaloneDir = Join-Path $ProjectRoot ".next\standalone"
$staticSrc     = Join-Path $ProjectRoot ".next\static"
$staticDst     = Join-Path $standaloneDir ".next\static"
$publicSrc     = Join-Path $ProjectRoot "public"
$publicDst     = Join-Path $standaloneDir "public"

if (!(Test-Path $standaloneDir)) {
    Write-Host "ERROR: .next/standalone not found. Did the build fail?" -ForegroundColor Red
    exit 1
}

if (Test-Path $staticSrc) {
    Write-Host "     Copying .next/static -> standalone/.next/static"
    if (Test-Path $staticDst) { Remove-Item $staticDst -Recurse -Force }
    Copy-Item $staticSrc $staticDst -Recurse
}
if (Test-Path $publicSrc) {
    Write-Host "     Copying public -> standalone/public"
    if (Test-Path $publicDst) { Remove-Item $publicDst -Recurse -Force }
    Copy-Item $publicSrc $publicDst -Recurse
}

# Also copy the Prisma schema into standalone
$prismaSrc = Join-Path $ProjectRoot "prisma"
$prismaDst = Join-Path $standaloneDir "prisma"
if (Test-Path $prismaSrc) {
    Write-Host "     Copying prisma schema -> standalone/prisma"
    if (Test-Path $prismaDst) { Remove-Item $prismaDst -Recurse -Force }
    Copy-Item $prismaSrc $prismaDst -Recurse
}

Write-Host "     OK" -ForegroundColor Green

# Step 4: Copy server.js and package.json into standalone
Write-Host "[4/5] Copying startup files..." -ForegroundColor Yellow
Copy-Item (Join-Path $ProjectRoot "server.js") (Join-Path $standaloneDir "server.js") -Force
# Create a minimal package.json in standalone
$minimalPkg = @{
    name    = "ai-detection-dashboard"
    version = "0.1.0"
    private = $true
    scripts = @{
        start = "node server.js"
    }
} | ConvertTo-Json -Depth 3
Set-Content (Join-Path $standaloneDir "package.json") $minimalPkg
Write-Host "     OK" -ForegroundColor Green

# Step 5: Create ZIP
Write-Host "[5/5] Creating deployment ZIP: $OutputZip ..." -ForegroundColor Yellow
$zipPath = Join-Path $ProjectRoot $OutputZip
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Use Compress-Archive to zip the standalone folder contents
Compress-Archive -Path "$standaloneDir\*" -DestinationPath $zipPath -CompressionLevel Optimal
$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "     Created: $OutputZip ($sizeMB MB)" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " DONE! Deployment package ready." -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Upload '$OutputZip' to cPanel File Manager" -ForegroundColor White
Write-Host "     -> /home/cliqterc/ai.cliqter.com/" -ForegroundColor Gray
Write-Host "  2. Extract it there (overwrites existing files)" -ForegroundColor White
Write-Host "  3. In cPanel Node.js App: set startup file = server.js" -ForegroundColor White
Write-Host "  4. Click STOP then START to restart the app" -ForegroundColor White
Write-Host "  5. Visit https://ai.cliqter.com" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT - Set these env vars in Node.js App settings:" -ForegroundColor Yellow
Write-Host "  DATABASE_URL           = file:./prisma/prod.db" -ForegroundColor Gray
Write-Host "  JWT_SECRET             = super-secret-jwt-cookie-auth-key-change-me-in-production" -ForegroundColor Gray
Write-Host "  ENCRYPTION_KEY         = 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" -ForegroundColor Gray
Write-Host "  NODE_ENV               = production" -ForegroundColor Gray
Write-Host "  NEXT_PUBLIC_APP_URL    = https://ai.cliqter.com" -ForegroundColor Gray
Write-Host "  SAPLING_API_KEY        = 2V13OCMOO5RTBKUHCPT4F7IY6CWLK9W6" -ForegroundColor Gray
Write-Host "  WASITAIGENERATED_API_KEY = wai_cvkrqASo5b27rld2h4MFgo8cu7zCSuiS" -ForegroundColor Gray
