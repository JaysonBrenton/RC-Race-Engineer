#!/usr/bin/env bash
# filepath: scripts/git_ssh_fix.sh
set -euo pipefail

echo "==> Detecting repo root..."
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${REPO_ROOT}" ]]; then
  echo "ERROR: Not inside a git repo. cd into your project then re-run." >&2
  exit 1
fi
cd "$REPO_ROOT"
echo "    $REPO_ROOT"

echo "==> Reading current 'origin' URL..."
ORIGIN_URL="$(git config --get remote.origin.url || true)"
if [[ -z "${ORIGIN_URL}" ]]; then
  echo "ERROR: No 'origin' remote found. Add one, e.g.: git remote add origin git@github.com:<owner>/<repo>.git" >&2
  exit 1
fi
echo "    origin = $ORIGIN_URL"

echo "==> Parsing owner/repo..."
OWNER=""; REPO=""
if [[ "$ORIGIN_URL" =~ ^https://github\.com/([^/]+)/([^/\.]+)(\.git)?$ ]]; then
  OWNER="${BASH_REMATCH[1]}"; REPO="${BASH_REMATCH[2]}"
elif [[ "$ORIGIN_URL" =~ ^git@github\.com:([^/]+)/([^/\.]+)(\.git)?$ ]]; then
  OWNER="${BASH_REMATCH[1]}"; REPO="${BASH_REMATCH[2]}"
else
  echo "ERROR: Unrecognized remote format: $ORIGIN_URL" >&2
  exit 1
fi
echo "    owner=$OWNER repo=$REPO"

NEW_URL="git@github.com:${OWNER}/${REPO}.git"
if [[ "$ORIGIN_URL" != "$NEW_URL" ]]; then
  echo "==> Converting origin to SSH: $NEW_URL"
  git remote set-url origin "$NEW_URL"
else
  echo "==> origin already uses SSH."
fi
git remote -v | sed 's/^/    /'

echo "==> Ensuring SSH key exists..."
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
PUB="${KEY}.pub"
if [[ ! -f "$KEY" || ! -f "$PUB" ]]; then
  echo "    Generating new ed25519 key at: $KEY"
  ssh-keygen -t ed25519 -C "${USER}@$(hostname)-github" -f "$KEY" -N ""
else
  echo "    Found key: $KEY"
fi
chmod 600 "$KEY" || true
chmod 644 "$PUB" || true

echo "==> Configuring ~/.ssh/config for GitHub (idempotent)..."
SSHCFG="$HOME/.ssh/config"
touch "$SSHCFG"
chmod 600 "$SSHCFG" || true
if ! grep -qE '^[[:space:]]*Host[[:space:]]+github\.com\b' "$SSHCFG"; then
  cat >> "$SSHCFG" <<EOF

Host github.com
  HostName github.com
  User git
  IdentityFile $KEY
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
  echo "    Added host entry for github.com -> $KEY"
else
  echo "    Host github.com already present in config; leaving as-is."
fi

echo "==> Starting ssh-agent (if needed) and adding key..."
if [[ -z "${SSH_AUTH_SOCK:-}" ]]; then
  eval "$(ssh-agent -s)"
fi
# Only add if not already loaded
if ! ssh-add -l 2>/dev/null | grep -q "$(basename "$KEY")"; then
  ssh-add "$KEY"
fi

echo "==> Your public key (copy this into GitHub → Settings → SSH and GPG keys → New SSH key):"
echo "-----8<----- PUBLIC KEY -----"
cat "$PUB"
echo "-----8<----- END -----"

echo "==> Testing SSH connectivity to GitHub (you may be asked to trust the host on first connect)..."
set +e
OUT="$(ssh -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1)"
RET=$?
set -e
echo "$OUT"
if echo "$OUT" | grep -qi "successfully authenticated"; then
  echo "==> SSH auth looks good."
else
  echo "==> If you see 'Permission denied (publickey).' above, add the public key to GitHub then re-run this script."
fi

echo "==> Done. You can now push:"
echo "    git push --set-upstream origin \"\$(git branch --show-current)\""
echo "    git push --tags"

