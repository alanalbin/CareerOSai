@echo off
echo Setting up portable Git...
set PATH=C:\Users\User\Downloads\MinGit\cmd;%PATH%

echo.
echo Initializing repository and adding files...
git init
echo (Ignoring node_modules automatically via .gitignore...)
git add .
git commit -m "Initial commit - Career OS Production Build"

echo.
echo Setting up GitHub connection...
git branch -M main
git remote add origin https://github.com/alanalbin/CareerOSai.git

echo.
echo Pushing to GitHub (A login window may pop up!)...
git push -u origin main -f

echo.
echo Done!
pause
