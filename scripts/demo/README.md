# Demo do 30minutes

Ferramentas para popular o backend Supabase e ver o app autenticado rodando
(feed com posts, curtidas, comentários, timer dos 30 min, bloqueio e área de
atividades gamificada).

## Pré-requisitos (uma vez)

No projeto Supabase:

1. **SQL Editor** → rode `supabase/migrations/0001_init.sql` e depois
   `supabase/seed.sql`.
2. **Authentication → Sign In / Providers → Email** → **desmarque
   "Confirm email"** (para o seed conseguir criar contas e já entrar).
3. Na raiz do repo, crie o `.env` (veja `.env.example`) com:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-publishable-ou-anon-key
   ```

## 1) Semear dados de demonstração

```bash
node scripts/demo/seed.mjs
```

Cria 3 usuários (`ana.vive`, `bruno.corre`, `duda.cozinha`), 4 posts com imagens,
curtidas, comentários, e para a **Ana** um perfil de interesses + atividades do
dia (algumas concluídas, gerando pontos/nível).

Login principal do demo:

```
ana@thirtyminutes.app  /  Vida30!min
```

Controlar o timer dos 30 minutos:

```bash
node scripts/demo/seed.mjs --lock          # gasta os 30 min de hoje (bloqueia o feed)
node scripts/demo/seed.mjs --reset-usage   # devolve os 30 min (libera o feed)
```

## 2) Ver rodando

### Opção A — na sua máquina (recomendado)
```bash
npm install
npm run web        # abre no navegador; ou `npm start` para Expo Go no celular
```
Entre com o login do demo acima e navegue: feed → publicar → curtir/comentar →
timer no topo contando → (rode `--lock` e recarregue para ver o bloqueio) →
aba **Viver** com pontos/nível.

### Opção B — capturar prints automaticamente (sessão remota)
Requer Chromium (ex.: ambiente Claude Code em `/opt/pw-browsers`) e:
```bash
npm i -D playwright-core
EXPO_OFFLINE=1 CI=1 npx expo start --web --port 8081 &   # sobe o servidor
node scripts/demo/shoot.mjs                              # gera scripts/demo/shots/*.png
```
`shoot.mjs` faz login como Ana e captura feed, comentários, atividades e perfil.
Para a tela de bloqueio: `node scripts/demo/seed.mjs --lock` e recapture.

## Notas

- O `.env` é **gitignored**: a chave não vai para o repositório.
- Use sempre a chave **anon/publishable** (pública, feita para o cliente).
  Nunca use a `service_role` aqui.
- `seed.mjs` é seguro para rodar mais de uma vez (reaproveita usuários e não
  duplica posts/comentários).
