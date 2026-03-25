# SLAC — Sano Lab Advanced CRM

## Projeto
CRM completo para gestão de leads, financeiro e prospecção da Sano Lab.

- **Stack:** Vue 3 + Vite + Pinia + Vue Router + Supabase
- **Deploy:** Vercel — sanolab-advanced-crm.vercel.app
- **Repo:** github.com/eduardospinolagit/SLAC (branch main)
- **Supabase:** jqmnmudfxxdcjfradvcj
- **Local:** `C:\Users\Eduardo\Pictures\Sano Lab Sites\SLAC\v2\slac\SiposCommandCenter`

---

## Estrutura de arquivos

```
src/
  App.vue                          # Toast iOS pill (Teleport), saving, sessão
  main.js
  router/index.js                  # Todas as rotas dentro do AppLayout
  styles/global.css                # Tokens CSS, componentes base, classes compartilhadas
  stores/
    auth.js                        # Sessão Supabase (sem onAuthStateChange interno)
    fin.js                         # Financeiro — usa uid() de utils/uid.js
    leads.js                       # Leads/CRM — usa uid()
    mapa.js                        # Mapa (legacy, não usado na UI)
  utils/
    uid.js                         # Função uid() centralizada (usada pelos 3 stores)
  composables/
    useTheme.js                    # Dark/light mode com localStorage
    useSaving.js                   # showSaving/hideSaving + toast via inject
    useAppInit.js                  # Carrega todas as stores + Realtime Supabase
    useRealtime.js                 # Canal Supabase Realtime
    usePushNotifications.ts        # Web Push subscription
  lib/
    supabase.js                    # Cliente Supabase com persistSession, lock sem deadlock
  components/
    layout/AppLayout.vue           # Sidebar + Topbar + Search + User menu
    crm/FecharNegocioModal.vue     # Modal de fechamento de negócio
  views/
    LoginView.vue                  # Login com badge "beta b0.2"
    DashboardView.vue              # KPIs + charts + transações
    CRMView.vue                    # Kanban + Tabela + Follow-up + Relead
    FinanceiroView.vue             # Receitas/despesas + charts + drawer
    RecorrenciasView.vue           # Controle mensal de recorrências
    ProspeccaoView.vue             # Importar CSV + Modo Foco + tabela
```

---

## Padrão de interface (OBRIGATÓRIO em todas as views)

### Estrutura de página
```vue
<div class="page-layout">
  <div class="page-header">
    <div>
      <h1 class="page-title">Título</h1>
      <p class="page-subtitle">Subtítulo</p>
    </div>
    <div class="page-actions">
      <!-- botões -->
    </div>
  </div>
  <!-- conteúdo -->
</div>
```

### Classes globais (já no global.css — NÃO redefinir nas views)
- `.page-layout` — padding 1.25rem 1.5rem, flex column, gap 1.25rem
- `.page-header`, `.page-title`, `.page-subtitle`, `.page-actions`
- `.kpi-grid`, `.kpi-grid--5`, `.kpi-grid--4`, `.kpi-grid--3`
- `.kpi-card`, `.kpi-label`, `.kpi-value`, `.kpi-sub`
- `.kpi-value--accent` (verde), `.kpi-value--warning` (amarelo), `.kpi-value--danger` (vermelho)
- `.sec-header`, `.sec-title`
- `.card-header`, `.card-title`
- `.tx-list`, `.tx-row`, `.tx-date`, `.tx-val`
- `.card--followup`, `.followup-header`, `.followup-title`
- `.badge`, `.badge-accent`, `.badge-warning`, `.badge-danger`
- `.form-input`, `.form-select`, `.form-label`, `.form-group`, `.form-textarea`
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-icon`
- `.table-wrapper` — tabela com scroll horizontal
- `.text-muted`, `.text-sm`

### Drawer (padrão CRM/Financeiro/Recorrências)
```vue
<div v-show="open" class="drawer-bg" @click="open=false"></div>
<div v-show="open" class="drawer">
  <div class="drawer-header">...</div>
  <div class="drawer-body">
    <div class="drawer-section">
      <p class="drawer-section-title">Seção</p>
      ...
    </div>
  </div>
  <div class="drawer-footer">...</div>
</div>
```
CSS do drawer está em cada view (scoped) — copiar do FinanceiroView ou CRMView.

---

## Tokens de design

```css
/* Dark mode (padrão) */
--bg-base: #080808
--bg-surface: #0f0f0f
--bg-elevated: #161616
--bg-overlay: #1c1c1c
--accent: #22c55e          /* Verde Sano */
--accent-subtle: rgba(34,197,94,.08)
--status-warning: #e8a838
--status-danger: #e05555
--status-info: #5b8dee
--text-primary: #f0f0f0
--text-secondary: #888888
--text-tertiary: #555555
--font-body: 'Plus Jakarta Sans'
--font-display: 'Plus Jakarta Sans'
```

---

## Regras importantes

### CSS
- **Nunca** redefinir `.page-layout`, `.kpi-grid`, `.page-title` etc. nas views — já estão no global.css
- Usar `<style scoped>` apenas para classes exclusivas da view
- Charts usam `Plus Jakarta Sans` via `window.Chart.defaults.font.family`

### Stores
- Todos os stores importam `uid()` de `@/utils/uid.js` — nunca declarar a função localmente
- `auth.js` NÃO tem `onAuthStateChange` interno — o listener fica só no `App.vue`

### Toast / Saving
- `toast` e `saving` são injetados via `inject('toast')` e `inject('saving')` do `App.vue`
- No `useSaving.js`: `run(fn, 'mensagem sem ✓')` — o App.vue já limpa checkmarks
- O pill iOS usa `<Teleport to="body">` — não mover

### Sessão
- `handleVisibilityChange` no `App.vue` faz refresh do token mas NÃO chama `auth.init()`
- `auth.init()` só é chamado uma vez no `onMounted` do `App.vue`

### Router
- Todas as rotas autenticadas são `children` do `AppLayout` para ter sidebar
- `/login` é a única rota fora do layout

---

## Deploy
```powershell
cd "C:\Users\Eduardo\Pictures\Sano Lab Sites\SLAC\v2\slac\SiposCommandCenter"
git add .
git commit -m "mensagem"
git push
# Vercel faz deploy automático do main
```

---

## Tabelas Supabase
- `leads` — CRM leads (tem coluna `relead_data timestamptz`)
- `financeiro` — transações
- `pagamentos` — controle mensal de recorrências
- `configuracoes` — meta financeira, mapa, prospecção lista, user_nome
- `conversas` — histórico de conversas de leads
- `push_subscriptions` — Web Push

---

## VAPID Keys (Push Notifications)
- Public: `BOMZjUrFnkPqyKg6T2rHhXE8xTTNfR33jrgR7OmbNzD5aZSDE9zN2OjN7ELvhJYYsv0DQff7CUapkexxUxb2dPc`
- Private: `6TB0NVCMWfrqetxRu_lneqjy4DisatDaoydUoG9iLHM`
- Subject: `mailto:eduardospinolamkt@gmail.com`
- Edge Function: `supabase/functions/notify-daily/index.ts`

---

## Contexto do dono
- Eduardo Spinola — Sano Lab
- Negócio: criação de sites para pequenas empresas (Google Maps → prospecção)
- Pacotes: Essencial R$797 / Profissional R$1.097 / Completo R$1.397
- Sempre tratar por "Eduardo" ou "Chefe"
