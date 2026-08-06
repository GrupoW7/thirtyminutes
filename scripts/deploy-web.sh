#!/usr/bin/env bash
# Deploy the 30minutes Expo web build to Vercel (project "thirtyminutes",
# team grupo-w7s-projects → https://thirtyminutes.vercel.app).
#
# WHY THE RENAME STEP: Expo exports the @expo/vector-icons fonts under
# `dist/assets/node_modules/@expo/...`. Vercel's uploader ignores every
# `node_modules` directory, so those font files never reach the CDN and every
# icon renders as a tofu box. We copy that dir to `assets/_vendor` and rewrite
# the bundle's references so the fonts ship.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Exporting web build…"
rm -rf dist
npx expo export --platform web

echo "→ Working around Vercel's node_modules ignore (fonts)…"
cp -r dist/assets/node_modules dist/assets/_vendor
grep -rl "assets/node_modules" dist/_expo dist/index.html dist/metadata.json 2>/dev/null \
  | while read -r f; do sed -i 's|assets/node_modules|assets/_vendor|g' "$f"; done

echo "→ SPA routing + project link inside dist…"
cat > dist/vercel.json <<'JSON'
{
  "framework": null,
  "installCommand": "echo skip",
  "buildCommand": "echo prebuilt",
  "outputDirectory": ".",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
JSON
cp -r .vercel dist/.vercel

echo "→ Deploying to production…"
( cd dist && npx vercel deploy --prod --yes --scope grupo-w7s-projects )
echo "✓ Live: https://thirtyminutes.vercel.app"
