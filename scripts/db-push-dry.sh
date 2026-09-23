#!/usr/bin/env bash
# Lecture à blanc de `drizzle-kit push` : affiche le SQL que push exécuterait, sans rien écrire.
# - Connexion directe (le pooler Neon refuse le paramètre `options`), forcée en lecture seule :
#   même si un statement partait, Postgres le refuserait.
# - Sans TTY, drizzle-kit affiche les statements puis s'arrête avant la confirmation.
# Usage : npm run db:push:dry  (DATABASE_URL_UNPOOLED ou DATABASE_URL, sinon lus dans .env.local)
set -uo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL_UNPOOLED:-}${DATABASE_URL:-}" ] && [ -f .env.local ]; then
  set -a; source .env.local; set +a
fi
url="${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-}}"
[ -n "$url" ] || { echo "DATABASE_URL_UNPOOLED ou DATABASE_URL requis" >&2; exit 1; }
url="${url/-pooler./.}" # Neon : endpoint direct
sep='?'; [[ $url == *\?* ]] && sep='&'

DATABASE_URL="${url}${sep}options=-c%20default_transaction_read_only%3Don" \
  npx drizzle-kit push --verbose --strict < /dev/null 2>&1 \
  | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g' \
  | grep -v -E "Pulling schema|SSL modes|next major version|To prepare for this|If you want|libpq-ssl.html|trace-warnings|Interactive prompts require|^    at |^\s*$"
echo "— lecture à blanc : rien n'a été exécuté."
