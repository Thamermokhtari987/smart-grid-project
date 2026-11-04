# SMARTGRID Platform Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "⚡ Starting SMARTGRID Intelligent Energy Management Platform" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

# Run npm run dev to launch both Backend API and Frontend Client concurrently
npm run dev
