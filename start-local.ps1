# AI Adaptive Interview Coach - One-Click Local Launcher (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting AI Adaptive Interview Coach (100% Local Stack)  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ProjectRoot = $PSScriptRoot

# 1. Start FastAPI Local Backend
Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
$BackendScript = "Set-Location '$ProjectRoot'; & '$ProjectRoot\backend\.venv\Scripts\python.exe' -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendScript

# Wait for Backend startup
Start-Sleep -Seconds 3

# 2. Start Vite React Frontend
Write-Host "[2/2] Starting Vite Frontend on http://127.0.0.1:5173..." -ForegroundColor Yellow
$FrontendScript = "Set-Location '$ProjectRoot\frontend'; \$env:Path = 'C:\Users\ayush\AppData\Local\Programs\nodejs;' + \$env:Path; npm run dev -- --host 127.0.0.1"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendScript

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS! Services Launched Locally:                      " -ForegroundColor Green
Write-Host "  • React Frontend UI:  http://127.0.0.1:5173           " -ForegroundColor White
Write-Host "  • FastAPI Backend:    http://127.0.0.1:8000           " -ForegroundColor White
Write-Host "  • API Documentation:  http://127.0.0.1:8000/docs      " -ForegroundColor White
Write-Host "  • SQLite DB File:     backend/data/interview_coach.db " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
