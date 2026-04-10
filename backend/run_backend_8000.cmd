@echo off
setlocal

REM Ensure we run from the backend directory even if launched elsewhere.
cd /d "%~dp0"

REM Use local dependency bundle so we don't depend on global site-packages.
set "PYTHONPATH=%~dp0_pydeps"

python main.py 1> backend-8000.out.log 2> backend-8000.err.log
