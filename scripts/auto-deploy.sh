#!/usr/bin/env bash
# Unattended deploys, run by the systemd timers in deploy/.
#
#   scripts/auto-deploy.sh           deploy only if origin/main moved
#   scripts/auto-deploy.sh --force   deploy even if nothing changed (nightly)
#
# A commit that fails to deploy is remembered, so the minute timer does not
# rebuild it again and again; the next push, or the nightly run, tries again.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILED="$REPO/.git/auto-deploy-failed"
cd "$REPO"

git fetch --quiet origin main
local_head=$(git rev-parse HEAD)
remote_head=$(git rev-parse origin/main)

if [[ "${1:-}" != --force ]]; then
  [[ "$local_head" == "$remote_head" ]] && exit 0
  [[ -f "$FAILED" && "$(cat "$FAILED")" == "$remote_head" ]] && exit 0
  echo "main moved: ${local_head:0:7} -> ${remote_head:0:7}"
fi

if scripts/deploy.sh; then
  rm -f "$FAILED"
else
  echo "$remote_head" > "$FAILED"
  echo "deploy of ${remote_head:0:7} failed; the live site is unchanged" >&2
  exit 1
fi
