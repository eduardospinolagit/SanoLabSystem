<template>
  <div class="page-layout">

    <div class="page-header">
      <div>
        <h1 class="page-title">CRM <span class="page-count">{{ leads.stats.total }} leads</span></h1>
        <p class="page-subtitle">Gerencie seu pipeline de vendas</p>
      </div>
      <div class="page-actions">
        <button
          class="btn btn-sm"
          :class="notifAtiva ? 'btn-notif-on' : 'btn-secondary'"
          :disabled="notifAtiva"
          @click="pedirNotificacao"
          :title="notifAtiva ? 'Notificações ativadas' : 'Ativar alertas de follow-up'"
        >
          <svg v-if="!notifAtiva" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ notifAtiva ? 'Alertas ativos' : 'Alertas' }}
        </button>
        <button class="btn btn-primary" @click="openNew()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo lead
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid kpi-grid--5">
      <div class="kpi-card"><span class="kpi-label">Total</span><span class="kpi-value" style="color:var(--status-info)">{{ leads.stats.total }}</span><span class="kpi-sub">leads</span></div>
      <div class="kpi-card"><span class="kpi-label">Negociando</span><span class="kpi-value kpi-value--warning">{{ leads.stats.negociando }}</span><span class="kpi-sub">demo + negoc.</span></div>
      <div class="kpi-card"><span class="kpi-label">Fechados</span><span class="kpi-value kpi-value--accent">{{ leads.stats.fechados }}</span><span class="kpi-sub">convertidos</span></div>
      <div class="kpi-card"><span class="kpi-label">Follow-up hoje</span><span class="kpi-value kpi-value--danger">{{ leads.stats.fuHoje }}</span><span class="kpi-sub">pendentes</span></div>
      <div class="kpi-card"><span class="kpi-label">Pipeline</span><span class="kpi-value" style="color:var(--status-info)">{{ fmt(leads.stats.pipe) }}</span><span class="kpi-sub">potencial</span></div>
    </div>

    <!-- Sel bar -->
    <Transition name="sel-bar">
      <div v-if="selected.size > 0" class="sel-bar">
        <span class="sel-count">{{ selected.size }} selecionado{{ selected.size !== 1 ? 's' : '' }}</span>
        <select v-model="selEtapa" class="form-select" style="width:auto;font-size:.82rem;padding:.35rem .7rem">
          <option value="">Mover para...</option>
          <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="moverSelecionados">Mover</button>
        <button class="btn btn-danger btn-sm" @click="excluirSelecionados">Excluir</button>
        <button class="btn btn-ghost btn-sm" @click="selected = new Set()">Limpar</button>
      </div>
    </Transition>

    <!-- Toolbar: tabs + busca -->
    <div class="toolbar">
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'kanban' }" @click="changeTab('kanban')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Kanban
        </button>
        <button class="tab" :class="{ active: tab === 'tabela' }" @click="changeTab('tabela')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Tabela
        </button>
        <button class="tab" :class="{ active: tab === 'followup' }" @click="changeTab('followup')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Follow-up
          <span v-if="listaFollowUp.length" class="tab-badge tab-badge--orange">{{ listaFollowUp.length }}</span>
        </button>
        <button class="tab" :class="{ active: tab === 'relead' }" @click="changeTab('relead')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Relead
          <span v-if="listaRelead.length" class="tab-badge tab-badge--purple">{{ listaRelead.length }}</span>
        </button>
      </div>
      <div class="kb-search-box">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="search" class="kb-search-input" placeholder="Buscar lead..." />
        <button v-if="search" class="kb-search-clear" @click="search = ''">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- KANBAN -->
    <div v-if="tab === 'kanban'" class="kanban-board">
      <div v-for="e in ETAPAS" :key="e.id" class="kb-col"
        :class="{ 'drop-over': dragOver === e.id }"
        @dragover.prevent="dragOver = e.id"
        @dragleave="dragOver = null"
        @drop.prevent="onDrop(e.id)">
        <div class="kb-head">
          <div class="kb-title">
            <span class="kb-dot" :style="{ background: e.color }"></span>
            <span :style="{ color: e.color }">{{ e.label }}</span>
          </div>
          <span class="kb-count">{{ byEtapaFiltrado(e.id).length }}</span>
        </div>
        <div class="kb-cards">
          <div v-for="l in byEtapaFiltrado(e.id)" :key="l.id"
            class="kb-card" draggable="true"
            @dragstart="onDragStart(l)" @dragend="dragOver = null"
            @click="openLead(l.id)">
            <div class="kb-drag-handle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            </div>
            <div class="kb-name">{{ l.nome }}</div>
            <div v-if="diasNaEtapa(l)" class="kb-etapa-tempo">{{ diasNaEtapa(l) }}</div>
            <div v-if="l.negocio" class="kb-negocio">{{ l.negocio }}</div>
            <div v-if="l.site_atual" class="kb-servico">{{ l.site_atual }}</div>
            <div v-if="l.notas" class="kb-notas">{{ l.notas.slice(0,80) }}{{ l.notas.length > 80 ? '...' : '' }}</div>
            <div class="kb-footer">
              <span class="kb-pri" :class="`pri-${l.prioridade}`">{{ l.prioridade }}</span>
              <span v-if="l.ultima_direcao" class="kb-interacao" :class="l.ultima_direcao === 'recebido' ? 'kb-interacao--in' : 'kb-interacao--out'"
                :title="l.ultima_direcao === 'recebido' ? 'Lead respondeu — você deve responder' : 'Você enviou — aguardando lead'">
                <svg v-if="l.ultima_direcao === 'recebido'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                <svg v-else width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                {{ l.ultima_direcao === 'recebido' ? 'Lead' : 'Você' }}
              </span>
            </div>
            <div v-if="work.leadsComWork.has(l.id)" class="kb-work-bar">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              Em execução
            </div>
            <div v-if="l.proximo_followup" class="kb-fu-bar">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ fmtDataHora(l.proximo_followup) }}
            </div>
            <div v-if="l.relead_data" class="kb-relead-bar">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              {{ fmtDataHora(l.relead_data) }}
            </div>
          </div>
          <button class="kb-add" @click="openNewEtapa(e.id)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar
          </button>
        </div>
      </div>
    </div>

    <!-- TABELA -->
    <div v-if="tab === 'tabela'" class="tabela-wrap">
      <div class="tabela-filters">
        <select v-model="filterEtapa" class="form-select" style="width:auto;font-size:.82rem">
          <option value="">Todas etapas</option>
          <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
        </select>
        <select v-model="filterPri" class="form-select" style="width:auto;font-size:.82rem">
          <option value="">Todas prioridades</option>
          <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
        </select>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style="width:36px"><input type="checkbox" class="cb" @change="toggleAll($event.target.checked)" /></th>
              <th class="th-sort" @click="toggleSort('nome')">Nome <span class="sort-icon">{{ sortKey==='nome'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th class="th-sort" @click="toggleSort('negocio')">Negócio <span class="sort-icon">{{ sortKey==='negocio'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th>Telefone</th>
              <th class="th-sort" @click="toggleSort('etapa')">Etapa <span class="sort-icon">{{ sortKey==='etapa'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th class="th-sort" @click="toggleSort('prioridade')">Prioridade <span class="sort-icon">{{ sortKey==='prioridade'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th class="th-sort" @click="toggleSort('proximo_followup')">Follow-up <span class="sort-icon">{{ sortKey==='proximo_followup'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th class="th-sort" @click="toggleSort('valor_estimado')" style="text-align:right">Valor <span class="sort-icon">{{ sortKey==='valor_estimado'?(sortDir==='asc'?'↑':'↓'):'↕' }}</span></th>
              <th style="width:36px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!listaFiltrada.length"><td colspan="9" style="text-align:center;color:var(--text-tertiary);padding:2rem;font-size:.875rem">Nenhum lead encontrado</td></tr>
            <tr v-for="l in listaFiltrada" :key="l.id" :class="{ 'row-sel': selected.has(l.id) }">
              <td @click.stop><input type="checkbox" class="cb" :checked="selected.has(l.id)" @change="toggleSel(l.id, $event.target.checked)" /></td>
              <!-- Células clicáveis copiam o valor -->
              <td class="td-copy" @click="copyText(l.nome)" title="Clique para copiar">{{ l.nome }}</td>
              <td class="td-copy text-muted" @click="copyText(l.negocio)" title="Clique para copiar">{{ l.negocio || '—' }}</td>
              <td><button class="wa-link" @click.stop="router.push('/slaczap?lead='+l.id)">{{ l.telefone }}</button></td>
              <td><span class="etapa-tag" :style="{ background: etapaColor(l.etapa)+'18', color: etapaColor(l.etapa) }">{{ etapaLabel(l.etapa) }}</span></td>
              <td><span class="kb-pri" :class="`pri-${l.prioridade}`">{{ l.prioridade }}</span></td>
              <td class="td-copy text-muted text-sm" @click="copyText(l.proximo_followup ? fmtDataHora(l.proximo_followup) : '')" title="Clique para copiar">{{ l.proximo_followup ? fmtDataHora(l.proximo_followup) : '—' }}</td>
              <td class="td-copy" style="text-align:right;font-weight:600;color:var(--accent)" @click="copyText(l.valor_estimado ? fmt(l.valor_estimado) : '')" title="Clique para copiar">{{ l.valor_estimado ? fmt(l.valor_estimado) : '—' }}</td>
              <td @click.stop><button class="btn btn-ghost btn-icon btn-sm" @click="openLead(l.id)" title="Editar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- FOLLOW-UP TAB -->
    <div v-if="tab === 'followup'" class="fu-wrap">
      <div v-if="!listaFollowUp.length" class="fu-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <p>Nenhum follow-up agendado</p>
        <span>Adicione datas de follow-up nos leads para vê-los aqui</span>
      </div>
      <div v-else class="fu-list">
        <div v-for="l in listaFollowUp" :key="l.id"
          class="fu-card" :class="{ 'fu-vencido': isFuVencido(l), 'fu-hoje': isFuHoje(l) }"
          @click="openLead(l.id)">
          <div class="fu-card-left">
            <div class="fu-datetime">
              <span class="fu-date">{{ fmtFuDate(l.proximo_followup) }}</span>
              <span class="fu-time">{{ fmtFuTime(l.proximo_followup) }}</span>
            </div>
            <div class="fu-status-dot" :class="{ 'dot-vencido': isFuVencido(l), 'dot-hoje': isFuHoje(l), 'dot-futuro': !isFuVencido(l) && !isFuHoje(l) }"></div>
          </div>
          <div class="fu-card-body">
            <div class="fu-nome">{{ l.nome }}</div>
            <div class="fu-neg">{{ l.negocio || l.categoria || '—' }}</div>
            <div class="fu-meta">
              <span class="etapa-tag" :style="{ background: etapaColor(l.etapa)+'18', color: etapaColor(l.etapa) }">{{ etapaLabel(l.etapa) }}</span>
              <span v-if="l.notas" class="fu-nota">{{ l.notas.slice(0, 60) }}{{ l.notas.length > 60 ? '...' : '' }}</span>
            </div>
          </div>
          <div class="fu-card-right">
            <button class="btn btn-primary btn-sm fu-concluido" @click.stop="concluirFollowUp(l)" title="Marcar follow-up como concluído">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Concluído
            </button>
            <button class="btn btn-secondary btn-sm btn-icon" @click.stop="router.push('/slaczap?lead='+l.id)" title="SlacZap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon" @click.stop="openLead(l.id)" title="Editar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- RELEAD TAB -->
    <div v-if="tab === 'relead'" class="fu-wrap">
      <div v-if="!listaRelead.length" class="fu-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        <p>Nenhum relead agendado</p>
        <span>Leads com interesse que precisam de uma nova abordagem</span>
      </div>
      <div v-else class="fu-list">
        <div v-for="l in listaRelead" :key="l.id"
          class="fu-card fu-relead"
          @click="openLead(l.id)">
          <div class="fu-card-left">
            <div class="fu-datetime">
              <span class="fu-date">{{ fmtFuDate(l.relead_data) }}</span>
              <span class="fu-time">{{ fmtFuTime(l.relead_data) }}</span>
            </div>
            <div class="fu-status-dot dot-purple"></div>
          </div>
          <div class="fu-card-body">
            <div class="fu-nome">{{ l.nome }}</div>
            <div class="fu-neg">{{ l.negocio || l.categoria || '—' }}</div>
            <div class="fu-meta">
              <span class="etapa-tag" :style="{ background: etapaColor(l.etapa)+'18', color: etapaColor(l.etapa) }">{{ etapaLabel(l.etapa) }}</span>
              <span v-if="l.notas" class="fu-nota">{{ l.notas.slice(0, 60) }}{{ l.notas.length > 60 ? '...' : '' }}</span>
            </div>
          </div>
          <div class="fu-card-right">
            <button class="btn btn-purple btn-sm fu-concluido" @click.stop="concluirRelead(l)" title="Marcar relead como concluído">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Concluído
            </button>
            <button class="btn btn-secondary btn-sm btn-icon" @click.stop="router.push('/slaczap?lead='+l.id)" title="SlacZap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon" @click.stop="openLead(l.id)" title="Editar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>


  <!-- MODAL RELEAD: escolher data -->
  <Transition name="modal-fade">
    <div v-if="releadModal" class="modal-backdrop" @click.self="releadModal = null">
      <div class="relead-modal">
        <div class="card-modal-header">
          <div>
            <h3 class="card-modal-name">Agendar Relead</h3>
            <p class="card-modal-neg">{{ releadModal.nome }} — {{ releadModal.negocio || releadModal.categoria || '' }}</p>
          </div>
          <button class="btn btn-ghost btn-icon" @click="releadModal = null">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="card-modal-body">
          <p style="font-size:.8125rem;color:var(--text-tertiary);margin:0 0 1rem">
            Escolha quando abordar este lead novamente. Ele aparecerá na aba Relead no dia escolhido.
          </p>
          <div class="fu-datetime-input">
            <input v-model="releadDate" class="form-input" type="date" style="flex:1.4" />
            <input v-model="releadTime" class="form-input" type="time" style="flex:1" />
          </div>
          <!-- Atalhos rápidos -->
          <div class="relead-shortcuts">
            <button class="btn btn-ghost btn-sm" @click="setReleadShortcut(7)">1 semana</button>
            <button class="btn btn-ghost btn-sm" @click="setReleadShortcut(14)">2 semanas</button>
            <button class="btn btn-ghost btn-sm" @click="setReleadShortcut(30)">1 mês</button>
            <button class="btn btn-ghost btn-sm" @click="setReleadShortcut(90)">3 meses</button>
          </div>
        </div>
        <div class="card-modal-footer">
          <button class="btn btn-secondary" @click="releadModal = null">Cancelar</button>
          <button class="btn btn-purple" style="flex:1;justify-content:center" @click="confirmarRelead">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Agendar Relead
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- TOAST CÓPIA -->
  <Transition name="toast-anim">
    <div v-if="copyToast" class="copy-toast">✓ Copiado</div>
  </Transition>

  <!-- DRAWER BACKDROP -->
  <div v-show="drawerOpen" class="drawer-bg" @click="closeDrawer"></div>

  <!-- DRAWER -->
  <div v-show="drawerOpen" class="drawer">
    <div class="drawer-header">
      <h3 class="drawer-title">{{ drawerTitle }}</h3>
      <button class="btn btn-ghost btn-icon" @click="closeDrawer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <!-- Abas do drawer -->
    <div class="drawer-tabs">
      <button class="drawer-tab" :class="{ active: drawerTab === 'dados' }" @click="drawerTab = 'dados'">Dados</button>
      <button class="drawer-tab" :class="{ active: drawerTab === 'followup' }" @click="drawerTab = 'followup'">
        Follow-up
        <span v-if="currentLeadId && drawerLead && wa.isFuAutoActive(drawerLead)" class="drawer-tab-dot"></span>
      </button>
      <button class="drawer-tab" :class="{ active: drawerTab === 'financeiro' }" @click="drawerTab = 'financeiro'">Financeiro</button>
      <button class="drawer-tab" :class="{ active: drawerTab === 'ia' }" @click="drawerTab = 'ia'">
        IA
        <span v-if="currentLeadId && drawerLead && (wa.isSdrActive(drawerLead) || wa.isFuAutoActive(drawerLead))" class="drawer-tab-dot"></span>
      </button>
      <button class="drawer-tab" :class="{ active: drawerTab === 'historico' }" @click="drawerTab = 'historico'">Timeline</button>
    </div>

    <div class="drawer-body">
      <!-- ── ABA DADOS ── -->
      <div v-show="drawerTab === 'dados'">
      <div class="drawer-section">
        <p class="drawer-section-title">Informações</p>
        <div class="form-group"><label class="form-label">Nome *</label><input v-model="form.nome" class="form-input" placeholder="Nome do responsável" /></div>
        <div class="form-group"><label class="form-label">Negócio</label><input v-model="form.negocio" class="form-input" placeholder="Ex: Salão da Maria" /></div>
        <div class="form-group"><label class="form-label">Telefone *</label><input v-model="form.telefone" class="form-input" placeholder="(47) 99999-9999" /></div>
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select v-model="form.categoria" class="form-select">
            <option value="">Selecionar...</option>
            <option>Academia</option><option>Salão de Beleza</option><option>Clínica</option>
            <option>Restaurante</option><option>Pet Shop</option><option>Oficina Mecânica</option>
            <option>Confecção</option><option>Advocacia</option><option>Personal Trainer</option><option>Outro</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Cidade</label><input v-model="form.cidade" class="form-input" placeholder="Ex: Brusque/SC" /></div>
        <div class="form-group"><label class="form-label">Instagram</label><input v-model="form.instagram" class="form-input" placeholder="@perfil" /></div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Funil</p>
        <div class="form-group">
          <label class="form-label">Serviço de interesse</label>
          <select v-model="form.site_atual" class="form-select">
            <option value="">Selecionar...</option>
            <option>Site Essencial</option><option>Site Profissional</option><option>Site Completo</option>
            <option>Google Meu Negócio</option><option>Tráfego Pago</option>
            <option>Automação WhatsApp</option><option>Manutenção</option><option>Pacote Completo</option><option>Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Etapa</label>
          <select v-model="form.etapa" class="form-select">
            <option v-for="e in ETAPAS" :key="e.id" :value="e.id">{{ e.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Prioridade</label>
          <select v-model="form.prioridade" class="form-select">
            <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
          </select>
        </div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Notas</p>
        <div class="form-group"><textarea v-model="form.notas" class="form-textarea" placeholder="Observações, objeções, contexto..."></textarea></div>
      </div>
      <div v-if="histEtapas.length" class="drawer-section">
        <p class="drawer-section-title">Histórico de etapas</p>
        <div v-for="h in histEtapas" :key="h.ts" class="hist-row">
          <span style="color:var(--accent)">{{ h.de }}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <span>{{ h.para }}</span>
          <span class="hist-time">{{ fmtDataHora(h.ts) }}</span>
        </div>
      </div>
      </div><!-- /aba dados -->

      <!-- ── ABA FOLLOW-UP ── -->
      <div v-show="drawerTab === 'followup'">
      <div class="drawer-section">
        <p class="drawer-section-title">Follow-up manual</p>
        <div class="form-group">
          <label class="form-label">Data e hora</label>
          <input type="datetime-local" class="form-input" v-model="drawerFollowupDate" />
        </div>
        <div class="form-group">
          <label class="form-label">Contexto</label>
          <input type="text" class="form-input" v-model="drawerFollowupObs" placeholder="Ex.: ligar às 14h sobre proposta" />
        </div>
        <button class="btn btn-primary btn-sm" style="width:fit-content" @click="drawerSaveFollowup">Salvar follow-up</button>
        <div v-if="drawerLead?.proximo_followup" class="fu-hint" style="margin-top:4px">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Agendado: {{ fmtDataHora(drawerLead.proximo_followup) }}
        </div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Follow-up automático</p>
        <div class="sz-sdr-toggle-row">
          <div>
            <p class="sz-sdr-toggle-title">Ativar neste chat</p>
            <p class="sz-sdr-toggle-sub text-sm text-muted">{{ drawerLead && wa.isFuAutoActive(drawerLead) ? 'Enviará follow-up se não houver resposta no prazo' : 'Manda follow-up automático se o lead não responder' }}</p>
          </div>
          <button class="sz-sdr-pill" :class="{ 'sz-sdr-pill--on': drawerLead && wa.isFuAutoActive(drawerLead) }" @click="drawerToggleFuAutoChat">
            <span class="sz-sdr-pill-thumb"></span>
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Enviar se não responder em</label>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <select class="form-select" v-model="drawerFuAutoHorasLocal" style="width:auto">
              <option :value="1">1 hora</option><option :value="2">2 horas</option><option :value="3">3 horas</option>
              <option :value="4">4 horas</option><option :value="6">6 horas</option><option :value="8">8 horas</option>
              <option :value="12">12 horas</option><option :value="24">24 horas</option>
            </select>
            <span class="text-muted text-sm">após a última mensagem</span>
          </div>
          <button class="btn btn-primary btn-sm" style="margin-top:8px;width:fit-content" @click="drawerSaveFuAutoHoras">Salvar</button>
        </div>
        <div v-if="drawerLead && wa.isFuAutoActive(drawerLead)" class="sz-sdr-active-info">
          <div class="sz-sdr-active-row"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Follow-up automático habilitado</div>
          <div v-if="drawerLead && wa.fuAutoChats[wa.fuAutoKey(drawerLead)]?.lastSentAt" class="sz-sdr-active-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Último: {{ fmtDataHora(wa.fuAutoChats[wa.fuAutoKey(drawerLead)]?.lastSentAt) }}
          </div>
        </div>
      </div>
      </div><!-- /aba followup -->

      <!-- ── ABA FINANCEIRO ── -->
      <div v-show="drawerTab === 'financeiro'">
      <div class="drawer-section">
        <p class="drawer-section-title">Serviços</p>
        <!-- Chips dos serviços adicionados -->
        <div v-if="drawerServicosLead.length" class="serv-chips">
          <span v-for="s in drawerServicosLead" :key="s" class="serv-chip">
            {{ s }}
            <button class="serv-chip-rm" @click="drawerRemoveServico(s)" title="Remover">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
        </div>
        <!-- Input de busca/adição -->
        <div class="serv-input-wrap" @focusout="e => { if (!e.currentTarget.contains(e.relatedTarget)) drawerServicosOpen = false }">
          <div class="serv-input-row">
            <input
              class="form-input"
              v-model="drawerServicosSearch"
              placeholder="Buscar ou adicionar serviço..."
              @focus="drawerServicosOpen = true"
              @keydown.enter.prevent="drawerAddServico(drawerServicosSearch)"
              @keydown.escape="drawerServicosOpen = false"
            />
            <button class="btn btn-primary btn-sm btn-icon" @click="drawerAddServico(drawerServicosSearch)" title="Adicionar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div v-if="drawerServicosOpen && drawerServicosFiltered.length" class="serv-dropdown">
            <button
              v-for="s in drawerServicosFiltered"
              :key="s"
              class="serv-dropdown-item"
              @mousedown.prevent="drawerAddServico(s)"
            >{{ s }}</button>
          </div>
        </div>
        <div class="form-group" style="margin-top:.75rem">
          <label class="form-label">Valor estimado (R$)</label>
          <input type="number" class="form-input" :value="drawerLead?.valor_estimado ?? form.valor_estimado ?? ''" @blur="e => { form.valor_estimado = e.target.value ? Number(e.target.value) : ''; saveField('valor_estimado', e.target.value ? Number(e.target.value) : null) }" placeholder="797" />
        </div>
      </div>
      <div class="drawer-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
          <p class="drawer-section-title" style="margin:0">Parcelas</p>
          <button class="btn btn-ghost btn-sm" @click="drawerAdicionarParcela">+ Adicionar</button>
        </div>
        <div v-if="!drawerParcelasLocal.length" style="font-size:13px;color:var(--text-tertiary);padding:.25rem 0">Nenhuma parcela cadastrada.</div>
        <div v-for="(p, idx) in drawerParcelasLocal.slice().sort((a,b) => a.numero - b.numero)" :key="p.numero" class="sz-parcela-row">
          <span class="sz-parcela-num">#{{ p.numero }}</span>
          <input type="number" class="form-input sz-parcela-input" placeholder="Valor" :value="p.valor" @blur="e => { drawerParcelasLocal[idx].valor = e.target.value ? Number(e.target.value) : null; drawerSaveParcelas() }" />
          <input type="date" class="form-input sz-parcela-input" :value="p.vencimento" @blur="e => { drawerParcelasLocal[idx].vencimento = e.target.value || null; drawerSaveParcelas() }" />
          <label class="sz-parcela-pago"><input type="checkbox" :checked="p.pago" @change="drawerTogglePago(idx)" /><span>Pago</span></label>
        </div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Transações vinculadas</p>
        <p v-if="!drawerTransacoesLead.length" style="font-size:13px;color:var(--text-tertiary)">Nenhuma transação vinculada a este contato.</p>
        <div v-for="t in drawerTransacoesLead" :key="t.id" class="crmtx-row">
          <div class="crmtx-top">
            <span class="crmtx-desc">{{ t.desc }}</span>
            <span class="crmtx-val" :class="isEntrada(t) ? 'crmtx-val--in' : 'crmtx-val--out'">
              {{ isEntrada(t) ? '+' : '−' }} R$ {{ Number(t.val).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </span>
          </div>
          <div class="crmtx-bottom">
            <span class="crmtx-date">{{ fmtTxDate(t.data) }}</span>
            <span class="tx-st-badge" :class="isPago(t) ? 'tx-st--pago' : 'tx-st--pend'">{{ isPago(t) ? 'recebido' : 'pendente' }}</span>
          </div>
        </div>
      </div>
      </div><!-- /aba financeiro -->

      <!-- ── ABA IA ── -->
      <div v-show="drawerTab === 'ia'">
      <div class="drawer-section">
        <p class="drawer-section-title">SDR por IA</p>
        <div v-if="!wa.sdrConfig.enabled" class="sz-sdr-section-warn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          SDR desativado globalmente. Ative em <router-link to="/sdr" class="sz-sdr-link">SDR IA</router-link>.
        </div>
        <div class="sz-sdr-toggle-row">
          <div>
            <p class="sz-sdr-toggle-title">Ativar SDR neste chat</p>
            <p class="sz-sdr-toggle-sub text-sm text-muted">{{ drawerLead && wa.isSdrActive(drawerLead) ? 'SDR respondendo automaticamente · ' + (wa.sdrChats[wa.sdrChatKey(drawerLead)]?.msgCount || 0) + ' msgs' : 'O agente responderá mensagens automaticamente' }}</p>
          </div>
          <button class="sz-sdr-pill" :class="{ 'sz-sdr-pill--on': drawerLead && wa.isSdrActive(drawerLead) }" @click="drawerLead && wa.toggleSdrChat(drawerLead)" :disabled="!wa.sdrConfig.enabled">
            <span class="sz-sdr-pill-thumb"></span>
          </button>
        </div>
        <div v-if="drawerLead && wa.isSdrActive(drawerLead)" class="sz-sdr-active-info">
          <div class="sz-sdr-active-row"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Respostas automáticas habilitadas</div>
          <div class="sz-sdr-active-row"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Horário: {{ wa.sdrConfig.horaInicio }} – {{ wa.sdrConfig.horaFim }}</div>
          <div class="sz-sdr-active-row"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>Limite: {{ wa.sdrConfig.limiteMsg }} msgs por chat</div>
          <div v-if="!wa.sdrIsInHours()" class="sz-sdr-active-row sz-sdr-active-row--warn">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ drawerSdrForaMotivo }}
          </div>
        </div>
      </div>
      <div class="drawer-section">
        <p class="drawer-section-title">Análise de conversa</p>
        <div v-if="drawerAnalisando" style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px 0">
          <div class="sz-typing"><span></span><span></span><span></span></div>
          <p style="font-size:13px;color:var(--text-secondary)">Analisando conversa...</p>
        </div>
        <div v-else-if="drawerErroAnalise">
          <p style="font-size:13px;color:var(--status-danger);margin-bottom:12px">{{ drawerErroAnalise }}</p>
          <button class="btn btn-primary btn-sm" @click="drawerAnalisarLead">Tentar novamente</button>
        </div>
        <div v-else-if="!drawerLead?.analise_ia">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;line-height:1.5">A IA analisa as últimas mensagens e avalia o potencial deste lead.</p>
          <button class="btn btn-primary" @click="drawerAnalisarLead">Analisar conversa</button>
        </div>
        <div v-else>
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:12px;color:var(--text-secondary)">Score</span>
              <span style="font-size:12px;font-weight:600" :style="{ color: drawerLead.analise_ia.score > 70 ? 'var(--accent)' : drawerLead.analise_ia.score >= 40 ? 'var(--status-warning)' : 'var(--status-danger)' }">{{ drawerLead.analise_ia.score }}/100</span>
            </div>
            <div style="height:6px;background:var(--bg-overlay);border-radius:3px;overflow:hidden">
              <div style="height:100%;border-radius:3px;transition:width 0.3s" :style="{ width: drawerLead.analise_ia.score + '%', background: drawerLead.analise_ia.score > 70 ? 'var(--accent)' : drawerLead.analise_ia.score >= 40 ? 'var(--status-warning)' : 'var(--status-danger)' }"></div>
            </div>
          </div>
          <p style="font-size:13px;color:var(--text-primary);line-height:1.6;margin-bottom:16px">{{ drawerLead.analise_ia.resumo }}</p>
          <div v-if="drawerLead.analise_ia.positivos?.length" style="margin-bottom:14px">
            <p style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Pontos positivos</p>
            <div v-for="p in drawerLead.analise_ia.positivos" :key="p" class="sz-analise-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg><span>{{ p }}</span></div>
          </div>
          <div v-if="drawerLead.analise_ia.atencao?.length" style="margin-bottom:16px">
            <p style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Pontos de atenção</p>
            <div v-for="a in drawerLead.analise_ia.atencao" :key="a" class="sz-analise-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning)" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>{{ a }}</span></div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border-subtle)">
            <span style="font-size:11px;color:var(--text-tertiary)">
              {{ drawerLead.analise_ia.geradoEm ? 'Gerado em ' + new Date(drawerLead.analise_ia.geradoEm).toLocaleString('pt-BR') : 'Data não registrada — re-analise para atualizar' }}
            </span>
            <button class="btn btn-ghost btn-sm" @click="drawerAnalisarLead">Re-analisar</button>
          </div>
        </div>
      </div>
      </div><!-- /aba ia -->

      <!-- ── ABA HISTÓRICO ── -->
      <div v-show="drawerTab === 'historico'">
      <div v-if="currentLeadId" class="drawer-section">
        <p class="drawer-section-title">Linha do tempo</p>
        <div class="conv-list">
          <div v-if="!drawerTimeline.length" class="conv-empty">Nenhum registro ainda</div>
          <template v-for="c in drawerTimeline" :key="c.id">
            <!-- Evento de sistema (etapa/prioridade) -->
            <div v-if="c.canal === 'sistema'" class="tl-event">
              <span class="tl-event-line"></span>
              <span class="tl-event-dot"></span>
              <span class="tl-event-text">{{ c.mensagem }}</span>
              <span class="tl-event-time">{{ fmtDataHora(c.data) }}</span>
            </div>
            <!-- Mensagem normal -->
            <div v-else class="conv-item">
              <div class="conv-meta">
                <span class="conv-canal">{{ c.canal }}</span>
                <span :class="c.direcao === 'recebido' ? 'dir-in' : 'dir-out'">{{ c.direcao === 'recebido' ? '← Recebido' : '→ Enviado' }}</span>
                <span class="conv-time">{{ fmtDataHora(c.data) }}</span>
              </div>
              <div class="conv-msg">{{ c.mensagem }}</div>
            </div>
          </template>
        </div>
        <div class="conv-composer">
          <div class="conv-selects">
            <div class="conv-select-wrap">
              <span class="conv-select-label">Canal</span>
              <select v-model="convCanal" class="form-select" style="font-size:.8rem;padding:.35rem .6rem">
                <option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option>
                <option value="email">Email</option><option value="ligacao">Ligação</option>
              </select>
            </div>
            <div class="conv-select-wrap">
              <span class="conv-select-label">Direção</span>
              <select v-model="convDir" class="form-select" style="font-size:.8rem;padding:.35rem .6rem">
                <option value="enviado">Enviado</option><option value="recebido">Recebido</option>
              </select>
            </div>
          </div>
          <textarea v-model="convMsg" class="form-textarea" style="min-height:60px;font-size:.85rem;resize:none" placeholder="Registrar mensagem..." @keydown.ctrl.enter="addConversa"></textarea>
          <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center" @click="addConversa">+ Registrar</button>
        </div>
      </div>
      </div><!-- /aba historico -->

    </div>
    <div class="drawer-footer">
      <button class="btn btn-secondary" @click="router.push('/slaczap?lead='+currentLeadId)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        SlacZap
      </button>
      <button class="btn btn-primary" style="flex:1;justify-content:center" @click="salvar">Salvar</button>
      <button v-if="currentLeadId" class="btn btn-danger btn-icon" @click="deletar" title="Excluir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  </div>

  <FecharNegocioModal v-model="fecharOpen" :lead="fecharLead" @fechado="onNegocioFechado" />
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FecharNegocioModal from '@/components/crm/FecharNegocioModal.vue'
import { useLeadsStore, ETAPAS } from '@/stores/leads'
import { useWorkStore } from '@/stores/work'
import { useAuthStore } from '@/stores/auth'
import { useFinStore } from '@/stores/fin'
import { useWaStore } from '@/stores/wa'
import { useSaving } from '@/composables/useSaving'
import { usePushNotifications } from '@/composables/usePushNotifications'
import { sb } from '@/lib/supabase'

const router = useRouter()
const route  = useRoute()
const wa = useWaStore()

const leads = useLeadsStore()
const work  = useWorkStore()
const auth  = useAuthStore()
const fin   = useFinStore()
const { run, toast } = useSaving()
const fmt = fin.fmt

// ── Drawer core (declarado cedo para que os computeds abaixo possam usar) ──
const drawerTab        = ref('dados')
const drawerOpen       = ref(false)
const drawerTitle      = ref('Novo Lead')
const currentLeadId    = ref(null)
const script           = ref('')
const histEtapas       = ref([])
const convCanal        = ref('whatsapp')
const convDir          = ref('enviado')
const convMsg          = ref('')

// ── Lead reativo do drawer ──
const drawerLead = computed(() =>
  currentLeadId.value ? leads.leads.find(l => l.id === currentLeadId.value) ?? null : null
)

// ── Estado das abas extras do drawer ──
const drawerFollowupDate    = ref('')
const drawerFollowupObs     = ref('')
const drawerParcelasLocal   = ref([])
const drawerAnalisando      = ref(false)
const drawerErroAnalise     = ref(null)
const drawerFuAutoHorasLocal = ref(4)

// Sync estado quando muda de aba ou lead
watch([() => drawerTab.value, () => currentLeadId.value], () => {
  if (!drawerLead.value) return
  const l = drawerLead.value
  if (drawerTab.value === 'followup') {
    const d = l.proximo_followup
    drawerFollowupDate.value = d ? toLocalDatetimeInput(d) : ''
    drawerFollowupObs.value  = l.followup_obs ?? ''
    const fuKey = wa.fuAutoKey(l)
    drawerFuAutoHorasLocal.value = (fuKey && wa.fuAutoChats[fuKey]?.horas) || 4
  }
  if (drawerTab.value === 'financeiro') {
    drawerParcelasLocal.value = JSON.parse(JSON.stringify(l.parcelas ?? []))
  }
  if (drawerTab.value === 'ia') {
    drawerErroAnalise.value = null
  }
})

// Transações vinculadas ao lead — prioriza tag 'lead:ID' no obs, fallback por nome do cli
const drawerTransacoesLead = computed(() => {
  if (!drawerLead.value) return []
  const id   = drawerLead.value.id
  const nome = (drawerLead.value.nome || '').toLowerCase()
  return fin.fin
    .filter(t => t.obs?.includes('lead:' + id) || (nome && t.cli?.toLowerCase() === nome))
    .slice(0, 20)
})

// Motivo SDR fora do horário
const drawerSdrForaMotivo = computed(() => {
  const day  = new Date().getDay()
  const dias = wa.sdrConfig.diasSemana || []
  if (!dias.includes(day)) {
    const NOMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    return `Fora dos dias configurados (${dias.map(d => NOMES[d]).join(', ') || '—'}) — SDR pausado`
  }
  return `Fora do horário — SDR pausado até ${wa.sdrConfig.horaInicio}`
})

function toLocalDatetimeInput(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

// Salva campo direto no lead sem precisar do botão "Salvar"
function saveField(field, value) {
  if (!drawerLead.value) return
  leads.upsert({ id: drawerLead.value.id, [field]: value ?? null })
}

// Follow-up manual
async function drawerSaveFollowup() {
  if (!drawerLead.value) return
  await leads.upsert({
    id: drawerLead.value.id,
    proximo_followup: drawerFollowupDate.value ? new Date(drawerFollowupDate.value).toISOString() : null,
    followup_obs: drawerFollowupObs.value || null,
    followup_count: (drawerLead.value.followup_count ?? 0) + 1
  })
  toast('Follow-up salvo', 'ok')
}

// FuAuto
async function drawerToggleFuAutoChat() {
  const l = drawerLead.value
  if (!l) return
  const wasActive = wa.isFuAutoActive(l)
  await wa.toggleFuAutoChat(l, drawerFuAutoHorasLocal.value)
  if (!wasActive) {
    const fuAt = new Date(Date.now() + drawerFuAutoHorasLocal.value * 3600000).toISOString()
    await leads.upsert({ id: l.id, proximo_followup: fuAt })
  }
}

async function drawerSaveFuAutoHoras() {
  const l = drawerLead.value
  if (!l) return
  await wa.setFuAutoHoras(l, drawerFuAutoHorasLocal.value)
  if (wa.isFuAutoActive(l)) {
    const fuAt = new Date(Date.now() + drawerFuAutoHorasLocal.value * 3600000).toISOString()
    await leads.upsert({ id: l.id, proximo_followup: fuAt })
  }
  toast('Configuração salva', 'ok')
}

// Financeiro — serviços
const drawerServicosSearch = ref('')
const drawerServicosOpen   = ref(false)

const drawerServicosLead = computed(() =>
  Array.isArray(drawerLead.value?.servicos) ? drawerLead.value.servicos : []
)

const drawerServicosDisponiveis = computed(() => {
  const set = new Set()
  for (const l of leads.leads) {
    if (Array.isArray(l.servicos)) l.servicos.forEach(s => set.add(s))
  }
  return [...set].sort()
})

const drawerServicosFiltered = computed(() => {
  const q = drawerServicosSearch.value.trim().toLowerCase()
  const jaAdicionados = new Set(drawerServicosLead.value)
  const lista = drawerServicosDisponiveis.value.filter(s => !jaAdicionados.has(s))
  if (!q) return lista
  return lista.filter(s => s.toLowerCase().includes(q))
})

function drawerAddServico(nome) {
  const n = (nome || '').trim()
  if (!n || !drawerLead.value) return
  if (drawerServicosLead.value.includes(n)) { drawerServicosSearch.value = ''; return }
  const atualizado = [...drawerServicosLead.value, n]
  leads.upsert({ id: drawerLead.value.id, servicos: atualizado })
  drawerServicosSearch.value = ''
  drawerServicosOpen.value = false
}

function drawerRemoveServico(nome) {
  if (!drawerLead.value) return
  const atualizado = drawerServicosLead.value.filter(s => s !== nome)
  leads.upsert({ id: drawerLead.value.id, servicos: atualizado })
}

// Financeiro — parcelas
function drawerAdicionarParcela() {
  drawerParcelasLocal.value.push({ numero: drawerParcelasLocal.value.length + 1, valor: null, vencimento: null, pago: false })
}
function drawerSaveParcelas() {
  if (!drawerLead.value) return
  leads.upsert({ id: drawerLead.value.id, parcelas: drawerParcelasLocal.value })
}
function drawerTogglePago(idx) {
  drawerParcelasLocal.value[idx].pago = !drawerParcelasLocal.value[idx].pago
  drawerSaveParcelas()
}

// IA — análise de conversa
async function drawerAnalisarLead() {
  if (!drawerLead.value) return
  drawerAnalisando.value  = true
  drawerErroAnalise.value = null
  try {
    const loaded = await leads.loadConversas(drawerLead.value.id, { noStore: true })
    const msgs = (loaded || [])
      .filter(c => c.canal === 'whatsapp')
      .slice(-50)
      .map(m => ({ direcao: m.direcao, mensagem: (m.mensagem || '').slice(0, 500), data: m.data }))
    const { data, error } = await sb.functions.invoke('analyze-lead', {
      body: { leadId: drawerLead.value.id, messages: msgs }
    })
    if (error) throw error
    await leads.upsert({ id: drawerLead.value.id, analise_ia: { ...data, geradoEm: new Date().toISOString() } })
  } catch {
    drawerErroAnalise.value = 'Erro ao analisar. Tente novamente.'
  } finally {
    drawerAnalisando.value = false
  }
}

// ── WhatsApp ──
const waMensagem       = ref('')
const waTemplateId     = ref('')
const waGerandoScript  = ref(false)
const waEnviando       = ref(false)

const waMensagens = computed(() =>
  leads.conversas
    .filter(c => c.canal === 'whatsapp')
    .slice().sort((a, b) => new Date(a.data) - new Date(b.data))
)

const waTemplatesFiltrados = computed(() => {
  const etapaAtual = form.value?.etapa
  return wa.templates.filter(t => !t.etapa || t.etapa === etapaAtual)
})

function waAplicarTemplate() {
  if (!waTemplateId.value) return
  const t = wa.templates.find(x => x.id === waTemplateId.value)
  if (!t) return
  waMensagem.value = t.corpo
    .replace(/\{\{nome\}\}/g, form.value.nome || '')
    .replace(/\{\{negocio\}\}/g, form.value.negocio || '')
    .replace(/\{\{cidade\}\}/g, form.value.cidade || '')
}

async function waGerarComIA() {
  waGerandoScript.value = true
  try {
    const script = await wa.gerarScript(
      auth.user.id,
      form.value.instagram,
      form.value.negocio || form.value.nome,
      form.value.cidade
    )
    waMensagem.value = script
  } catch {
    toast('Erro ao gerar script. Verifique as configurações.', 'err')
  } finally {
    waGerandoScript.value = false
  }
}

async function waEnviar() {
  if (!form.value.telefone) { toast('Lead sem telefone cadastrado', 'err'); return }
  if (!waMensagem.value.trim()) return
  waEnviando.value = true
  try {
    await wa.enviarMensagem(currentLeadId.value, auth.user.id, form.value.telefone, waMensagem.value.trim())
    waMensagem.value = ''
    waTemplateId.value = ''
    toast('Mensagem enviada!', 'ok')
  } catch (e) {
    toast('Erro: ' + (e?.message || String(e)), 'err')
  } finally {
    waEnviando.value = false
  }
}

const tab         = ref('kanban')
function changeTab(t) {
  const y = window.scrollY
  tab.value = t
  nextTick(() => {
    window.scrollTo(0, y)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, y))
    })
  })
}
const search      = ref('')
const filterEtapa = ref('')
const filterPri   = ref('')
const selected    = ref(new Set())
const selEtapa    = ref('')
const sortKey     = ref('')
const sortDir     = ref('asc')


// Copy toast
const copyToast = ref(false)
let copyToastTimer = null
function copyText(text) {
  if (!text || text === '—') return
  navigator.clipboard?.writeText(text).then(() => {
    clearTimeout(copyToastTimer)
    copyToast.value = true
    copyToastTimer = setTimeout(() => { copyToast.value = false }, 1500)
  })
}

// Modal fechar negócio
const fecharOpen = ref(false)
const fecharLead = ref(null)

// Drag-and-drop
const dragItem = ref(null)
const dragOver = ref(null)
function onDragStart(lead) { dragItem.value = lead }
async function onDrop(etapaDestino) {
  dragOver.value = null
  if (!dragItem.value || dragItem.value.etapa === etapaDestino) return
  const lead = dragItem.value; dragItem.value = null
  const vaiFicarFechado = etapaDestino === 'fechado' && lead.etapa !== 'fechado'
  const payload = { ...lead, etapa: etapaDestino, updated_at: new Date().toISOString() }
  await run(() => leads.upsert(payload), `Movido para ${etapaLabel(etapaDestino)} ✓`)
  if (vaiFicarFechado) { fecharLead.value = leads.getById(lead.id) || payload; fecharOpen.value = true }
}
function onNegocioFechado() { fecharOpen.value = false; fecharLead.value = null }

// Follow-up campos separados data + hora
const fuDate = ref('')
const fuTime = ref('')

const form = ref({
  nome:'', negocio:'', telefone:'', categoria:'', cidade:'', instagram:'',
  site_atual:'', etapa:'contato', prioridade:'media', valor_estimado:'',
  proximo_followup:'', notas:''
})

function onFuDateChange() {
  if (!fuDate.value) { form.value.proximo_followup = ''; return }
  const time = fuTime.value || '09:00'
  form.value.proximo_followup = new Date(`${fuDate.value}T${time}:00`).toISOString()
  fuTime.value = time
  agendarNotificacao()
}
function onFuTimeChange() {
  if (!fuDate.value) return
  form.value.proximo_followup = new Date(`${fuDate.value}T${fuTime.value}:00`).toISOString()
  agendarNotificacao()
}
function clearFollowUp() {
  form.value.proximo_followup = ''; fuDate.value = ''; fuTime.value = ''
}
function syncFuFields() {
  if (form.value.proximo_followup) {
    const d = new Date(form.value.proximo_followup)
    const pad = n => String(n).padStart(2, '0')
    fuDate.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    fuTime.value = d.toTimeString().slice(0, 5)
  } else {
    fuDate.value = ''; fuTime.value = ''
  }
}

// Notificação Web Push agendada
async function agendarNotificacao() {
  if (!form.value.proximo_followup) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const ts = new Date(form.value.proximo_followup).getTime()
  const diff = ts - Date.now()
  if (diff <= 0) return
  // Armazena no localStorage para o service worker disparar
  const lembretes = JSON.parse(localStorage.getItem('slac_lembretes') || '[]')
  const id = currentLeadId.value || 'new_' + Date.now()
  const idx = lembretes.findIndex(l => l.leadId === id)
  const item = { leadId: id, nome: form.value.nome, negocio: form.value.negocio, ts }
  if (idx !== -1) lembretes[idx] = item; else lembretes.push(item)
  localStorage.setItem('slac_lembretes', JSON.stringify(lembretes))
  // Timeout local (funciona enquanto app está aberto)
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('SLAC · Follow-up', {
        body: `${form.value.nome}${form.value.negocio ? ' — ' + form.value.negocio : ''}`,
        icon: '/icons/web-app-manifest-192x192.png',
        tag: 'fu_' + id
      })
    }
  }, diff)
}

// Follow-up list
const listaFollowUp = computed(() => {
  return leads.leads
    .filter(l => l.proximo_followup && l.etapa !== 'perdido')
    .sort((a, b) => new Date(a.proximo_followup) - new Date(b.proximo_followup))
})
function isFuVencido(l) { return new Date(l.proximo_followup) < new Date() && !isFuHoje(l) }
function isFuHoje(l) {
  const d = new Date(l.proximo_followup)
  const h = new Date()
  return d.toDateString() === h.toDateString()
}
function fmtFuDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })
}
function fmtFuTime(d) {
  if (!d) return ''
  const dt = new Date(d)
  const h = dt.getHours(), m = dt.getMinutes()
  if (h === 0 && m === 0) return ''
  return dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
}

// Kanban filtrado
const leadsByEtapa = computed(() => {
  const q = search.value.toLowerCase()
  const map = {}
  for (const l of leads.leads) {
    if (q && !(l.nome+l.negocio+l.telefone+l.categoria).toLowerCase().includes(q)) continue
    if (!map[l.etapa]) map[l.etapa] = []
    map[l.etapa].push(l)
  }
  return map
})
function byEtapaFiltrado(etapa) { return leadsByEtapa.value[etapa] || [] }

// Tabela filtrada
const listaFiltrada = computed(() => {
  let lista = leads.leads
  if (search.value) {
    const q = search.value.toLowerCase()
    lista = lista.filter(l => (l.nome+l.negocio+l.telefone+l.categoria).toLowerCase().includes(q))
  }
  if (filterEtapa.value) lista = lista.filter(l => l.etapa === filterEtapa.value)
  if (filterPri.value)   lista = lista.filter(l => l.prioridade === filterPri.value)
  if (sortKey.value) {
    const key = sortKey.value, dir = sortDir.value === 'asc' ? 1 : -1
    lista = [...lista].sort((a,b) => {
      const va = a[key]??'', vb = b[key]??''
      if (typeof va === 'number') return (va-vb)*dir
      return String(va).localeCompare(String(vb),'pt-BR')*dir
    })
  }
  return lista
})
function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value==='asc'?'desc':'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

const ETAPA_LABEL = { contato:'Contato', interesse:'Interesse', demo:'Demo enviada', negociacao:'Negociação', fechado:'Fechado', perdido:'Perdido' }
const ETAPA_COLOR = { contato:'#3b82f6', interesse:'#f59e0b', demo:'#8b5cf6', negociacao:'#f97316', fechado:'#22c55e', perdido:'#6b7280' }
function etapaLabel(e) { return ETAPA_LABEL[e] || e }
function etapaColor(e) { return ETAPA_COLOR[e] || '#6b7280' }
function diasNaEtapa(l) {
  const ref = l.etapa_since || l.updated_at || l.created_at
  if (!ref) return null
  const dias = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000)
  if (dias === 0) return 'hoje'
  if (dias === 1) return '1 dia'
  return `${dias} dias`
}

// Timeline do histórico — mensagens + eventos de sistema ordenados por data
const drawerTimeline = computed(() =>
  [...leads.conversas].sort((a, b) => new Date(b.data) - new Date(a.data))
)

// Helpers para transações do modal de fechamento
// tipo pode ser 'entrada' (FecharNegocioModal) ou 'receita' (Financeiro manual)
function isEntrada(t) { return t.tipo === 'entrada' || t.tipo === 'receita' }
// st pode ser 'recebido' (FecharNegocioModal) ou 'pago' (Financeiro manual)
function isPago(t)    { return t.st === 'recebido' || t.st === 'pago' }

// Data sem offset UTC (datas YYYY-MM-DD são meia-noite UTC → dia anterior no Brasil)
function fmtTxDate(d) {
  if (!d) return '—'
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}/${m[2]}/${m[1].slice(2)}`
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtDataHora(d) {
  if (!d) return '—'
  const dt = new Date(d)
  const h = dt.getHours(), m = dt.getMinutes()
  const date = dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })
  if (h === 0 && m === 0) return date
  return `${date} ${dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}`
}

function toggleSel(id, checked) {
  if (checked) selected.value.add(id); else selected.value.delete(id)
  selected.value = new Set(selected.value)
}
function toggleAll(checked) {
  listaFiltrada.value.forEach(l => checked ? selected.value.add(l.id) : selected.value.delete(l.id))
  selected.value = new Set(selected.value)
}

async function moverSelecionados() {
  if (!selEtapa.value) { toast('Escolha uma etapa','err'); return }
  const ids = [...selected.value]
  await run(async () => {
    for (const id of ids) {
      const l = leads.getById(id)
      if (l) await leads.upsert({...l, etapa:selEtapa.value, updated_at:new Date().toISOString()})
    }
    selected.value.clear(); selEtapa.value = ''
  }, ids.length+' leads movidos ✓')
}

async function excluirSelecionados() {
  const ids = [...selected.value]
  if (!ids.length) return
  if (!confirm('Excluir '+ids.length+' lead(s)?')) return
  ids.forEach(id => leads.remove(id)); selected.value.clear()
  toast(ids.length+' removido(s) ✓','ok')
}

function openNew(etapa='contato') {
  currentLeadId.value=null; drawerTitle.value='Novo Lead'
  script.value=''; histEtapas.value=[]; leads.conversas=[]
  leads.drawerLeadId=null; drawerTab.value='dados'
  waMensagem.value=''; waTemplateId.value=''
  form.value={nome:'',negocio:'',telefone:'',categoria:'',cidade:'',instagram:'',site_atual:'',etapa,prioridade:'media',valor_estimado:'',proximo_followup:'',notas:''}
  fuDate.value=''; fuTime.value=''
  drawerOpen.value=true
}
function openNewEtapa(etapa) { openNew(etapa) }

async function openLead(id) {
  const l = leads.getById(id); if (!l) return
  currentLeadId.value=id; drawerTitle.value=l.nome; script.value=''
  leads.drawerLeadId=id; drawerTab.value='dados'
  drawerErroAnalise.value=null; drawerAnalisando.value=false; drawerParcelasLocal.value=[]
  waMensagem.value=''; waTemplateId.value=''
  form.value={nome:l.nome||'',negocio:l.negocio||'',telefone:l.telefone||'',categoria:l.categoria||'',cidade:l.cidade||'',instagram:l.instagram||'',site_atual:l.site_atual||'',etapa:l.etapa||'contato',prioridade:l.prioridade||'media',valor_estimado:l.valor_estimado||'',proximo_followup:l.proximo_followup||'',notas:l.notas||''}
  syncFuFields()
  try { const raw=localStorage.getItem('slac_hist_'+id); histEtapas.value=raw?JSON.parse(raw):[] } catch { histEtapas.value=[] }
  drawerOpen.value=true
  await Promise.all([leads.loadConversas(id), wa.loadTemplates()])
}
function closeDrawer() { drawerOpen.value=false; currentLeadId.value=null; leads.conversas=[]; leads.drawerLeadId=null }

function salvarHistorico(id,de,para) {
  if(de===para) return
  try {
    const key='slac_hist_'+id
    const hist=JSON.parse(localStorage.getItem(key)||'[]')
    hist.unshift({de:etapaLabel(de),para:etapaLabel(para),ts:new Date().toISOString()})
    localStorage.setItem(key,JSON.stringify(hist.slice(0,20)))
  } catch {}
}

async function salvar() {
  if(!form.value.nome||!form.value.telefone){toast('Nome e telefone obrigatórios','err');return}
  if(currentLeadId.value){
    const l=leads.getById(currentLeadId.value)
    if(l&&l.etapa!==form.value.etapa) salvarHistorico(currentLeadId.value,l.etapa,form.value.etapa)
  }
  const eraFechado=currentLeadId.value?leads.getById(currentLeadId.value)?.etapa==='fechado':false
  const vaiFicarFechado=form.value.etapa==='fechado'
  const payload={
    id:currentLeadId.value||'l'+Date.now(), user_id:auth.user.id,
    nome:form.value.nome, telefone:form.value.telefone, negocio:form.value.negocio,
    categoria:form.value.categoria, cidade:form.value.cidade, instagram:form.value.instagram,
    site_atual:form.value.site_atual, etapa:form.value.etapa, prioridade:form.value.prioridade,
    valor_estimado:parseFloat(form.value.valor_estimado)||0,
    proximo_followup:form.value.proximo_followup||null,
    notas:form.value.notas, updated_at:new Date().toISOString()
  }
  await run(()=>leads.upsert(payload),'Salvo ✓')
  if(vaiFicarFechado&&!eraFechado){fecharLead.value=leads.getById(payload.id)||payload;fecharOpen.value=true;closeDrawer();return}
  closeDrawer()
}

async function deletar() {
  if(!currentLeadId.value) return
  if(!confirm('Remover este lead permanentemente?')) return
  leads.remove(currentLeadId.value); closeDrawer(); toast('Lead removido ✓','ok')
}

function gerarScript() {
  const e=form.value.etapa,nome=form.value.nome||'cliente',neg=form.value.negocio||'seu negócio'
  const scripts={
    contato:`Oi ${nome}! Tudo bem? Me chamo Eduardo da Sano Lab.\n\nVi que o ${neg} está no Google Maps mas ainda não tem um site profissional.\n\nCriamos sites que aparecem no Google e trazem clientes novos.\n\nPoderia ver uma prévia gratuita?`,
    interesse:`Oi ${nome}! Que ótimo que gostou da ideia.\n\nVou preparar uma prévia para o ${neg} — em 24h você já vê como ficaria.\n\nPosso começar hoje?`,
    demo:`Oi ${nome}! Preparei a prévia do site para o ${neg}.\n\n[Link da prévia]\n\nO que achou? Posso ajustar qualquer detalhe.`,
    negociacao:`Oi ${nome}! O site do ${neg} está pronto. O investimento é R$797 com 50% agora e 50% na entrega.\n\nPodemos fechar hoje?`,
    fechado:`Oi ${nome}! Parabéns pelo investimento no ${neg}!\n\nObrigado pela confiança!`,
    perdido:`Oi ${nome}, quando quiser retomar, estarei por aqui.`
  }
  script.value=scripts[e]||'Script não disponível.'
}

async function addConversa() {
  if(!currentLeadId.value){toast('Salve o lead primeiro','err');return}
  if(!convMsg.value.trim()) return
  await run(()=>leads.addConversa(currentLeadId.value,convCanal.value,convDir.value,convMsg.value.trim()),'Registrado ✓')
  convMsg.value=''
}

// ── Follow-up ──
async function concluirFollowUp(lead) {
  await run(() => leads.upsert({ ...lead, proximo_followup: null }), 'Follow-up concluído')
}

async function concluirRelead(lead) {
  await run(() => leads.upsert({ ...lead, relead_data: null }), 'Relead concluído')
}


async function followUp24h(lead) {
  const ts = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const iso = ts.toISOString()
  const payload = { ...lead, proximo_followup: iso, updated_at: new Date().toISOString() }

  // Atualiza localmente na store ANTES de ir pra aba (não espera o Supabase)
  const idx = leads.leads.findIndex(l => l.id === lead.id)
  if (idx !== -1) leads.leads[idx] = { ...leads.leads[idx], proximo_followup: iso }

  // Persiste no Supabase em background
  run(() => leads.upsert(payload), `Follow-up agendado para ${fmtDataHora(iso)} ✓`)

  // Agenda notificação local
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('SLAC · Follow-up', {
        body: `${lead.nome}${lead.negocio ? ' — ' + lead.negocio : ''}`,
        icon: '/icons/web-app-manifest-192x192.png',
        tag: 'fu_' + lead.id
      })
    }
  }, 24 * 60 * 60 * 1000)

  // Vai pra aba depois de atualizar localmente
  tab.value = 'followup'
}

// ── Relead ──
const releadModal = ref(null)
const releadDate  = ref('')
const releadTime  = ref('09:00')

function openReleadModal(lead) {
  releadModal.value = lead
  // Default: 1 semana
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const pad = n => String(n).padStart(2, '0')
  releadDate.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  releadTime.value = '09:00'
}

function setReleadShortcut(days) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const pad = n => String(n).padStart(2, '0')
  releadDate.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

async function confirmarRelead() {
  if (!releadDate.value || !releadModal.value) { toast('Escolha uma data', 'err'); return }
  const iso = new Date(`${releadDate.value}T${releadTime.value}:00`).toISOString()
  const lead = releadModal.value
  const payload = { ...lead, relead_data: iso, updated_at: new Date().toISOString() }
  await run(() => leads.upsert(payload), `Relead agendado para ${fmtFuDate(iso)} ✓`)
  releadModal.value = null
  tab.value = 'relead'
}

const listaRelead = computed(() =>
  leads.leads
    .filter(l => l.relead_data)
    .sort((a, b) => new Date(a.relead_data) - new Date(b.relead_data))
)

// Estado das notificações
const notifAtiva = ref(false)

const { subscribe, getSubscriptionStatus } = usePushNotifications()

onMounted(async () => {
  const s = await getSubscriptionStatus()
  notifAtiva.value = s === 'granted'
  if (route.query.tab) tab.value = route.query.tab
  if (route.query.lead) openLead(route.query.lead)
})

watch(() => route.query.tab, (t) => { if (t) tab.value = t })

async function pedirNotificacao() {
  if (notifAtiva.value) return
  console.log('[DEBUG] pedirNotificacao chamado')
  const ok = await subscribe()
  if (ok) {
    notifAtiva.value = true
    toast('Notificações ativadas', 'ok')
  } else {
    toast('Permissão negada', 'error')
  }
}
</script>

<style scoped>
/* Sel bar */
.sel-bar{display:flex;align-items:center;gap:.625rem;flex-wrap:wrap;background:var(--accent-subtle);border:1px solid var(--accent);border-radius:var(--radius-lg);padding:.625rem 1rem;}
.sel-count{font-size:.82rem;font-weight:700;color:var(--accent);}
.sel-bar-enter-active,.sel-bar-leave-active{transition:all 180ms ease;}
.sel-bar-enter-from,.sel-bar-leave-to{opacity:0;transform:translateY(-6px);}

/* Toolbar */
.toolbar{display:flex;align-items:center;gap:.875rem;flex-wrap:wrap;position:sticky;top:0;z-index:10;background:var(--bg-base);padding:.5rem 0;margin:-.5rem 0;}
.tabs{display:flex;gap:.25rem;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:.25rem;}
.tab{display:flex;align-items:center;gap:.4rem;padding:.4rem .875rem;border-radius:var(--radius-md);background:transparent;border:none;font-family:var(--font-body);font-size:.82rem;font-weight:500;color:var(--text-tertiary);cursor:pointer;transition:background 100ms ease,color 100ms ease;position:relative;}
.tab.active{background:var(--accent);color:#fff;}
.tab:not(.active):hover{background:var(--bg-overlay);color:var(--text-primary);}
.tab-badge{position:absolute;top:2px;right:2px;background:var(--status-danger);color:#fff;font-size:.55rem;font-weight:700;padding:.1rem .35rem;border-radius:99px;line-height:1.4;}

/* Search */
.kb-search-box{flex:1;max-width:320px;display:flex;align-items:center;gap:.5rem;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-full);padding:.375rem .875rem;transition:border-color 150ms ease,box-shadow 150ms ease;}
.kb-search-box:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-subtle);}
.kb-search-box svg{flex-shrink:0;color:var(--text-tertiary);}
.kb-search-input{flex:1;background:transparent;border:none;outline:none;font-family:var(--font-body);font-size:.875rem;color:var(--text-primary);}
.kb-search-input::placeholder{color:var(--text-tertiary);}
.kb-search-clear{display:flex;align-items:center;background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:0;}
.kb-search-clear:hover{color:var(--text-primary);}

/* Kanban */
.kanban-board{display:grid;grid-template-columns:repeat(6,1fr);gap:.75rem;min-height:420px;}
.kb-col{background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-lg);display:flex;flex-direction:column;overflow:hidden;min-width:0;transition:border-color 150ms ease,background 150ms ease;}
.kb-col.drop-over{border-color:var(--accent);background:var(--accent-subtle);}
.kb-head{display:flex;align-items:center;justify-content:space-between;padding:.625rem .75rem;border-bottom:1px solid var(--border-subtle);}
.kb-title{display:flex;align-items:center;gap:.375rem;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}
.kb-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.kb-count{font-size:.68rem;background:var(--bg-overlay);color:var(--text-tertiary);padding:.1rem .4rem;border-radius:var(--radius-full);font-weight:600;}
.kb-cards{flex:1;padding:.5rem;display:flex;flex-direction:column;gap:.375rem;overflow-y:auto;}
.kb-card{background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:.625rem .75rem;cursor:pointer;position:relative;transition:box-shadow 120ms ease,border-color 120ms ease,transform 120ms ease;}
.kb-card:hover{box-shadow:var(--shadow-md);border-color:var(--accent);transform:translateY(-1px);}
.kb-drag-handle{position:absolute;top:.5rem;right:.5rem;color:var(--text-tertiary);opacity:0;transition:opacity 100ms ease;cursor:grab;}
.kb-card:hover .kb-drag-handle{opacity:.5;}
.kb-name{font-size:.82rem;font-weight:600;color:var(--text-primary);margin-bottom:.1rem;}
.kb-etapa-tempo{font-size:.65rem;color:var(--text-tertiary);margin-bottom:.15rem;}
.kb-interacao{display:inline-flex;align-items:center;gap:.2rem;font-size:.62rem;font-weight:700;padding:.1rem .35rem;border-radius:99px;}
.kb-interacao--in{background:rgba(34,197,94,.12);color:var(--accent);}
.kb-interacao--out{background:rgba(136,136,136,.1);color:var(--text-tertiary);}
.kb-negocio{font-size:.7rem;color:var(--text-tertiary);margin-bottom:.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kb-neg{font-size:.72rem;color:var(--text-tertiary);margin-bottom:.375rem;}
.kb-servico{font-size:.65rem;color:var(--status-info);margin-bottom:.375rem;}
.kb-footer{display:flex;align-items:center;justify-content:space-between;}
.kb-tel{font-size:.65rem;color:var(--text-tertiary);}
.kb-pri{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em;}
.pri-alta{color:var(--status-danger);}.pri-media{color:var(--status-warning);}.pri-baixa{color:var(--status-info);}
.kb-fu{display:flex;align-items:center;gap:.25rem;font-size:.65rem;color:var(--status-warning);margin-top:.375rem;}
.kb-add{display:flex;align-items:center;justify-content:center;gap:.25rem;width:100%;padding:.4rem;background:transparent;border:1px dashed var(--border-default);border-radius:var(--radius-md);color:var(--text-tertiary);font-size:.75rem;cursor:pointer;font-family:var(--font-body);transition:border-color 120ms,color 120ms,background 120ms;}
.kb-add:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-subtle);}

/* Tabela */
.tabela-wrap{display:flex;flex-direction:column;gap:.75rem;}
.tabela-filters{display:flex;gap:.625rem;flex-wrap:wrap;align-items:center;}
.cb{accent-color:var(--accent);cursor:pointer;width:14px;height:14px;}
.row-sel td{background:var(--accent-subtle) !important;}
.wa-link{color:var(--accent);font-size:.82rem;background:none;border:none;padding:0;cursor:pointer;}
.td-copy{cursor:pointer;user-select:none;}
.td-copy:hover{color:var(--accent);text-decoration:underline dotted;}
.etapa-tag{display:inline-block;font-size:.7rem;font-weight:600;padding:.15rem .5rem;border-radius:var(--radius-full);text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;}
.th-sort{cursor:pointer;user-select:none;white-space:nowrap;}
.th-sort:hover{color:var(--accent);}
.sort-icon{font-size:.65rem;color:var(--text-tertiary);margin-left:.2rem;}

/* Follow-up tab */
.fu-wrap{display:flex;flex-direction:column;gap:.625rem;}
.fu-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;padding:3rem;color:var(--text-tertiary);text-align:center;}
.fu-empty svg{opacity:.3;}
.fu-empty p{font-size:.9375rem;font-weight:600;color:var(--text-secondary);margin:0;}
.fu-empty span{font-size:.8125rem;}
.fu-list{display:flex;flex-direction:column;gap:.5rem;}
.fu-card{display:flex;align-items:stretch;gap:1rem;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-lg);padding:.875rem 1rem;cursor:pointer;transition:box-shadow 120ms ease,border-color 120ms ease;}
.fu-card:hover{box-shadow:var(--shadow-md);border-color:var(--border-strong);}
.fu-vencido{border-color:rgba(239,68,68,.3);background:var(--status-danger-subtle);}
.fu-hoje{border-color:rgba(245,158,11,.35);background:var(--status-warning-subtle);}
.fu-card-left{display:flex;flex-direction:column;align-items:center;gap:.375rem;min-width:52px;padding-right:.75rem;border-right:1px solid var(--border-subtle);}
.fu-date{font-size:.8125rem;font-weight:700;color:var(--text-primary);text-align:center;white-space:nowrap;}
.fu-time{font-size:.7rem;color:var(--text-tertiary);font-weight:500;}
.fu-status-dot{width:8px;height:8px;border-radius:50%;}
.dot-vencido{background:var(--status-danger);}
.dot-hoje{background:var(--status-warning);}
.dot-futuro{background:var(--accent);}
.fu-card-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:.25rem;}
.fu-nome{font-size:.9rem;font-weight:700;color:var(--text-primary);}
.fu-neg{font-size:.8rem;color:var(--text-tertiary);}
.fu-meta{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:.2rem;}
.fu-nota{font-size:.75rem;color:var(--text-tertiary);font-style:italic;}
.fu-card-right{display:flex;flex-direction:column;gap:.375rem;justify-content:center;flex-shrink:0;}
.fu-concluido{gap:.375rem;}

/* Relead modal — usa card-modal-* classes compartilhadas */
.card-modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.25rem 1.25rem .875rem;}
.card-modal-name{font-size:1.125rem;font-weight:700;color:var(--text-primary);margin:0;}
.card-modal-neg{font-size:.8125rem;color:var(--text-tertiary);margin:.2rem 0 0;}
.card-modal-body{padding:.25rem 1.25rem 1rem;}
.card-modal-footer{display:flex;align-items:center;gap:.5rem;padding:.875rem 1.25rem;border-top:1px solid var(--border-default);}
.modal-fade-enter-active,.modal-fade-leave-active{transition:opacity 200ms ease;}
.modal-fade-enter-from,.modal-fade-leave-to{opacity:0;}

/* Copy toast */
.copy-toast{position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-full);padding:.375rem .875rem;font-size:.8rem;color:var(--accent);font-weight:600;box-shadow:var(--shadow-md);z-index:9999;pointer-events:none;}
.toast-anim-enter-active,.toast-anim-leave-active{transition:all 150ms ease;}
.toast-anim-enter-from,.toast-anim-leave-to{opacity:0;transform:translateX(-50%) translateY(6px);}

/* Drawer */
.drawer-bg{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:800;}
[data-theme="light"] .drawer-bg{background:rgba(200,200,210,0.3);}
.drawer{position:fixed;top:0;right:0;height:100vh;width:420px;max-width:95vw;background:rgba(18,18,18,0.38);backdrop-filter:blur(32px) saturate(180%);-webkit-backdrop-filter:blur(32px) saturate(180%);border-left:1px solid rgba(255,255,255,0.08);box-shadow:-8px 0 40px rgba(0,0,0,.5);z-index:801;display:flex;flex-direction:column;overflow:hidden;}
[data-theme="light"] .drawer{background:rgba(255,255,255,0.88);border-left:1px solid rgba(0,0,0,0.08);box-shadow:-8px 0 40px rgba(0,0,0,.1);}
/* Drawer tabs */
.drawer-tabs{display:flex;gap:2px;background:transparent;border-bottom:1px solid var(--border-subtle);padding:0 1rem;flex-shrink:0;}
.drawer-tab{display:flex;align-items:center;gap:5px;padding:.55rem .7rem;font-size:.78rem;font-weight:500;color:var(--text-tertiary);background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:color .15s,border-color .15s;white-space:nowrap;font-family:var(--font-body);}
.drawer-tab:hover{color:var(--text-secondary);}
.drawer-tab.active{color:var(--text-primary);border-bottom-color:var(--accent);font-weight:600;}
/* Aba WhatsApp */
.wa-tab{display:flex;flex-direction:column;height:100%;}
.wa-msgs{flex:1;overflow-y:auto;padding:.875rem 1.25rem;display:flex;flex-direction:column;gap:.5rem;min-height:160px;max-height:240px;}
.wa-empty{color:var(--text-tertiary);font-size:.82rem;text-align:center;padding:2rem 0;}
.wa-msg{display:flex;flex-direction:column;max-width:84%;}
.wa-out{align-self:flex-end;align-items:flex-end;}
.wa-in{align-self:flex-start;align-items:flex-start;}
.wa-bubble{padding:.45rem .7rem;border-radius:12px;font-size:.83rem;line-height:1.5;}
.wa-out .wa-bubble{background:rgba(34,197,94,.15);color:var(--accent);border-bottom-right-radius:3px;}
.wa-in .wa-bubble{background:var(--bg-overlay);color:var(--text-primary);border-bottom-left-radius:3px;}
.wa-time{font-size:.7rem;color:var(--text-tertiary);margin-top:2px;}
.wa-composer{padding:.75rem 1.25rem;border-top:1px solid var(--border-default);display:flex;flex-direction:column;gap:.5rem;}
.wa-toolbar{display:flex;gap:.5rem;}
.wa-select{flex:1;font-size:.78rem;}
.wa-ia-btn{font-size:.78rem;white-space:nowrap;}
.wa-textarea{font-size:.83rem;resize:none;}
.wa-send-btn{width:100%;justify-content:center;gap:.5rem;}
.drawer-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid var(--border-default);flex-shrink:0;}
.drawer-title{font-size:.9375rem;font-weight:700;color:var(--text-primary);}
.drawer-body{flex:1;overflow-y:auto;padding:.875rem 1.25rem;display:flex;flex-direction:column;gap:.875rem;}
.drawer-section{display:flex;flex-direction:column;gap:.5rem;padding-bottom:.875rem;border-bottom:1px solid var(--border-subtle);}
.drawer-section:last-child{border-bottom:none;}
.drawer-section-title{font-size:.62rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-tertiary);margin:0;}
.drawer-footer{display:flex;align-items:center;gap:.5rem;padding:.875rem 1.25rem;border-top:1px solid var(--border-default);flex-shrink:0;}
.script-box{background:var(--bg-overlay);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:.75rem;font-size:.8rem;color:var(--text-secondary);white-space:pre-wrap;line-height:1.6;}
.hist-row{display:flex;align-items:center;gap:.375rem;font-size:.78rem;color:var(--text-tertiary);}
.hist-time{margin-left:auto;font-size:.7rem;}
/* Timeline de histórico */
.tl-event{display:flex;align-items:center;gap:.5rem;padding:.25rem 0;position:relative;}
.tl-event-dot{width:7px;height:7px;border-radius:50%;background:var(--text-tertiary);flex-shrink:0;opacity:.5;}
.tl-event-text{flex:1;font-size:.75rem;color:var(--text-tertiary);font-style:italic;}
.tl-event-time{font-size:.68rem;color:var(--text-tertiary);opacity:.7;white-space:nowrap;}
.conv-list{display:flex;flex-direction:column;gap:.375rem;}
.conv-empty{font-size:.78rem;color:var(--text-tertiary);text-align:center;padding:.5rem;}
.conv-item{background:var(--bg-overlay);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:.5rem .625rem;}
.conv-meta{display:flex;align-items:center;gap:.375rem;margin-bottom:.2rem;}
.conv-canal{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-tertiary);}
.dir-in{font-size:.65rem;font-weight:600;color:var(--accent);}
.dir-out{font-size:.65rem;font-weight:600;color:var(--status-warning);}
.conv-time{font-size:.65rem;color:var(--text-tertiary);margin-left:auto;}
.conv-msg{font-size:.8rem;color:var(--text-primary);}
.conv-composer{display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem;}
.conv-selects{display:flex;gap:.5rem;}
.conv-select-wrap{display:flex;flex-direction:column;gap:.2rem;flex:1;}
.conv-select-label{font-size:.6rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text-tertiary);}

/* Follow-up datetime input */
.fu-datetime-input{display:flex;align-items:center;gap:.375rem;}
.fu-badge{font-size:.6rem;font-weight:700;background:var(--accent-subtle);color:var(--accent);border:1px solid var(--accent);border-radius:99px;padding:.1rem .4rem;letter-spacing:.03em;margin-left:.375rem;}
.fu-hint{display:flex;align-items:center;gap:.375rem;font-size:.75rem;color:var(--status-warning);margin-top:.25rem;}

/* Kanban card notas */
.kb-notas{font-size:.7rem;color:var(--text-tertiary);margin-bottom:.375rem;line-height:1.4;font-style:italic;}

/* Faixa amarela de follow-up no card */
.kb-fu-bar{
  position:absolute;bottom:0;left:0;right:0;
  display:flex;align-items:center;gap:.3rem;
  font-size:.62rem;font-weight:600;
  color:#92400e;
  background:linear-gradient(135deg,#fbbf24,#f59e0b);
  padding:.25rem .6rem;
  border-radius:0 0 var(--radius-md) var(--radius-md);
}
.kb-card{padding-bottom:.625rem;}
.kb-card:has(.kb-fu-bar){padding-bottom:1.75rem;}
.kb-card:has(.kb-relead-bar){padding-bottom:1.75rem;}
.kb-card:has(.kb-work-bar){padding-bottom:1.75rem;}
.kb-card:has(.kb-fu-bar):has(.kb-relead-bar){padding-bottom:3.25rem;}
.kb-card:has(.kb-fu-bar):has(.kb-work-bar){padding-bottom:3.25rem;}
.kb-card:has(.kb-relead-bar):has(.kb-work-bar){padding-bottom:3.25rem;}
.kb-card:has(.kb-fu-bar):has(.kb-relead-bar):has(.kb-work-bar){padding-bottom:4.75rem;}

/* Barra azul de work no card */
.kb-work-bar{
  position:absolute;bottom:0;left:0;right:0;
  display:flex;align-items:center;gap:.3rem;
  font-size:.62rem;font-weight:600;
  color:#dbeafe;
  background:linear-gradient(135deg,#60a5fa,#3b82f6);
  padding:.25rem .6rem;
  border-radius:0 0 var(--radius-md) var(--radius-md);
}
/* Barra roxa de relead no card */
.kb-relead-bar{
  position:absolute;bottom:0;left:0;right:0;
  display:flex;align-items:center;gap:.3rem;
  font-size:.62rem;font-weight:600;
  color:#ede9fe;
  background:linear-gradient(135deg,#a78bfa,#8b5cf6);
  padding:.25rem .6rem;
  border-radius:0 0 var(--radius-md) var(--radius-md);
}
/* Empilhamento das barras */
.kb-card:has(.kb-fu-bar) .kb-relead-bar{bottom:1.5rem;border-radius:0;}
.kb-card:has(.kb-fu-bar) .kb-work-bar{bottom:1.5rem;border-radius:0;}
.kb-card:has(.kb-relead-bar) .kb-work-bar{bottom:1.5rem;border-radius:0;}
.kb-card:has(.kb-fu-bar):has(.kb-relead-bar) .kb-work-bar{bottom:3rem;border-radius:0;}
.kb-card:has(.kb-fu-bar):has(.kb-work-bar) .kb-relead-bar{bottom:3rem;border-radius:0;}

/* Tab badge roxo */
.tab-badge--purple{background:#8b5cf6;}
.tab-badge--orange{background:var(--status-warning);}

/* Botões novos */
.btn-warning{background:rgba(245,158,11,.15);color:#d97706;border:1px solid rgba(245,158,11,.35);}
.btn-warning:hover{background:rgba(245,158,11,.25);color:#b45309;}
.btn-purple{background:rgba(139,92,246,.15);color:#7c3aed;border:1px solid rgba(139,92,246,.35);}
.btn-purple:hover{background:rgba(139,92,246,.25);color:#6d28d9;}

/* Relead modal */
.relead-modal{background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-xl,16px);box-shadow:var(--shadow-lg);width:100%;max-width:400px;overflow:hidden;}
.relead-shortcuts{display:flex;gap:.375rem;flex-wrap:wrap;margin-top:.75rem;}

/* Relead card */
.fu-relead{border-color:rgba(139,92,246,.25);}
.fu-relead:hover{border-color:rgba(139,92,246,.5);}
.dot-purple{background:#8b5cf6;}

/* Botão alertas ativo */
.btn-notif-on {
  background: var(--accent-subtle);
  color: var(--accent);
  border: 1px solid var(--accent);
  cursor: default;
  opacity: 1;
}
.btn-notif-on:disabled { opacity: 1; cursor: default; }

/* Serviços chips + dropdown */
.serv-chips{display:flex;flex-wrap:wrap;gap:.375rem;margin-bottom:.5rem;}
.serv-chip{display:inline-flex;align-items:center;gap:.3rem;background:var(--accent-subtle);border:1px solid rgba(34,197,94,.25);color:var(--accent);font-size:.75rem;font-weight:600;padding:.2rem .55rem .2rem .6rem;border-radius:99px;}
.serv-chip-rm{display:flex;align-items:center;background:none;border:none;cursor:pointer;color:var(--accent);opacity:.6;padding:0;line-height:1;}
.serv-chip-rm:hover{opacity:1;}
.serv-input-wrap{position:relative;}
.serv-input-row{display:flex;gap:.375rem;}
.serv-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);box-shadow:var(--shadow-md);z-index:50;max-height:180px;overflow-y:auto;}
.serv-dropdown-item{display:block;width:100%;text-align:left;background:none;border:none;padding:.5rem .75rem;font-size:.82rem;color:var(--text-primary);font-family:var(--font-body);cursor:pointer;transition:background .1s;}
.serv-dropdown-item:hover{background:var(--bg-overlay);}

/* Transações vinculadas no CRM drawer */
.crmtx-row{display:flex;flex-direction:column;gap:.2rem;padding:.5rem .625rem;background:var(--bg-overlay);border:1px solid var(--border-subtle);border-radius:var(--radius-md);margin-bottom:.375rem;}
.crmtx-row:last-child{margin-bottom:0;}
.crmtx-top{display:flex;align-items:center;gap:.5rem;}
.crmtx-desc{flex:1;font-size:.8rem;color:var(--text-primary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.crmtx-val{font-size:.82rem;font-weight:700;flex-shrink:0;}
.crmtx-val--in{color:var(--accent);}
.crmtx-val--out{color:var(--status-danger);}
.crmtx-bottom{display:flex;align-items:center;gap:.5rem;}
.crmtx-date{font-size:.7rem;color:var(--text-tertiary);flex:1;}
.tx-st-badge{font-size:.62rem;font-weight:700;padding:.1rem .4rem;border-radius:99px;white-space:nowrap;flex-shrink:0;}
.tx-st--pago{background:var(--accent-subtle);color:var(--accent);}
.tx-st--pend{background:rgba(245,158,11,.12);color:var(--status-warning);}

/* Drawer tab indicator dot */
.drawer-tab-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-left:2px;}

/* SDR / FuAuto toggle pill */
.sz-sdr-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 0;}
.sz-sdr-toggle-title{font-size:.82rem;font-weight:600;color:var(--text-primary);margin:0 0 2px;}
.sz-sdr-toggle-sub{font-size:.75rem;color:var(--text-tertiary);margin:0;}
.sz-sdr-pill{width:40px;height:22px;border-radius:11px;background:var(--bg-overlay);border:1px solid var(--border-default);cursor:pointer;position:relative;transition:background .2s,border-color .2s;flex-shrink:0;}
.sz-sdr-pill--on{background:var(--accent);border-color:var(--accent);}
.sz-sdr-pill:disabled{opacity:.4;cursor:not-allowed;}
.sz-sdr-pill-thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .2s;}
.sz-sdr-pill--on .sz-sdr-pill-thumb{transform:translateX(18px);}
.sz-sdr-active-info{background:var(--accent-subtle);border:1px solid rgba(34,197,94,.2);border-radius:var(--radius-md);padding:8px 12px;display:flex;flex-direction:column;gap:4px;}
.sz-sdr-active-row{display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--accent);}
.sz-sdr-active-row--warn{color:var(--status-warning);}
.sz-sdr-section-warn{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--status-warning);background:rgba(232,168,56,.1);border:1px solid rgba(232,168,56,.25);border-radius:var(--radius-md);padding:8px 12px;margin-bottom:12px;}
.sz-sdr-link{color:var(--accent);}

/* Parcelas */
.sz-parcela-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.sz-parcela-num{font-size:12px;color:var(--text-tertiary);min-width:24px;}
.sz-parcela-input{flex:1;min-width:0;}
.sz-parcela-pago{display:flex;align-items:center;gap:4px;font-size:.75rem;color:var(--text-secondary);cursor:pointer;white-space:nowrap;}

/* Análise IA */
.sz-analise-item{display:flex;align-items:flex-start;gap:8px;font-size:.82rem;color:var(--text-primary);margin-bottom:6px;}

/* Typing indicator */
.sz-typing{display:flex;gap:4px;align-items:center;}
.sz-typing span{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:sz-bounce 1s infinite;}
.sz-typing span:nth-child(2){animation-delay:.15s;}
.sz-typing span:nth-child(3){animation-delay:.3s;}
@keyframes sz-bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}

@media(max-width:1200px){.kanban-board{grid-template-columns:repeat(3,1fr);}}
@media(max-width:768px){.kanban-board{grid-template-columns:repeat(2,1fr);}.drawer{width:100%;}.fu-card{flex-wrap:wrap;}.card-modal-grid{grid-template-columns:1fr;}}
</style>
