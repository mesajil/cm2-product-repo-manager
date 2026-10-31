@echo off
chcp 65001 >nul
title Memory Kings - Generador de Repositorios de Producto

echo =======================================================
echo   MEMORY KINGS - GENERADOR DE REPOSITORIOS DE PRODUCTO
echo =======================================================
echo.

set NODE_EXE=

:: 1. Verificar si node está en el PATH
where node.exe >nul 2>nul
if not errorlevel 1 set "NODE_EXE=node.exe"
if defined NODE_EXE goto :FOUND

:: 2. Buscar en ubicaciones conocidas de la máquina
if exist "%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe" set "NODE_EXE=%LOCALAPPDATA%\Programs\cursor\resources\app\resources\helpers\node.exe"
if defined NODE_EXE goto :FOUND

if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if defined NODE_EXE goto :FOUND

if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"
if defined NODE_EXE goto :FOUND

if exist "%ProgramFiles%\Adobe\Adobe Photoshop 2020\node.exe" set "NODE_EXE=%ProgramFiles%\Adobe\Adobe Photoshop 2020\node.exe"

:FOUND
if not defined NODE_EXE (
    echo [ERROR] No se encontro el ejecutable de Node.js en el sistema.
    echo Por favor instale Node.js o verifique los ejecutables en AppData.
    pause
    exit /b 1
)

echo [OK] Motor Node.js detectado:
echo      "%NODE_EXE%"
echo.
echo Iniciando servidor en http://localhost:3456 ...
echo Abriendo aplicacion en el navegador predeterminado...
echo.

:: Anadir al PATH la carpeta del ejecutable; ejecutar node.exe sin comillas
:: tambien funciona cuando el ejecutable ya estaba disponible en el PATH.
for %%I in ("%NODE_EXE%") do set "PATH=%%~dpI;%PATH%"

:: Abrir navegador tras un breve retraso
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3456"

:: Ejecutar servidor
cd /d "%~dp0"
node.exe server.js

pause
