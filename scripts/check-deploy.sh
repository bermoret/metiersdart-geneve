#!/usr/bin/env bash
# Contrôle de santé après un deploy : pages publiques en 200, pages inexistantes
# en VRAI 404 (et pas en 200 + noindex : un loading.tsx au-dessus d'une route
# dynamique suffit à faire revenir le soft 404, cf. docs/FOLLOW-UP.md).
#
# Usage : scripts/check-deploy.sh [URL]   (défaut : prod Vercel)
# Preview protégé : exporter VERCEL_PROTECTION_BYPASS (secret « Protection
# Bypass for Automation » du projet) pour passer l'authentification Vercel.
set -uo pipefail

BASE="${1:-https://metiersdart-geneve.vercel.app}"
BASE="${BASE%/}"
HEADERS=()
[ -n "${VERCEL_PROTECTION_BYPASS:-}" ] && HEADERS=(-H "x-vercel-protection-bypass: $VERCEL_PROTECTION_BYPASS")

expect_200=(/ /repertoire /qui-sommes-nous /jema /l-actu /categories/art-du-bois /artisans/charles-roulin)
expect_404=(/page-qui-nexiste-pas /artisans/__inexistant__ /categories/__inexistant__ /jema/1900)

fail=0
check() {
  local path="$1" want="$2" got
  # ${HEADERS[@]+…} : tableau vide toléré sous set -u (bash 3.2 de macOS).
  got=$(curl -s -o /dev/null -m 20 -w "%{http_code}" ${HEADERS[@]+"${HEADERS[@]}"} "$BASE$path")
  if [ "$got" = "$want" ]; then
    printf "ok    %s %s\n" "$got" "$path"
  else
    printf "ÉCHEC %s %s (attendu %s)\n" "$got" "$path" "$want"
    fail=1
  fi
}

echo "→ $BASE"
for p in "${expect_200[@]}"; do check "$p" 200; done
for p in "${expect_404[@]}"; do check "$p" 404; done

if [ "$fail" -ne 0 ]; then
  echo "Contrôle KO"
  exit 1
fi
echo "Contrôle OK"
