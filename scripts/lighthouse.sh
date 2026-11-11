#!/usr/bin/env bash
# GATE 5 : Lighthouse (profil mobile) sur le build de production servi en local.
# Usage : bash scripts/lighthouse.sh   (CHROME_PATH configurable)
set -euo pipefail
export CHROME_PATH="${CHROME_PATH:-/opt/pw-browsers/chromium}"
PORT=4175
OUT=artifacts/lighthouse
mkdir -p "$OUT"
npm run build >/dev/null
npx vite preview --port "$PORT" --strictPort --host 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
for i in $(seq 1 30); do curl -sf "http://127.0.0.1:$PORT" >/dev/null && break; sleep 0.5; done
for route in "/" "/progression" "/blocages" "/profil"; do
  name=$(echo "$route" | tr '/' '_'); name=${name:-_}
  npx -y lighthouse@12.8.2 "http://127.0.0.1:$PORT$route" --quiet \
    --only-categories=performance,accessibility,best-practices \
    --chrome-flags="--headless=new --no-sandbox" \
    --output=json --output-path="$OUT/lh$name.json" >/dev/null 2>&1
  node -e "const r=require('./$OUT/lh$name.json');const c=r.categories;console.log('$route'.padEnd(14), Object.values(c).map(x=>x.title+' '+Math.round(x.score*100)).join(' | '))"
done
