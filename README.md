# 30minutes 🌿

Rede social _lifestyle_ com um limite: **30 minutos por dia**. Depois disso, a
área social se esconde e o app te convida a **viver o resto do dia** — com uma
área gamificada de atividades reais (ler, cozinhar, correr, brincar com os
filhos...).

Construído com **Expo (React Native)** + **Supabase**.

---

## ✨ Funcionalidades

- **Onboarding** com 3 telas explicando a proposta.
- **Cadastro e login seguros** (Supabase Auth) com validação de senha forte e
  sessão guardada no keychain/keystore do aparelho (`expo-secure-store`).
- **Feed social**: publicar fotos e vídeos, legenda, curtir, comentar e
  compartilhar.
- **Regra dos 30 minutos**: o tempo só corre enquanto você está na área social.
  Ao esgotar o orçamento diário, o feed é **bloqueado e escondido** (as abas
  somem) e só volta no dia seguinte, à meia-noite local.
- **Área "Viver o dia" gamificada**: monte seu perfil de interesses e receba
  sugestões de atividades sob medida. Dê _check_ nas que realizar, crie as suas,
  ganhe pontos, suba de nível e mantenha sua sequência (streak).
- **Barra inferior** com os acessos rápidos: Início, Publicar, Viver e Perfil.

---

## 🚀 Como rodar

### 1. Pré-requisitos
- Node 18+ e o app **Expo Go** no celular (ou um emulador iOS/Android).

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar o Supabase
1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode o conteúdo de:
   - `supabase/migrations/0001_init.sql` (tabelas, segurança/RLS, bucket de mídia)
   - `supabase/seed.sql` (catálogo de atividades sugeridas)
3. Em **Authentication → Providers → Email**, para um cadastro rápido durante o
   desenvolvimento, desative "Confirm email" (opcional).
4. Copie as chaves em **Project Settings → API** e crie um arquivo `.env`:
   ```bash
   cp .env.example .env
   ```
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica
   ```

### 4. Iniciar
```bash
npm start
```
Escaneie o QR Code com o Expo Go, ou pressione `i` / `a` para emuladores.
Para pré-visualizar no navegador: `npm run web`.

### 5. Ver o app cheio, com dados de demonstração
Quer ver feed, timer e atividades funcionando sem cadastrar tudo na mão?
Rode o seed de demonstração e entre com o usuário pronto — passo a passo em
[`scripts/demo/README.md`](scripts/demo/README.md):
```bash
node scripts/demo/seed.mjs        # cria usuários, posts, curtidas, atividades
# login: ana@thirtyminutes.app / Vida30!min
```

---

## 🧠 Como a regra dos 30 minutos funciona

- O contador só avança enquanto a tela do **feed** está em foco
  (`TimerContext` + `useFocusEffect`).
- O consumo é salvo localmente (`AsyncStorage`) e sincronizado com a tabela
  `daily_usage` no Supabase — o maior valor entre os dois prevalece, então o
  tempo não "recarrega" ao trocar de aparelho.
- Ao chegar a 30 min, `isLocked` fica `true`: as abas **Início** e **Publicar**
  desaparecem da barra e o feed dá lugar à tela de bloqueio, que direciona para
  as atividades.
- À meia-noite local, o orçamento zera e a área social volta.

Quer mudar o limite? Ajuste `DAILY_SOCIAL_BUDGET_SECONDS` em `src/lib/time.ts`.

---

## 🗂 Estrutura

```
app/                       # rotas (expo-router)
  _layout.tsx              # providers + portão de navegação
  onboarding.tsx           # 3 telas de introdução
  (auth)/                  # login e cadastro
  (app)/                   # área logada com abas (tab bar inferior)
    feed.tsx               # feed social (conta o tempo, bloqueia)
    create.tsx             # publicar foto/vídeo
    activities.tsx         # área gamificada "Viver o dia"
    activity-profile.tsx   # perfil de interesses
    profile.tsx            # perfil do usuário
    post/[id].tsx          # comentários
src/
  context/                 # AuthContext, TimerContext
  lib/                     # supabase, social, activityService, time, validation
  components/              # UI, PostCard, TimerBadge, LockedSocial
  theme/                   # tokens de design
supabase/
  migrations/0001_init.sql # schema + RLS + storage
  seed.sql                 # catálogo de atividades
```

---

## 🔐 Segurança

- **Row Level Security (RLS)** ativado em todas as tabelas: cada pessoa só
  altera os próprios dados; o feed é legível apenas por usuários autenticados.
- Upload de mídia restrito à pasta do próprio usuário no bucket `media`.
- Sessão de auth armazenada de forma segura no dispositivo.

---

## 🛣 Próximos passos sugeridos

- Editar avatar e bio do perfil (upload para o bucket `media`).
- Notificação avisando quando faltam 5 minutos.
- Feed apenas de quem você segue (sistema de follows).
- Contagem de likes/comentários via colunas agregadas ou views para escalar.
