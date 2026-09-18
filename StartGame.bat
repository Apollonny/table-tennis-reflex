@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Masa Tenisi - Web Oyunu
cd /d "%~dp0"

echo 3D Masa Tenisi Oyunu Baslatiliyor...
echo.

set "PORT="
for /L %%P in (8765,1,8775) do (
    if not defined PORT (
        netstat -ano | findstr /R /C:":%%P .*LISTENING" >nul 2>&1
        if errorlevel 1 set "PORT=%%P"
    )
)

if not defined PORT (
    echo HATA: 8765-8775 araliginda bos port bulunamadi.
    pause
    exit /b 1
)

where py >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=py -3"
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo HATA: Python bulunamadi. Python 3 kurup tekrar deneyin.
        pause
        exit /b 1
    )
    set "PY_CMD=python"
)

echo Sunucu portu: !PORT!
start "TableTennisServer-!PORT!" /min cmd /c "!PY_CMD! -m http.server !PORT! --bind 127.0.0.1"

set "SERVER_READY="
for /L %%R in (1,1,8) do (
    if not defined SERVER_READY (
        powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 'http://127.0.0.1:!PORT!/index.html'; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
        if not errorlevel 1 set "SERVER_READY=1"
        if not defined SERVER_READY timeout /t 1 /nobreak >nul
    )
)

if not defined SERVER_READY (
    echo HATA: Yerel oyun sunucusu baslatilamadi. Port: !PORT!
    echo Acik Python sunucularini kapatip tekrar deneyin.
    pause
    exit /b 1
)

start "" "http://127.0.0.1:!PORT!/index.html"

echo.
echo Oyun tarayicida acildi: http://127.0.0.1:!PORT!/index.html
echo Sunucu ayri pencerede calisiyor.
pause
endlocal
