@echo off
echo Building LNReader for Windows...

cd /d "%~dp0\..\windows"

echo Installing dependencies...
call yarn install

echo Building Windows app...
call npx react-native run-windows --release --no-packager

echo Creating installer...
call npx electron-builder --win

echo Windows build complete!
echo Installer created in: dist/LNReader-Setup.exe

pause