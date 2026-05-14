# SWIT Uniformes — CRM

CRM mobile-first para gestão do pipeline de uniformes personalizados da SWIT.
Next.js 14 (App Router) + Supabase (Postgres + Realtime) + Tailwind CSS.

## Stack

- **Next.js 14** (App Router, RSC + Client Components)
- **Supabase** — Postgres + Realtime
- **Tailwind CSS** — tema escuro, fontes Syne + DM Sans
- **@dnd-kit** — drag-and-drop no Kanban
- **Recharts** — gráficos do dashboard
- **Zustand** — estado global enxuto (user, modal, toasts)
- Deploy: **Vercel**

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# META_WEBHOOK_VERIFY_TOKEN

# 3. Schema do Supabase
# No Supabase SQL Editor, cole e execute o conteúdo de supabase/schema.sql

# 4. Rodar localmente
npm run dev
```

Abra `http://localhost:3000`. Na primeira tela escolha o usuário (Diego, Kaio
ou Admin) — fica salvo em `localStorage`.

## Variáveis de ambiente

| Variável                          | Onde usa             | Descrição                                  |
| --------------------------------- | -------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`        | client + server      | URL do projeto Supabase                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | client + server      | Anon key do projeto                        |
| `META_WEBHOOK_VERIFY_TOKEN`       | webhook              | Token de verificação do webhook do Meta    |

## Estrutura

```
src/
├── app/
│   ├── layout.tsx            # AppShell global + fontes
│   ├── page.tsx              # redireciona p/ /pipeline
│   ├── login/                # seletor de usuário
│   ├── pipeline/             # Kanban (view principal)
│   ├── followup/             # leads sem atividade 3+ dias
│   ├── leads/                # tabela com busca/filtro/CSV
│   ├── dashboard/            # KPIs e gráficos
│   └── api/webhooks/meta/    # GET (verify) + POST (lead-ads)
├── components/               # UI (modal, kanban, sheets…)
├── lib/                      # supabase, pricing, format, csv, stages
├── hooks/                    # useUser, useLeads, useLeadHistory
├── store/                    # zustand (user, toasts, modal)
└── types/
```

## Funcionalidades

### Quick-Add (otimizado para mobile)
Botão flutuante `+` sempre visível. Bottom sheet com **4 campos** (nome,
whatsapp com máscara BR, empresa, origem). Salva no stage 0 atribuído ao
usuário atual e oferece "Abrir detalhes" no toast.

### Pipeline (Kanban)
6 colunas (Novo, Em Contato, Mockup, Proposta, Fechado, Perdido), scroll
horizontal no mobile, drag-and-drop no desktop (handle de 6 pontos). Tap
abre o modal completo. Cada move gera entrada no histórico.

### Lead Modal
Edição de todos os campos. Calculadora de produto (auto-calcula valor e
entrada 50% por faixa + benefício). Botão WhatsApp → `wa.me/55<num>`. Checklist
de fechamento aparece quando stage = 4. Histórico em tempo real. Caixa de
"adicionar nota" sempre visível no rodapé.

### Follow-up
Leads sem atualização há 3+ dias (excluindo Fechado/Perdido), ordenados pelo
mais antigo. Cor por faixa: amarelo (3d), laranja (5d), vermelho (7d+).
3 templates copiáveis de reativação. Tap no número abre WhatsApp.

### Leads (tabela)
Busca por nome/empresa/whatsapp, filtros por stage/origem/responsável,
ordenação por qualquer coluna, seleção em massa, exportação CSV (selecionados
ou tudo, com BOM UTF-8 pra Excel).

### Dashboard
6 cards (Total, Em andamento, Mockup pendente, Fechados, Receita, Ticket
médio), bar chart por stage, pie chart por origem, funil de conversão.
Filtros: período (de/até) e responsável.

### Realtime
Toda mudança em `leads` ou `lead_history` é propagada via Supabase Realtime —
UI atualiza sem refresh. Mudanças de outros usuários disparam toast:
`"Diego atualizou João Silva"`.

### Tabela de preços
Premium: 64,90 → 44,90 conforme faixa (5–9 … 100+).
Confort: 79,90 → 59,90 (sem 100+).
Manga longa: +R$5 por peça. Regata: −R$5 por peça.
Benefícios (brindes, frete) exibidos no calculador.

## Meta Webhook (Facebook + Instagram Lead Ads)

### Verificação
Configure o Meta App apontando para:
`https://<seu-dominio>/api/webhooks/meta` com o `META_WEBHOOK_VERIFY_TOKEN`.

### Recebimento
- Aceita o envelope padrão Meta (`entry[].changes[].value.field_data`).
- Identifica `name`, `nome`, `full_name` → `name`.
- Identifica `phone`, `whatsapp`, `telefone`, `celular` → `whatsapp`.
- `platform = "instagram"` → `source = instagram`, senão `facebook`.
- Também aceita payload simples `{name, phone, source}` para testes.

Teste local:
```bash
curl -X POST http://localhost:3000/api/webhooks/meta \
  -H "Content-Type: application/json" \
  -d '{"name":"João Teste","phone":"(15) 99999-0000","source":"instagram"}'
```

## Deploy (Vercel)

1. Push pra GitHub.
2. Import no Vercel.
3. Configure as 3 envs (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `META_WEBHOOK_VERIFY_TOKEN`).
4. Deploy. O webhook fica em `https://<projeto>.vercel.app/api/webhooks/meta`.

## Stages

| ID | Nome             | Cor      |
| -- | ---------------- | -------- |
| 0  | Novo Lead        | cinza    |
| 1  | Em Contato       | azul     |
| 2  | Mockup Pendente  | amarelo  |
| 3  | Proposta         | laranja  |
| 4  | Fechado / Pago   | verde    |
| 5  | Perdido          | vermelho |

## Autenticação

3 botões (Diego, Kaio, Admin). Sem senha. O nome escolhido vai pro
`localStorage` como `swit_user` e é estampado em cada `lead_history` e em
campos `assigned_to` quando o usuário cria/edita leads. Trocar usuário:
clicar no chip do header → volta pra `/login`.

## Notas de implementação

- RLS está aberta (`using true / with check true`) porque a auth é client-side
  com seletor de usuário. Se um dia migrar pra Supabase Auth, restringir RLS
  e mover `assigned_to` pra `auth.uid()`.
- O webhook tenta extrair `name + phone` dos campos do Lead Ads; quando só
  vem `leadgen_id` (sem Page Access Token configurado), cria um lead
  placeholder com a referência — fica visível no pipeline em stage 0 pra
  alguém completar manualmente.
- Tudo client-side fala direto com Supabase via `@supabase/supabase-js` —
  não há rota intermediária. A única API route é o webhook do Meta.
