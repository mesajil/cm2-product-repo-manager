# Memory Kings - Generador de Repositorios de Producto (PowerShell Launcher)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  MEMORY KINGS - GENERADOR DE REPOSITORIOS DE PRODUCTO " -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan

$nodePaths = @(
    "node",
    "$env:LOCALAPPDATA\Programs\cursor\resources\app\resources\helpers\node.exe",
    "$env:ProgramFiles\nodejs\node.exe",
    "${env:ProgramFiles(x86)}\nodejs\node.exe",
    "$env:ProgramFiles\Adobe\Adobe Photoshop 2020\node.exe"
)

$nodeExe = $null

foreach ($p in $nodePaths) {
    if ($p -eq "node") {
        $cmd = Get-Command node -ErrorAction SilentlyContinue
        if ($cmd) {
            $nodeExe = "node"
            break
        }
    } elseif (Test-Path $p) {
        $nodeExe = $p
        break
    }
}

if (-not $nodeExe) {
    Write-Host "[ERROR] No se encontró el ejecutable de Node.js." -ForegroundColor Red
    Pause
    exit 1
}

Write-Host "[OK] Motor Node.js detectado en: $nodeExe" -ForegroundColor Green
Write-Host "Iniciando servidor en http://localhost:3456 ..." -ForegroundColor White

# Iniciar navegador en segundo plano tras 2 segundos
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3456"
} | Out-Null

Set-Location -Path $PSScriptRoot
& $nodeExe server.js
