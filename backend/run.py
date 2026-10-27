"""
Run the backend locally:  python run.py

First run creates ./venv and installs requirements.txt; later runs reinstall
only when requirements.txt changes. Then starts script.py on PORT (5001).
"""
import hashlib
import os
import subprocess
import sys
import venv
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV = ROOT / "venv"
PY = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
REQS = ROOT / "requirements.txt"
STAMP = VENV / ".requirements.sha256"


def ensure_venv():
    if not PY.exists():
        print("Creating virtual environment (first run only)...")
        venv.create(VENV, with_pip=True)
    digest = hashlib.sha256(REQS.read_bytes()).hexdigest()
    if not STAMP.exists() or STAMP.read_text().strip() != digest:
        print("Installing backend packages (takes a few minutes the first time)...")
        subprocess.check_call([str(PY), "-m", "pip", "install", "-r", str(REQS)])
        STAMP.write_text(digest)


def main():
    ensure_venv()
    print("Starting backend on http://localhost:5001  (Ctrl+C to stop)")
    try:
        sys.exit(subprocess.call([str(PY), "script.py"], cwd=ROOT))
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
