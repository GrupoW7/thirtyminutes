# 30minutes — guia para o agente

App **Expo (React Native) + Supabase**: rede social lifestyle com limite de
**30 minutos/dia**. Passado o tempo, a área social é bloqueada e escondida até o
dia seguinte; o resto do dia é uma área gamificada de atividades reais.

## Stack e estrutura
- **expo-router** (`app/`): `onboarding.tsx`, `(auth)/` (login, register),
  `(app)/` com tab bar (feed, create, activities, profile, post/[id],
  activity-profile).
- **Regras/estado** (`src/context/`): `AuthContext` (Supabase Auth),
  `TimerContext` (orçamento diário de 30 min; conta só no feed, persiste em
  AsyncStorage + tabela `daily_usage`, reseta à meia-noite local).
- **Dados** (`src/lib/`): `supabase.ts`, `social.ts` (feed/likes/comments/upload),
  `activityService.ts` + `activities.ts` (catálogo + sugestões), `time.ts`
  (`DAILY_SOCIAL_BUDGET_SECONDS`), `validation.ts`.
- **Backend** (`supabase/`): `migrations/0001_init.sql` (tabelas + RLS + bucket
  `media`), `seed.sql` (catálogo de atividades).
- **Arte**: `assets/` (ícone/splash/favicon), `assets/onboarding/` (3 slides),
  `assets/illustrations/timesup.png` (tela de bloqueio). Geradas por SVG→PNG.

## Configuração
- `.env` (gitignored) com `EXPO_PUBLIC_SUPABASE_URL` e
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Ver `.env.example`.
- Sem `.env`, o app roda mas só até login (backend desconectado).

## Comandos
- `npm install` · `npm run typecheck` · `npm run web` (preview) · `npm start` (Expo Go).
- **Rodar o app cheio (demo com dados):** ver `scripts/demo/README.md`
  (`node scripts/demo/seed.mjs`, login `ana@thirtyminutes.app` / `Vida30!min`).

## Notas para o agente
- Alvo principal é mobile; o web serve para pré-visualizar/capturar telas.
- Rede: em ambientes com egresso restrito, o host do Supabase precisa estar na
  allowlist (senão: `Host not in allowlist`). Não contornar 403 do proxy.
- Ao mexer no schema, atualizar tanto `supabase/migrations` quanto
  `src/types/database.ts`.
- Regenerar tipos quando o projeto estiver linkado:
  `supabase gen types typescript --linked > src/types/database.ts`.
