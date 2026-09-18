#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
python3 -m venv .venv
.venv/bin/pip install -U pip
.venv/bin/pip install --no-cache-dir -r server/agent-bridge/requirements.txt
echo "venv ready: $ROOT/.venv"
