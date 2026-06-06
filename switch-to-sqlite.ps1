# PowerShell script to switch Next.js dashboard database to SQLite
# Run this if you do not have PostgreSQL running locally!

Write-Host "Switching database provider to SQLite..." -ForegroundColor Indigo

# 1. Copy SQLite schema to active Prisma schema
if (Test-Path "prisma/schema.sqlite.prisma") {
    Copy-Item "prisma/schema.sqlite.prisma" "prisma/schema.prisma" -Force
    Write-Host "✓ Copied SQLite schema to prisma/schema.prisma" -ForegroundColor Green
} else {
    Write-Error "Could not find prisma/schema.sqlite.prisma!"
    Exit 1
}

# 2. Update .env file to use SQLite URL
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    # Replace DATABASE_URL with SQLite file path
    $envContent = $envContent -replace 'DATABASE_URL="[^"]*"', 'DATABASE_URL="file:./dev.db"'
    Set-Content ".env" $envContent -Force
    Write-Host "✓ Updated DATABASE_URL in .env to 'file:./dev.db'" -ForegroundColor Green
} else {
    Write-Warning ".env file not found. Copying from .env.example first."
    Copy-Item ".env.example" ".env" -Force
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace 'DATABASE_URL="[^"]*"', 'DATABASE_URL="file:./dev.db"'
    Set-Content ".env" $envContent -Force
    Write-Host "✓ Created .env and configured DATABASE_URL" -ForegroundColor Green
}

Write-Host "`nDatabase switched to SQLite!" -ForegroundColor Green
Write-Host "You can now run the following commands to initialize the database:" -ForegroundColor Yellow
Write-Host "1. npx prisma db push" -ForegroundColor Cyan
Write-Host "2. npx prisma db seed" -ForegroundColor Cyan
Write-Host "3. npm run dev" -ForegroundColor Cyan
