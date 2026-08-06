/**
 * Seeds the 30minutes Supabase project with a demo dataset so the app has a
 * populated feed, comments, likes, an activity profile and gamified progress.
 *
 * Usage:
 *   node scripts/demo/seed.mjs           # seed users, posts, activities
 *   node scripts/demo/seed.mjs --lock    # also spend today's 30 min (locks the feed)
 *   node scripts/demo/seed.mjs --reset-usage  # give today's 30 min back
 *
 * Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, read
 * from the environment or from the project's .env file.
 *
 * Safe to run more than once (idempotent-ish): users are reused, and posts are
 * only created when the user has none yet.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import zlib from 'node:zlib';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// ---- env ----------------------------------------------------------------
function loadEnv() {
  let url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  let key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const envPath = join(ROOT, '.env');
  if ((!url || !key) && existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      if (m[1] === 'EXPO_PUBLIC_SUPABASE_URL' && !url) url = m[2].trim();
      if (m[1] === 'EXPO_PUBLIC_SUPABASE_ANON_KEY' && !key) key = m[2].trim();
    }
  }
  if (!url || !key) {
    console.error('Faltam EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (env ou .env).');
    process.exit(1);
  }
  return { url, key };
}

// ---- tiny gradient PNG generator (no image deps) ------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function gradientPng(size, top, bottom, dot) {
  const w = size, h = size;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let p = 0;
  const cx = w / 2, cy = h * 0.42, r = w * 0.14;
  for (let y = 0; y < h; y++) {
    raw[p++] = 0;
    for (let x = 0; x < w; x++) {
      const t = (x / w * 0.35 + y / h * 0.65);
      let R = Math.round(top[0] + (bottom[0] - top[0]) * t);
      let G = Math.round(top[1] + (bottom[1] - top[1]) * t);
      let B = Math.round(top[2] + (bottom[2] - top[2]) * t);
      if (dot && Math.hypot(x - cx, y - cy) < r) { R = dot[0]; G = dot[1]; B = dot[2]; }
      raw[p++] = R; raw[p++] = G; raw[p++] = B;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- demo content -------------------------------------------------------
const PASSWORD = 'Vida30!min';
const USERS = [
  { email: 'ana@thirtyminutes.app', username: 'ana.vive', full_name: 'Ana Vive', primary: true },
  { email: 'bruno@thirtyminutes.app', username: 'bruno.corre', full_name: 'Bruno Corre' },
  { email: 'duda@thirtyminutes.app', username: 'duda.cozinha', full_name: 'Duda Cozinha' },
];

const POSTS = [
  { by: 'ana.vive', caption: 'Nascer do sol na corrida 🌅 melhor jeito de começar o dia #30minutes',
    img: [[255, 180, 84], [61, 220, 151], [255, 244, 222]] },
  { by: 'duda.cozinha', caption: 'Almoço feito do zero hoje 🍲 sem delivery, só amor',
    img: [[42, 169, 224], [61, 220, 151], [255, 208, 138]] },
  { by: 'bruno.corre', caption: 'Terminei mais um livro esta semana 📚 30 minutos de tela, o resto vivendo',
    img: [[37, 179, 122], [15, 27, 45], [92, 240, 176]] },
  { by: 'ana.vive', caption: 'Fim de tarde com a família no parque 💚',
    img: [[255, 200, 100], [232, 150, 58], [15, 27, 45]] },
];

const COMMENTS = [
  { post: 0, by: 'bruno.corre', body: 'Que inspiração! Bora marcar uma corrida 🏃' },
  { post: 0, by: 'duda.cozinha', body: 'Amei esse céu 😍' },
  { post: 1, by: 'ana.vive', body: 'Tá com uma cara incrível, manda a receita!' },
  { post: 2, by: 'ana.vive', body: 'Qual livro? Preciso de indicação 📖' },
];
const LIKES = [
  { post: 0, by: 'bruno.corre' }, { post: 0, by: 'duda.cozinha' },
  { post: 1, by: 'ana.vive' }, { post: 1, by: 'bruno.corre' },
  { post: 2, by: 'ana.vive' }, { post: 3, by: 'duda.cozinha' },
];

const ANA_PROFILE = {
  interests: ['fitness', 'outdoors', 'reading', 'family', 'cooking'],
  goals: ['health', 'family_time', 'less_screen'],
  energy_level: 'high', has_kids: true, available_minutes: 90,
};
const ANA_ACTIVITIES = [
  { catalog_id: 'c-walk', custom_title: 'Caminhar 20 minutos ao ar livre', points: 25, completed: true },
  { catalog_id: 'c-read-15', custom_title: 'Ler 15 páginas de um livro', points: 20, completed: true },
  { catalog_id: 'c-kids', custom_title: 'Brincar com as crianças', points: 30, completed: true },
  { catalog_id: 'c-water', custom_title: 'Beber 2 litros de água hoje', points: 10, completed: false },
  { catalog_id: null, custom_title: 'Meditar 5 min antes de dormir', points: 15, completed: false },
];

// ---- helpers ------------------------------------------------------------
async function authClient({ url, key }, u) {
  const c = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  let res = await c.auth.signInWithPassword({ email: u.email, password: PASSWORD });
  if (res.error) {
    const up = await c.auth.signUp({
      email: u.email, password: PASSWORD,
      options: { data: { username: u.username, full_name: u.full_name } },
    });
    if (up.error && !/already/i.test(up.error.message)) throw new Error(`signUp ${u.email}: ${up.error.message}`);
    res = await c.auth.signInWithPassword({ email: u.email, password: PASSWORD });
    if (res.error) {
      throw new Error(
        `Não consegui logar ${u.email}. Provavelmente a confirmação de e-mail está LIGADA. ` +
        `Desative em: Authentication > Sign In / Providers > Email > "Confirm email". (${res.error.message})`,
      );
    }
  }
  const { data: { user } } = await c.auth.getUser();
  await c.from('profiles').upsert({ id: user.id, username: u.username, full_name: u.full_name });
  return { c, id: user.id, username: u.username };
}

async function main() {
  const cfg = loadEnv();
  const args = process.argv.slice(2);
  const clients = {}; // username -> { c, id }

  console.log('→ Autenticando usuários demo...');
  for (const u of USERS) {
    const a = await authClient(cfg, u);
    clients[u.username] = a;
    console.log(`   ✓ ${u.username} (${a.id.slice(0, 8)})`);
  }

  const primary = clients['ana.vive'];

  if (args.includes('--reset-usage')) {
    const today = new Date().toISOString().slice(0, 10);
    await primary.c.from('daily_usage').upsert({ user_id: primary.id, usage_date: today, seconds_used: 0 });
    console.log('→ Uso de hoje zerado (feed liberado).');
    return;
  }
  if (args.includes('--lock')) {
    const today = new Date().toISOString().slice(0, 10);
    await primary.c.from('daily_usage').upsert({ user_id: primary.id, usage_date: today, seconds_used: 1800 });
    console.log('→ 30 min gastos para ana.vive (feed bloqueado).');
    return;
  }

  // Posts (only if the author has none yet) + collect ids in order
  const postIds = [];
  for (let i = 0; i < POSTS.length; i++) {
    const spec = POSTS[i];
    const author = clients[spec.by];
    const png = gradientPng(900, spec.img[0], spec.img[1], spec.img[2]);
    const path = `${author.id}/demo-${i}.png`;
    const up = await author.c.storage.from('media').upload(path, png, { contentType: 'image/png', upsert: true });
    if (up.error) throw new Error(`upload ${path}: ${up.error.message}`);
    const { data: pub } = author.c.storage.from('media').getPublicUrl(path);

    // avoid duplicate posts on re-run: match by caption
    const existing = await author.c.from('posts').select('id').eq('user_id', author.id).eq('caption', spec.caption).maybeSingle();
    let id = existing.data?.id;
    if (!id) {
      const ins = await author.c.from('posts')
        .insert({ user_id: author.id, media_url: pub.publicUrl, media_type: 'image', caption: spec.caption })
        .select('id').single();
      if (ins.error) throw new Error(`post ${i}: ${ins.error.message}`);
      id = ins.data.id;
    }
    postIds.push(id);
    console.log(`→ post ${i} de ${spec.by} ok`);
  }

  // Likes
  for (const l of LIKES) {
    const u = clients[l.by];
    await u.c.from('likes').upsert({ post_id: postIds[l.post], user_id: u.id });
  }
  console.log(`→ ${LIKES.length} curtidas`);

  // Comments (skip if this user already commented on the post)
  for (const cm of COMMENTS) {
    const u = clients[cm.by];
    const dupe = await u.c.from('comments').select('id').eq('post_id', postIds[cm.post]).eq('user_id', u.id).limit(1);
    if (!dupe.data?.length) {
      await u.c.from('comments').insert({ post_id: postIds[cm.post], user_id: u.id, body: cm.body });
    }
  }
  console.log(`→ comentários ok`);

  // Ana's activity profile + today's activities
  await primary.c.from('activity_profiles').upsert({ user_id: primary.id, ...ANA_PROFILE, updated_at: new Date().toISOString() });
  const today = new Date().toISOString().slice(0, 10);
  const already = await primary.c.from('user_activities').select('id').eq('user_id', primary.id).eq('activity_date', today);
  if (!already.data?.length) {
    for (const act of ANA_ACTIVITIES) {
      await primary.c.from('user_activities').insert({ user_id: primary.id, activity_date: today, ...act });
    }
  }
  console.log('→ perfil de atividades + atividades do dia (Ana) ok');

  console.log('\n✅ Seed concluído.');
  console.log('   Entre no app como:  ana@thirtyminutes.app  /  ' + PASSWORD);
  console.log('   (--lock bloqueia o feed dos 30 min; --reset-usage libera)');
}

main().catch((e) => { console.error('\n❌', e.message); process.exit(1); });
