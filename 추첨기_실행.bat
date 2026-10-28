@echo off
chcp 65001 > nul
title 발표 순서 및 랜덤 뽑기 아케이드
cd /d "%~dp0"

echo ====================================================
echo   🎮 발표 순서 및 랜덤 뽑기 아케이드 (Classroom Arcade)
echo ====================================================
echo.
echo [1] 로컬 호스트(http://localhost:8080) 서버 확인 중...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$open = $false; try { $c = New-Object System.Net.Sockets.TcpClient; $ar = $c.BeginConnect('127.0.0.1', 8080, $null, $null); $open = $ar.AsyncWaitHandle.WaitOne(500); $c.Close() } catch {}; if (-not $open) { Write-Host '서버를 시작합니다...'; $s = Join-Path (Get-Location).Path 'server.ps1'; Start-Process powershell -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File \"' + $s + '\" -Port 8080') -WindowStyle Hidden; Start-Sleep -Seconds 1 } else { Write-Host '서버가 이미 실행 중입니다.' }"

echo.
echo [2] 웹 브라우저를 엽니다...
start http://localhost:8080

echo.
echo ✅ 실행 완료! 웹 브라우저에서 추첨기를 이용하세요.
echo    (이 창은 3초 후 자동으로 닫힙니다.)
timeout /t 3 > nul
exit
