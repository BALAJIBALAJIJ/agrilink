@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
set "MAVEN_OPTS=--enable-native-access=ALL-UNNAMED"

REM Check if Maven is available
where mvn >nul 2>&1
if %errorlevel%==0 (
    mvn %*
    exit /b %errorlevel%
)

REM Check for local Maven installation
set "LOCAL_MAVEN=%MAVEN_PROJECTBASEDIR%.mvn\maven\bin\mvn.cmd"
if exist "%LOCAL_MAVEN%" (
    call "%LOCAL_MAVEN%" %*
    exit /b %errorlevel%
)

REM Download Maven
echo Maven not found. Downloading Apache Maven 3.9.6...
set "MAVEN_URL=https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
set "MAVEN_ZIP=%MAVEN_PROJECTBASEDIR%.mvn\maven.zip"
set "MAVEN_DIR=%MAVEN_PROJECTBASEDIR%.mvn\maven"

mkdir "%MAVEN_DIR%" 2>nul
powershell -Command "& {Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_ZIP%' -UseBasicParsing}"
powershell -Command "& {Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%MAVEN_DIR%' -Force}"

REM Move contents up one level
for /d %%i in ("%MAVEN_DIR%\apache-maven-*") do (
    xcopy "%%i\*" "%MAVEN_DIR%\" /s /e /y /q >nul
    rd "%%i" /s /q
)

del "%MAVEN_ZIP%" 2>nul

call "%LOCAL_MAVEN%" %*
exit /b %errorlevel%
