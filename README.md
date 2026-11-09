# KARKARDAGI
Android app + responsive Urdu-first management dashboard + Cloudflare Worker/D1 starter backend.

## GitHub APK build
1. Create a GitHub repository named `karkardagi`.
2. Upload the contents of this folder to the repository root.
3. Open Actions → Build KARKARDAGI APK. Run workflow.
4. Download artifact `KARKARDAGI-debug-apk`.

## Cloudflare backend
1. Install Wrangler: `npm install -g wrangler`
2. In `backend/`, run `wrangler d1 create karkardagi-db`.
3. Paste returned database ID into `backend/wrangler.toml`.
4. Run `wrangler d1 execute karkardagi-db --remote --file=schema.sql`.
5. Run `wrangler secret put SETUP_KEY` and enter a strong secret.
6. Run `wrangler deploy`.
7. Put your Worker URL in `app/src/main/assets/app-config.js` and `web/index.html`.

## Create first admin
POST `/api/setup` JSON:
`{"setupKey":"YOUR_SECRET","name":"Admin","email":"admin@example.com","password":"ChangeThisPassword123!"}`

The app has a local demo mode when no backend is configured. Test carefully before production use.
