#!/usr/bin/env bash
set -euo pipefail

TAR=/tmp/demo-project-intranet.tar.gz
NGINX_SRC=/tmp/prototypes.nginx.conf
DEST=/data/www/demo-project

if [ ! -f "$TAR" ]; then
  echo "missing $TAR" >&2
  exit 1
fi

echo "== stop catalog process =="
curl -sS -X POST http://127.0.0.1:8799/_api/projects/demo-project/stop || true
sleep 1
sudo fuser -k 4179/tcp 2>/dev/null || true
sudo fuser -k 8787/tcp 2>/dev/null || true
sudo fuser -k 8790/tcp 2>/dev/null || true
sleep 1

echo "== replace project dir =="
if [ -d "$DEST" ]; then
  STAMP=$(date +%Y%m%d%H%M%S)
  sudo rm -rf "/tmp/demo-project.bak.$STAMP"
  sudo mv "$DEST" "/tmp/demo-project.bak.$STAMP"
fi
sudo mkdir -p "$DEST"
sudo tar -xzf "$TAR" -C "$DEST"
sudo chown -R ubuntu:ubuntu "$DEST"
chmod +x "$DEST/start.sh" "$DEST/scripts/"*.sh "$DEST/scripts/run_intranet.py" || true

echo "== python venv =="
command -v python3
python3 --version
if [ ! -x "$DEST/.venv/bin/python" ]; then
  bash "$DEST/scripts/bootstrap-venv.sh"
fi

echo "== nginx =="
if [ -f "$NGINX_SRC" ]; then
  sudo cp "$NGINX_SRC" /etc/nginx/sites-available/prototypes
  sudo nginx -t
  sudo systemctl reload nginx
fi

echo "== catalog start command =="
python3 - <<'PY'
import json
from pathlib import Path
p = Path("/data/www/_meta.json")
meta = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
item = meta.get("demo-project") or {}
item["displayName"] = item.get("displayName") or "AI运营助手"
item["startCommand"] = "PYTHONUNBUFFERED=1 python3 scripts/run_intranet.py"
item["port"] = 4179
item["openUrl"] = "/demo-project/"
meta["demo-project"] = item
p.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(item, ensure_ascii=False, indent=2))
PY

echo "== start via catalog =="
curl -sS -X POST http://127.0.0.1:8799/_api/projects/demo-project/start
echo
sleep 3
echo "== health =="
curl -sS http://127.0.0.1:8787/health || true
echo
curl -sS http://127.0.0.1:8790/health || true
echo
curl -sS -o /dev/null -w "web4179:%{http_code}\n" http://127.0.0.1:4179/ || true
curl -sS -o /dev/null -w "nginx_demo:%{http_code}\n" http://127.0.0.1/demo-project/ || true
curl -sS -o /dev/null -w "nginx_chat:%{http_code}\n" http://127.0.0.1/_chat/health || true
echo "== catalog status =="
curl -sS http://127.0.0.1:8799/_api/projects | python3 -c "import sys,json; d=json.load(sys.stdin); print([p for p in d.get('projects',[]) if p.get('id')=='demo-project'][0])"
echo "== done =="
