#!/usr/bin/env bash
# Build and publish sousadev.com on this machine (Caddy + systemd).
#
#   scripts/deploy.sh             pull main, build, verify, publish a new release
#   scripts/deploy.sh --no-pull   publish the working tree as it is
#   scripts/deploy.sh rollback    switch back to the previous release
#
# scripts/auto-deploy.sh calls this from the systemd timers in deploy/: on every
# push to main, and once a night.
#
# Each release lives in /srv/sousadev/releases/<time>-<commit> and
# /srv/sousadev/current points at the live one, so a switch is atomic and a
# failed build never touches the running site. The server config in deploy/ is
# reinstalled on every run so the machine always matches the repository.
set -euo pipefail

BASE=/srv/sousadev
RELEASES="$BASE/releases"
KEEP=5
ENV_FILE=/etc/sousadev/proposal.env
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf '\n==> %s\n' "$*"; }

# One deploy at a time, whether started by hand or by a timer.
exec 9>/run/lock/sousadev-deploy.lock
flock -w 1200 9 || { echo "another deploy is still running" >&2; exit 1; }

activate() {
  sudo ln -sfn "$1" "$BASE/current.next"
  sudo mv -T "$BASE/current.next" "$BASE/current"
  sudo systemctl restart sousadev-proposal
  sudo systemctl reload caddy
}

check_endpoint() {
  # A GET must reach the handler and be refused with 405.
  for _ in 1 2 3 4 5; do
    code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8787/api/proposal || true)
    [[ "$code" == 405 ]] && return 0
    sleep 1
  done
  echo "proposal endpoint is not answering (last status: $code)" >&2
  return 1
}

if [[ "${1:-}" == rollback ]]; then
  current=$(readlink -f "$BASE/current")
  previous=$(ls -1d "$RELEASES"/*/ | sed 's:/$::' | grep -vxF "$current" | sort | tail -n 1)
  [[ -n "$previous" ]] || { echo "no previous release to roll back to" >&2; exit 1; }
  log "Rolling back to $(basename "$previous")"
  activate "$previous"
  check_endpoint
  sudo rm -rf "$current"
  log "Live: $(basename "$previous")"
  exit 0
fi

cd "$REPO"

if [[ "${1:-}" != --no-pull ]]; then
  log "Pulling main"
  git pull --ff-only
fi

[[ -f "$ENV_FILE" ]] || echo "warning: $ENV_FILE is missing; the form will answer 503" >&2

log "Installing dependencies"
npm ci --no-audit --no-fund

log "Building"
npm run build
npm run check:output

release="$RELEASES/$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short HEAD)"
log "Staging $(basename "$release")"
sudo mkdir -p "$release/server"
sudo rsync -a --delete dist/ "$release/public/"
sudo install -m 644 server/proposal-handler.mjs server/node-server.mjs "$release/server/"
sudo chmod -R a+rX "$release"

log "Installing server config"
out=$(sudo caddy validate --config deploy/Caddyfile --adapter caddyfile 2>&1) || { echo "$out" >&2; exit 1; }
sudo install -m 644 deploy/Caddyfile /etc/caddy/Caddyfile
for unit in deploy/*.service deploy/*.timer; do
  sudo install -m 644 "$unit" "/etc/systemd/system/$(basename "$unit")"
done
sudo systemctl daemon-reload
sudo systemctl enable --quiet sousadev-proposal
sudo systemctl enable --quiet --now sousadev-autodeploy.timer sousadev-nightly-deploy.timer

log "Switching to the new release"
previous=$(readlink -f "$BASE/current" 2>/dev/null || true)
activate "$release"
if ! check_endpoint; then
  if [[ -n "$previous" && -d "$previous" ]]; then
    echo "restoring $(basename "$previous")" >&2
    activate "$previous"
  fi
  exit 1
fi

log "Pruning old releases (keeping $KEEP)"
ls -1d "$RELEASES"/*/ | sed 's:/$::' | sort | head -n -"$KEEP" | xargs -r sudo rm -rf

log "Live: $(basename "$release")"
