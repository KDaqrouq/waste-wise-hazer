@echo off
chcp 65001 >nul
echo 🚀 Starting Waste Wise Hazer...
echo ================================

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.9 or higher.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Start backend
echo 🐍 Starting Python backend...
cd backend

REM Check if virtual environment exists, create if not
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Run setup (install requirements, download the model) whenever requirements.txt changes.
REM The marker is only written after setup succeeds, so a failed install is retried next time.
fc /b requirements.txt venv\.requirements_installed >nul 2>nul
if errorlevel 1 (
    echo 📦 Installing Python requirements...
    python setup.py
    if errorlevel 1 (
        echo ❌ Backend setup failed. Fix the error above and run start.bat again.
        pause
        exit /b 1
    )
    copy /y requirements.txt venv\.requirements_installed >nul
)

REM Start Flask server in a new window
echo 🚀 Starting Flask server on http://localhost:5000
start "Backend Server" python app.py

cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo ⚛️  Starting React frontend...

REM Install npm dependencies if not already installed
if not exist "node_modules" (
    echo 📦 Installing npm dependencies...
    call npm install
)

REM Start Vite dev server
echo 🚀 Starting Vite dev server on http://localhost:8080
start "Frontend Server" npm run dev

echo.
echo 🎉 Both servers are starting up!
echo ================================
echo 🌐 Frontend: http://localhost:8080
echo 🐍 Backend:  http://localhost:5000
echo 📊 Health:   http://localhost:5000/api/health
echo.
echo Both servers are now running in separate windows.
echo Close the windows to stop the servers.
echo.
pause
