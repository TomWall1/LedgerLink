@echo off
echo LedgerLink Development Environment Starter
echo -------------------------------------------

:: Check if MongoDB is running
echo Checking MongoDB service status...
sc query MongoDB > nul
if %ERRORLEVEL% equ 0 (
  echo MongoDB service exists, checking if it's running...
  sc query MongoDB | findstr "RUNNING" > nul
  if %ERRORLEVEL% equ 0 (
    echo MongoDB is running.
  ) else (
    echo MongoDB is not running. Starting MongoDB service...
    net start MongoDB
    if %ERRORLEVEL% equ 0 (
      echo MongoDB service started successfully.
    ) else (
      echo Failed to start MongoDB service.
      pause
      exit /b 1
    )
  )
) else (
  echo MongoDB service is not installed or not configured as a Windows service.
  echo Please install MongoDB and configure it as a Windows service.
  echo See: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/
  pause
  exit /b 1
)

:: Kill any process that might be using our port
echo Looking for processes using port 3002...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3002') DO (
  echo Found process with PID: %%P using port 3002. Attempting to terminate...
  taskkill /F /PID %%P
  if %ERRORLEVEL% equ 0 (
    echo Successfully terminated process.
  ) else (
    echo Failed to terminate process. Please close the application using port 3002 manually.
  )
)

:: Start the development server
echo Starting LedgerLink backend server...
cd %~dp0
npm run dev

pause
