/**
 * Testa o fluxo de publicação do app exatamente como a tela Create faz:
 *   signIn (Ana) -> uploadMedia (bucket `media`) -> createPost (tabela `posts`)
 * (mesma lógica de src/lib/social.ts, respeitando o RLS via sessão autenticada.)
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import zlib from 'node:zlib';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// ---- env (igual ao seed) ----
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

// ---- gerador de PNG mínimo (sem deps), cor sólida com leve gradiente ----
const CRC = (() => { const t = new Uint32Array(256); for (let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;} return t; })();
function crc32(buf){let c=0xffffffff;for(let i=0;i<buf.length;i++)c=CRC[(c^buf[i])&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const t=Buffer.from(type,'ascii');const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc]);}
function makePNG(w,h){
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=2;/*RGB*/
  const raw=Buffer.alloc((w*3+1)*h);
  let p=0;
  for(let y=0;y<h;y++){raw[p++]=0;for(let x=0;x<w;x++){raw[p++]=40+Math.floor(120*x/w);raw[p++]=180-Math.floor(60*y/h);raw[p++]=140;}}
  const idat=zlib.deflateSync(raw);
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',idat),chunk('IEND',Buffer.alloc(0))]);
}

const EMAIL='ana@thirtyminutes.app', PASS='Vida30!min';
const CAPTION='Testando publicar pelo 30minutes ✅ café da tarde sem tela ☕';

const c = createClient(url, key, { auth: { persistSession:false } });

const auth = await c.auth.signInWithPassword({ email:EMAIL, password:PASS });
if (auth.error) { console.error('login:', auth.error.message); process.exit(1); }
const uid = auth.data.user.id;
console.log('→ autenticado como Ana', uid);

// uploadMedia (espelha src/lib/social.ts)
const bytes = makePNG(600,600);
const path = `${uid}/${Date.now()}.jpg`;
const up = await c.storage.from('media').upload(path, bytes, { contentType:'image/jpeg', upsert:false });
if (up.error) { console.error('upload:', up.error.message); process.exit(1); }
const { data:pub } = c.storage.from('media').getPublicUrl(path);
console.log('→ mídia no bucket:', pub.publicUrl);

// createPost
const ins = await c.from('posts').insert({ user_id:uid, media_url:pub.publicUrl, media_type:'image', caption:CAPTION }).select('id, created_at').single();
if (ins.error) { console.error('insert post:', ins.error.message); process.exit(1); }
console.log('✅ post publicado:', ins.data.id, '@', ins.data.created_at);
console.log('   legenda:', CAPTION);
