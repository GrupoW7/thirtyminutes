/**
 * Drives the running Expo web build with a headless browser, logs in as the
 * demo user (see seed.mjs) and screenshots the authenticated screens.
 *
 * Prereqs:
 *   1. .env is configured and the Supabase host is reachable (egress allowed).
 *   2. `node scripts/demo/seed.mjs` has been run.
 *   3. The web server is up:  EXPO_OFFLINE=1 CI=1 npx expo start --web --port 8081
 *   4. playwright-core is installed:  npm i -D playwright-core
 *
 * Usage:  node scripts/demo/shoot.mjs
 * Output: scripts/demo/shots/*.png
 *
 * Chromium is auto-detected under $PLAYWRIGHT_BROWSERS_PATH (or /opt/pw-browsers);
 * override with CHROMIUM_PATH=/path/to/chrome.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'shots');
const URL = process.env.DEMO_URL || 'http://localhost:8081';
const EMAIL = 'ana@thirtyminutes.app';
const PASSWORD = 'Vida30!min';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(base)) return null;
  const dir = readdirSync(base).find((d) => d.startsWith('chromium-') && !d.includes('headless'));
  return dir ? join(base, dir, 'chrome-linux', 'chrome') : null;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { chromium } = await import('playwright-core');
  const executablePath = findChromium();
  const browser = await chromium.launch(executablePath ? { executablePath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 400, height: 850 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERR:', e.message));
  const shot = async (n) => { await page.screenshot({ path: join(OUT, n) }); console.log('shot', n); };

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForFunction(() => document.body && document.body.innerText.length > 0, { timeout: 180000 });
  await sleep(1500);

  // Skip onboarding if shown -> lands on register; go to login and sign in.
  const skip = page.getByText('Pular', { exact: false });
  if (await skip.count()) { await skip.first().click().catch(() => {}); await sleep(1200); }
  const toLogin = page.getByText('Entrar', { exact: false });
  if (await toLogin.count()) { await toLogin.first().click().catch(() => {}); await sleep(1000); }

  await page.waitForFunction(() => document.body.innerText.includes('Bem-vindo de volta'), { timeout: 30000 });
  const inputs = page.locator('input');
  await inputs.nth(0).fill(EMAIL);
  await inputs.nth(1).fill(PASSWORD);
  await page.getByText('Entrar', { exact: true }).last().click();

  await page.waitForFunction(() => document.body.innerText.includes('30minutes') && !document.body.innerText.includes('Bem-vindo de volta'), { timeout: 30000 });
  await sleep(2500);
  await shot('10-feed.png');

  // open first post's comments
  const comments = page.getByText('coment', { exact: false });
  if (await comments.count()) { await comments.first().click().catch(() => {}); await sleep(1500); await shot('11-comments.png'); await page.goBack().catch(() => {}); await sleep(1000); }

  // activities tab
  const viver = page.getByText('Viver', { exact: false });
  if (await viver.count()) { await viver.first().click().catch(() => {}); await sleep(2000); await shot('12-activities.png'); }

  // profile tab
  const perfil = page.getByText('Perfil', { exact: false });
  if (await perfil.count()) { await perfil.first().click().catch(() => {}); await sleep(2000); await shot('13-profile.png'); }

  await browser.close();
  console.log('\n✅ Prints em scripts/demo/shots/. Rode `node scripts/demo/seed.mjs --lock` e recapture o feed para a tela de bloqueio.');
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
