#!/usr/bin/env bash
# GitaSaar — Data collection environment setup
# Works on macOS and Linux.
# Usage: cd data-collection && bash setup.sh

set -e  # exit on any error

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GitaSaar — data-collection setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Find python3 ───────────────────────────────────────────────────────────

PYTHON=""
for candidate in python3 python3.12 python3.11 python3.10 python3.9 python3.8; do
  if command -v "$candidate" &>/dev/null; then
    PYTHON="$candidate"
    break
  fi
done

if [ -z "$PYTHON" ]; then
  echo "❌  Python 3 not found."
  echo ""
  echo "    Install it with one of:"
  echo "      Homebrew (macOS):  brew install python"
  echo "      Official:          https://www.python.org/downloads/"
  exit 1
fi

PY_VERSION=$($PYTHON -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "✓  Found $PYTHON ($PY_VERSION)"

# Require Python >= 3.8
PY_MINOR=$($PYTHON -c "import sys; print(sys.version_info.minor)")
PY_MAJOR=$($PYTHON -c "import sys; print(sys.version_info.major)")
if [ "$PY_MAJOR" -lt 3 ] || { [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 8 ]; }; then
  echo "❌  Python 3.8+ required (found $PY_VERSION)."
  exit 1
fi

# ── 2. Create virtual environment ─────────────────────────────────────────────

VENV_DIR=".venv"

if [ -d "$VENV_DIR" ]; then
  echo "✓  Virtual environment already exists ($VENV_DIR/)"
else
  echo "→  Creating virtual environment in $VENV_DIR/ ..."
  $PYTHON -m venv "$VENV_DIR"
  echo "✓  Virtual environment created"
fi

# ── 3. Install dependencies ───────────────────────────────────────────────────

echo "→  Installing dependencies from requirements.txt ..."
"$VENV_DIR/bin/python" -m pip install --upgrade pip --quiet
"$VENV_DIR/bin/pip"    install -r requirements.txt --quiet
echo "✓  Dependencies installed"

# ── 4. Done ───────────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Activate the venv:"
echo "    source $VENV_DIR/bin/activate"
echo ""
echo "  Then run the data fetcher:"
echo "    python3 fetch_gita_data.py          # all 18 chapters"
echo "    python3 fetch_gita_data.py 1 3      # chapters 1–3 only"
echo ""
echo "  Or without activating the venv:"
echo "    $VENV_DIR/bin/python fetch_gita_data.py"
echo ""
