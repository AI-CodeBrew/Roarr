@echo off
rem Local dev: starts the Flask backend (http://127.0.0.1:5001) in its own window,
rem then the Shopify app dev server. The local frontend reaches this backend via
rem PYTHON_API_URL in frontend\.env; the live app uses Vercel's PYTHON_API_URL.

set "ROOT=%~dp0"

start "Roarr backend" cmd /k "cd /d "%ROOT%backend" && python run.py"

cd /d "%ROOT%frontend"
npm run dev
