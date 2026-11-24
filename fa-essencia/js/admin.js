import * as S from './store.js';
import { esc, $, $$, icon, uid, dayN, isoDay, fmtLong, fmtFull, fmtShort, ago, pad2, first, initials, addDays } from './util.js';

S.load();
const root = $('#root');
let filter = { q: '', status: '', doctor: '' }, guideProc = S.PROCEDURES[0];
const toast = (m) => { $('.toast')?.remove(); const t = document.createElement('div'); t.className = 'toast'; t.style.bottom = '30px'; t.innerHTML = icon('check', 'sm') + esc(m); document.body.append(t); setTimeout(() => t.remove(), 2800); };
function modal(html) { const s = document.createElement('div'); s.className = 'scrim center'; s.innerHTML = `<div class="sheet">${html}</div>`; s.onclick = e => { if (e.target === s) s.remove(); }; document.body.append(s); return s; }
const closeModal = () => $$('.scrim').forEach(s => s.remove());
const P = id => S.patientById(id);
const proc = p => S.currentProc(p);
const statusChip = s => `<span class="chip ${s === 'concluido' ? '' : s === 'retorno_pendente' ? 'warn' : 'ok'}">${S.STATUS[s]}</span>`;
const alertChip = a => `<span class="chip ${a.sev >= 3 ? 'risk' : a.sev === 2 ? 'warn' : ''}">${esc(a.label)}</span>`;
const by = 'Equipe Clínica FA';

/* ---------- derivados ---------- */
function stats() {
  const s = S.get(), act = s.patients.filter(S.isActive);
  const withAlerts = s.patients.map(p => ({ p, al: S.alertsFor(p) })).filter(x => x.al.length);
  const has = (p, t) => S.alertsFor(p).some(a => a.type === t);
  const noCheckin = act.filter(p => dayN(proc(p).date) >= 1 && !s.checkins.some(c => c.patientId === p.id && (Date.now() - new Date(c.at)) / 864e5 < 3));
  return {
    total: s.patients.length, active: act.length, retorno: act.filter(p => p.status === 'retorno_pendente').length, noCheckin: noCheckin.length,
    contato: act.filter(p => has(p, 'contato') || S.alertsFor(p).some(a => a.label.includes('conversar'))).length, neg: act.filter(p => has(p, 'negativo')).length,
    rem: S.pendingReminders().length, attention: withAlerts.sort((a, b) => b.al[0].sev - a.al[0].sev || b.al.length - a.al.length)
  };
}

/* ---------- views ---------- */
function login() {
  return `<div class="login"><div class="card rise"><div style="font-family:var(--serif);font-size:48px;letter-spacing:.1em;line-height:1">FA</div><div class="eyebrow" style="margin:6px 0 24px;letter-spacing:.4em">Essência · Equipe</div>
  <h2 style="font-size:30px;margin-bottom:6px">Painel de acompanhamento</h2><p class="muted" style="margin-bottom:22px;font-size:14px">Acesso restrito à equipe da Clínica FA.</p>
  <form id="f-login"><div class="field" style="text-align:left"><label for="pw">Senha da equipe</label><input class="input" id="pw" type="password" autocomplete="current-password" placeholder="••••••••"></div><p id="pe" style="color:var(--risk);font-size:13px;margin-bottom:10px" hidden>Senha incorreta.</p><button class="btn primary block">Entrar</button></form>
  <p class="soft" style="font-size:12px;margin-top:16px">Demonstração: senha <b>fa2026</b>. Em produção, Supabase Auth com perfil “staff”.</p></div></div>`;
}
function layout(path, inner) {
  const st = stats();
  const nv = [['/', 'Visão geral', 'grid'], ['/atencao', 'Precisa de atenção', 'alert', st.attention.length], ['/pacientes', 'Pacientes', 'users'], ['/lembretes', 'Lembretes', 'bell', st.rem], ['/orientacoes', 'Orientações', 'leaf'], ['/config', 'Configurações', 'gear']];
  return `<div id="app"><aside><div class="brand"><b>FA</b><span>Essência · Equipe</span></div>
    ${nv.map(n => `<a class="nv ${path === n[0] || (n[0] !== '/' && path.startsWith(n[0])) || (n[0] === '/pacientes' && path.startsWith('/paciente/')) ? 'on' : ''}" href="#${n[0]}">${icon(n[2])}<span>${n[1]}</span>${n[3] ? `<i class="n">${n[3]}</i>` : ''}</a>`).join('')}
    <div class="foot"><a href="index.html" target="_blank" class="link">Abrir app da paciente</a><br><br><button class="link" data-a="logout">Sair</button></div></aside>
    <main>${inner}</main></div>`;
}
function dash() {
  const st = stats(), s = S.get();
  const k = (l, v, sub, href, alert) => `<a class="card kpi ${alert && v ? 'alert' : ''}" href="${href}"><span class="eyebrow">${l}</span><div class="v">${v}</div><small>${sub}</small></a>`;
  const recent = [...s.checkins.map(x => ({ ...x, t: 'check-in' })), ...s.feedbacks.map(x => ({ ...x, t: 'feedback' })), ...s.photos.map(x => ({ ...x, t: 'foto' })), ...s.contacts.filter(c => c.direction === 'patient').map(x => ({ ...x, t: 'contato' }))].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 7);
  return `<div class="mh"><div><span class="eyebrow">Visão geral</span><h1>Bom dia, equipe.</h1><p>Ninguém fica esquecida. Veja quem precisa de você agora.</p></div></div>
  <div class="kpis">${k('Pacientes', st.total, 'cadastradas', '#/pacientes')}${k('Em acompanhamento', st.active, 'jornadas ativas', '#/pacientes')}${k('Precisam de atenção', st.attention.length, 'alertas abertos', '#/atencao', 1)}${k('Retorno pendente', st.retorno, 'a combinar', '#/pacientes?status=retorno_pendente', 1)}${k('Sem check-in', st.noCheckin, 'há 3+ dias', '#/atencao')}${k('Pediram contato', st.contato, 'aguardando retorno', '#/atencao', 1)}${k('Feedback negativo', st.neg, 'a acolher', '#/atencao', 1)}${k('Lembretes pendentes', st.rem, 'agendados', '#/lembretes')}</div>
  <div class="grid2"><div class="card"><span class="sec-t">Precisa de atenção agora</span>${st.attention.length ? st.attention.slice(0, 5).map(x => `<div class="ev" style="cursor:pointer" data-go="${x.p.id}"><div class="ic">${icon('alert', 'sm')}</div><div style="flex:1"><b>${esc(x.p.name)}</b><small>${esc(proc(x.p).name)} · dia ${pad2(dayN(proc(x.p).date))}</small><div class="alerts" style="margin-top:6px">${x.al.map(alertChip).join('')}</div></div></div>`).join('') + (st.attention.length > 5 ? '<a class="link" href="#/atencao">Ver todas</a>' : '') : '<p class="muted">Tudo em dia. Nenhuma paciente aguardando.</p>'}</div>
  <div class="card"><span class="sec-t">Atividade recente</span>${recent.map(r => { const p = P(r.patientId); return p ? `<div class="ev"><div class="ic">${icon(r.t === 'foto' ? 'image' : r.t === 'feedback' ? 'star' : r.t === 'contato' ? 'chat' : 'check', 'sm')}</div><div><b>${esc(first(p.name))}</b> · ${r.t}<small>${ago(r.at)}</small></div></div>` : ''; }).join('')}</div></div>`;
}
function atencao() {
  const st = stats();
  return `<div class="mh"><div><span class="eyebrow">Alertas prioritários</span><h1>Precisa de atenção</h1><p>${st.attention.length} ${st.attention.length === 1 ? 'paciente' : 'pacientes'} com algo em aberto.</p></div></div>
  ${st.attention.length ? st.attention.map(({ p, al }) => `<div class="card acard s${al[0].sev}"><span class="avatar sm">${p.avatar ? `<img alt="" src="${p.avatar}">` : initials(p.name)}</span><div style="flex:1"><h3>${esc(p.name)}</h3><small class="soft">${esc(proc(p).name)} · dia ${pad2(dayN(proc(p).date))} · ${esc(p.doctor)} · última interação ${ago(S.lastInteraction(p))}</small>
    <div class="why">${al.map(a => `<div>${alertChip(a)} ${a.detail ? `<span style="margin-left:6px">“${esc(a.detail)}”</span>` : ''}</div>`).join('')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn primary sm" href="#/paciente/${p.id}">Abrir contexto</a><button class="btn sand sm" data-a="quickContact" data-id="${p.id}">${icon('check', 'sm')} Contato realizado</button></div></div></div>`).join('')
    : `<div class="empty"><div class="ill">${icon('check', 'lg')}</div><h3>Nenhuma paciente esquecida.</h3><p class="muted">Todos os alertas foram tratados.</p></div>`}`;
}
function pacientes(q) {
  const s = S.get(); if (q.status && filter.status !== q.status) filter.status = q.status;
  let ps = s.patients.filter(p => (!filter.q || p.name.toLowerCase().includes(filter.q.toLowerCase())) && (!filter.status || p.status === filter.status) && (!filter.doctor || p.doctor === filter.doctor));
  return `<div class="mh"><div><span class="eyebrow">Pacientes</span><h1>Todas as jornadas</h1></div><button class="btn primary sm" data-a="newPatient">${icon('plus', 'sm')} Nova paciente</button></div>
  <div class="tools"><input class="input" id="q" placeholder="Buscar por nome…" value="${esc(filter.q)}"><select class="select" id="fs"><option value="">Todos os status</option>${Object.entries(S.STATUS).map(([k, v]) => `<option value="${k}" ${filter.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select><select class="select" id="fd"><option value="">Todas as médicas</option>${S.DOCTORS.map(d => `<option ${filter.doctor === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
  <div class="card" style="padding:8px;overflow-x:auto"><table class="tbl"><thead><tr><th>Paciente</th><th class="hide-m">Procedimento</th><th>Status</th><th class="hide-m">Última interação</th><th class="hide-m">Próxima etapa</th><th>Alertas</th></tr></thead><tbody>
  ${ps.map(p => { const al = S.alertsFor(p); return `<tr class="rw" data-go="${p.id}"><td class="nm">${esc(p.name)}<small>${esc(p.doctor)}</small></td><td class="hide-m">${esc(proc(p).name)}<small>${fmtShort(proc(p).date)} · dia ${pad2(dayN(proc(p).date))}</small></td><td>${statusChip(p.status)}</td><td class="hide-m">${ago(S.lastInteraction(p))}</td><td class="hide-m">${esc(p.nextStep || '—')}<small>${p.nextStepDate ? fmtShort(p.nextStepDate) : ''}</small></td><td><div class="alerts">${al.length ? al.slice(0, 2).map(alertChip).join('') : '<span class="soft">—</span>'}</div></td></tr>`; }).join('') || '<tr><td colspan="6" class="muted">Nenhuma paciente encontrada.</td></tr>'}</tbody></table></div>`;
}
function paciente(id) {
  const p = P(id); if (!p) return '<p>Paciente não encontrada.</p>';
  const s = S.get(), pr = proc(p), al = S.alertsFor(p), n = dayN(pr.date);
  const ev = [
    ...S.forPatient('checkins', id).map(x => ({ at: x.at, ic: 'check', t: 'Check-in: ' + ({ bem: 'estou me sentindo bem', duvidas: 'tenho dúvidas', conversar: 'quer conversar com a equipe', registrar: 'registro' }[x.kind]), d: x.note, h: !x.handled && x.kind !== 'bem' })),
    ...S.forPatient('feedbacks', id).map(x => ({ at: x.at, ic: 'star', t: `Feedback ${'★'.repeat(x.rating)}${'☆'.repeat(5 - x.rating)}`, d: x.comment, h: !x.handled && x.rating <= 2 })),
    ...S.forPatient('journal', id).filter(x => x.share).map(x => ({ at: x.at, ic: 'book', t: `Diário (${x.tag}) — compartilhado`, d: x.text, h: !x.handled && x.tag === 'Dúvida' })),
    ...S.forPatient('contacts', id).map(x => ({ at: x.at, ic: 'chat', t: (x.direction === 'clinic' ? `Equipe → paciente (${x.channel})` : `Paciente → equipe (${x.channel})`), d: x.note, h: !x.handled && x.direction === 'patient' })),
    ...S.forPatient('photos', id).map(x => ({ at: x.at, ic: 'image', t: `Foto de evolução (dia ${pad2(x.day)})`, d: x.note })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const photos = S.forPatient('photos', id).sort((a, b) => a.at.localeCompare(b.at));
  const notes = S.forPatient('notes', id).sort((a, b) => b.at.localeCompare(a.at));
  const aps = S.forPatient('appointments', id).sort((a, b) => a.date.localeCompare(b.date));
  const nots = S.forPatient('notifications', id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
  return `<a class="back" href="#/pacientes" style="display:inline-flex;gap:6px;text-decoration:none;color:var(--ink-2);font-weight:600;font-size:13.5px;margin-bottom:14px">${icon('chevL', 'sm')}Pacientes</a>
  <div class="mh"><div style="display:flex;gap:18px;align-items:center"><span class="avatar">${p.avatar ? `<img alt="" src="${p.avatar}">` : initials(p.name)}</span><div><h1>${esc(p.name)}</h1><p>${esc(pr.name)} · ${fmtFull(pr.date)} · dia ${pad2(n)} · ${esc(p.doctor)}</p><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">${statusChip(p.status)}${p.demo ? '<span class="chip">Dados fictícios</span>' : ''}</div></div></div></div>
  ${al.length ? `<div class="card acard s${al[0].sev}" style="margin-bottom:20px"><div style="flex:1"><span class="sec-t" style="color:var(--risk)">Precisa de atenção</span><div class="why">${al.map(a => `<div>${alertChip(a)} ${a.detail ? `<span style="margin-left:6px">“${esc(a.detail)}”</span>` : ''} <small class="soft">${ago(a.at)}</small></div>`).join('')}</div></div></div>` : ''}
  <div class="pd"><div class="stack">
    <div class="card"><span class="sec-t">Linha do tempo do acompanhamento</span>${ev.map(e => `<div class="ev"><div class="ic">${icon(e.ic, 'sm')}</div><div style="flex:1"><b style="font-weight:600">${esc(e.t)}</b> ${e.h ? '<span class="chip risk" style="margin-left:6px">em aberto</span>' : ''}${e.d ? `<div class="muted" style="font-size:13.5px">“${esc(e.d)}”</div>` : ''}<small>${ago(e.at)}</small></div></div>`).join('') || '<p class="muted">Sem interações ainda.</p>'}</div>
    <div class="card"><span class="sec-t">Fotos de evolução</span>${p.consent.photosStaff ? (photos.length ? `<div class="pgrid">${photos.map(x => `<div><img alt="" src="${x.src}" data-a="zoom" data-id="${x.id}"><small class="soft" style="font-size:11.5px">Dia ${pad2(x.day)} · ${fmtShort(x.date)}</small></div>`).join('')}</div>` : '<p class="muted">Nenhuma foto registrada.</p>') : `<p class="muted">${icon('lock', 'sm')} A paciente não autorizou a equipe a ver as fotos. Privacidade respeitada (LGPD).</p>`}</div>
    <div class="card"><span class="sec-t">Observações internas <span class="soft" style="text-transform:none;letter-spacing:0">(a paciente não vê)</span></span>
      <div style="display:flex;gap:8px;margin-bottom:12px"><input class="input" id="nn" placeholder="Adicionar observação…" style="min-height:46px"><button class="btn primary sm" data-a="addNote" data-id="${id}">Adicionar</button></div>
      ${notes.map(x => `<div class="ev"><div class="ic">${icon('note', 'sm')}</div><div><div>${esc(x.text)}</div><small>${esc(x.by)} · ${ago(x.at)}</small></div></div>`).join('') || '<p class="muted" style="font-size:13.5px">Sem observações.</p>'}</div></div>
  <div class="stack">
    <div class="card"><span class="sec-t">Gestão do acompanhamento</span><div class="act">
      <div class="field" style="margin:0"><label>Status</label><select class="select" data-a="status" data-id="${id}">${Object.entries(S.STATUS).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field" style="margin:0"><label>Próxima etapa</label><input class="input" id="ns" value="${esc(p.nextStep)}" placeholder="Ex.: Agendar retorno"><input class="input" id="nd" type="date" value="${p.nextStepDate || ''}" style="margin-top:8px"><button class="btn sand sm" style="margin-top:8px" data-a="saveStep" data-id="${id}">Salvar etapa</button></div>
      <hr style="border:0;border-top:1px solid var(--line)">
      <button class="btn primary" data-a="contactDone" data-id="${id}">${icon('check', 'sm')} Registrar contato realizado</button>
      <button class="btn ghost" data-a="sendMsg" data-id="${id}">${icon('send', 'sm')} Enviar recado ao app</button>
      <button class="btn ghost" data-a="newRem" data-id="${id}">${icon('bell', 'sm')} Criar lembrete</button>
      <button class="btn ghost" data-a="newAppt" data-id="${id}">${icon('cal', 'sm')} Agendar retorno/consulta</button>
      <button class="btn ghost" data-a="complete" data-id="${id}" ${p.status === 'concluido' ? 'disabled' : ''}>Marcar acompanhamento como concluído</button></div></div>
    <div class="card"><span class="sec-t">Consultas</span>${aps.map(a => `<div class="ev"><div class="ic">${icon('cal', 'sm')}</div><div>${esc(a.title)}<small>${fmtFull(a.date)} ${a.time || ''}</small></div></div>`).join('') || '<p class="muted" style="font-size:13.5px">Nenhuma.</p>'}</div>
    <div class="card"><span class="sec-t">Lembretes e recados</span>${nots.map(x => `<div class="ev"><div class="ic">${icon('bell', 'sm')}</div><div>${esc(x.title)}<small>${new Date(x.at) > new Date() ? 'Agendado para ' + fmtShort(x.at) : ago(x.at)}</small></div></div>`).join('') || '<p class="muted" style="font-size:13.5px">Nenhum.</p>'}</div>
    <div class="card"><span class="sec-t">Cadastro</span><div style="font-size:14px" class="muted">${esc(p.email || '—')}<br>${esc(p.phone || '—')}<br>Consentimento LGPD: ${fmtFull(p.consent.at)}<br>Fotos visíveis à equipe: ${p.consent.photosStaff ? 'sim' : 'não'}</div></div></div></div>`;
}
function lembretes() {
  const s = S.get(), list = [...s.notifications].sort((a, b) => new Date(b.at) - new Date(a.at));
  return `<div class="mh"><div><span class="eyebrow">Lembretes</span><h1>Notificações às pacientes</h1><p>Agendados chegam ao app na data definida; respeitam as preferências de cada paciente.</p></div><button class="btn primary sm" data-a="newRem">${icon('plus', 'sm')} Novo lembrete</button></div>
  <div class="card" style="padding:8px;overflow-x:auto"><table class="tbl"><thead><tr><th>Paciente</th><th>Lembrete</th><th>Quando</th><th>Estado</th><th></th></tr></thead><tbody>${list.map(n => { const p = P(n.patientId), fut = new Date(n.at) > new Date(); return p ? `<tr><td class="nm">${esc(p.name)}</td><td>${esc(n.title)}<small>${esc(S.NOTIF_TYPES[n.type] || n.type)}</small></td><td>${fut ? fmtShort(n.at) : ago(n.at)}</td><td>${fut ? '<span class="chip warn">Pendente</span>' : n.read ? '<span class="chip">Lido</span>' : '<span class="chip ok">Entregue</span>'}</td><td>${fut ? `<button class="link" data-a="sendNow" data-nid="${n.id}">Enviar agora</button> · <button class="link" data-a="delRem" data-nid="${n.id}">Cancelar</button>` : ''}</td></tr>` : ''; }).join('')}</tbody></table></div>`;
}
function orientacoes() {
  const s = S.get(), list = s.guidance.filter(g => g.procedure === guideProc);
  return `<div class="mh"><div><span class="eyebrow">Conteúdo clínico</span><h1>Orientações por procedimento</h1><p>Somente conteúdo <b>aprovado</b> aparece para a paciente. A equipe médica é responsável pelo texto.</p></div><button class="btn primary sm" data-a="newGuide">${icon('plus', 'sm')} Nova orientação</button></div>
  <div class="tools"><select class="select" id="gp">${S.PROCEDURES.map(x => `<option ${x === guideProc ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  ${list.map(g => `<div class="card" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div style="flex:1;min-width:240px"><span class="eyebrow">${esc(g.category)}</span><h3 style="font-size:24px;margin:4px 0 6px">${esc(g.title)}</h3><p class="muted" style="font-size:14px">${esc(g.body)}</p>${g.demo ? '<p class="soft" style="font-size:12px;margin-top:8px">Texto de demonstração — revise e substitua pelo conteúdo oficial da equipe médica.</p>' : ''}</div>
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${g.approved ? `<span class="chip ok">${icon('shield', 'sm')} Aprovado${g.approvedBy ? ' · ' + esc(g.approvedBy) : ''}</span>` : '<span class="chip warn">Rascunho</span>'}<button class="btn ghost sm" data-a="toggleApprove" data-gid="${g.id}">${g.approved ? 'Retirar aprovação' : 'Aprovar'}</button><button class="btn ghost sm" data-a="editGuide" data-gid="${g.id}">Editar</button><button class="btn danger sm" data-a="delGuide" data-gid="${g.id}">Excluir</button></div></div></div>`).join('') || '<div class="empty"><h3>Sem orientações.</h3></div>'}`;
}
function config() {
  const c = S.get().clinic, cps = S.get().checkpoints;
  return `<div class="mh"><div><span class="eyebrow">Configurações</span><h1>Clínica e acompanhamento</h1></div></div><div class="grid2"><div class="card"><span class="sec-t">Clínica</span>
  <div class="field"><label>WhatsApp da clínica (com DDI)</label><input class="input" id="cw" value="${esc(c.whatsapp)}"></div>
  <div class="field"><label>Alertar quando a paciente ficar sem interação por (dias)</label><input class="input" id="cd" type="number" min="1" max="30" value="${c.maxDaysNoContact}"></div>
  <button class="btn primary" data-a="saveCfg">Salvar</button></div>
  <div class="card"><span class="sec-t">Marcos da jornada</span><p class="muted" style="font-size:13.5px;margin-bottom:14px">Definidos pela clínica; não representam cronograma médico universal.</p>
  <div id="cps">${cps.map(x => `<div style="display:flex;gap:8px;margin-bottom:8px"><input class="input cpd" type="number" min="0" value="${x.day}" style="width:90px;min-height:46px"><input class="input cpl" value="${esc(x.label)}" style="min-height:46px"><button class="iconbtn" data-a="rmCp" aria-label="Remover">${icon('x', 'sm')}</button></div>`).join('')}</div>
  <div style="display:flex;gap:8px;margin-top:10px"><button class="btn ghost sm" data-a="addCp">${icon('plus', 'sm')} Marco</button><button class="btn primary sm" data-a="saveCps">Salvar marcos</button></div></div></div>
  <div class="card" style="margin-top:20px"><span class="sec-t">Dados de demonstração</span><p class="muted" style="font-size:14px;margin-bottom:12px">Restaura as pacientes e registros fictícios originais.</p><button class="btn danger sm" data-a="reset">Restaurar demonstração</button></div>`;
}

/* ---------- roteador ---------- */
function render() {
  if (!S.staffSession()) { root.innerHTML = login(); return; }
  const [path, qs] = (location.hash.slice(1) || '/').split('?'); const q = Object.fromEntries(new URLSearchParams(qs || ''));
  let inner;
  if (path.startsWith('/paciente/')) inner = paciente(path.split('/')[2]);
  else inner = ({ '/': dash, '/atencao': atencao, '/pacientes': () => pacientes(q), '/lembretes': lembretes, '/orientacoes': orientacoes, '/config': config }[path] || dash)();
  const keep = document.activeElement?.id, val = document.activeElement?.value;
  root.innerHTML = layout(path, inner);
  if (keep && $('#' + keep)) { const e = $('#' + keep); e.focus(); if (val != null && e.setSelectionRange && e.type === 'text') try { e.setSelectionRange(val.length, val.length); } catch {} }
}
window.addEventListener('hashchange', () => { closeModal(); render(); });
S.subscribe(() => { if (!$('.scrim') && !['nn', 'ns', 'cw'].includes(document.activeElement?.id)) render(); });

/* ---------- ações ---------- */
const patientOpts = sel => S.get().patients.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
const A = {
  logout: () => { S.setStaffSession(false); render(); },
  quickContact: el => contactModal(el.dataset.id),
  contactDone: el => contactModal(el.dataset.id),
  status: el => { const p = P(el.dataset.id); p.status = el.value; S.commit(); toast('Status atualizado.'); },
  saveStep: el => { const p = P(el.dataset.id); p.nextStep = $('#ns').value.trim(); p.nextStepDate = $('#nd').value; S.commit(); toast('Próxima etapa salva.'); },
  addNote: el => { const t = $('#nn').value.trim(); if (!t) return; S.get().notes.push({ id: uid('nn'), patientId: el.dataset.id, text: t, by, at: new Date().toISOString() }); S.commit(); toast('Observação adicionada.'); },
  complete: el => { const p = P(el.dataset.id); p.status = 'concluido'; p.nextStep = ''; p.nextStepDate = ''; S.handleAll(p.id); S.get().contacts.push({ id: uid('ct'), patientId: p.id, direction: 'clinic', channel: 'app', kind: 'acompanhamento', note: 'Acompanhamento concluído.', at: new Date().toISOString(), handled: true, by }); S.commit(); toast('Acompanhamento concluído. O histórico permanece para a paciente.'); },
  sendMsg: el => { const id = el.dataset.id; modal(`<h3 style="font-size:28px;margin-bottom:6px">Recado para ${esc(first(P(id).name))}</h3><p class="muted" style="margin-bottom:14px;font-size:14px">Aparece em “Um recado da Clínica FA” na tela inicial da paciente.</p><div class="field"><textarea class="textarea" id="mt" placeholder="Escreva com carinho…"></textarea></div><div class="field"><label>Assinatura</label><select class="select" id="mb">${S.DOCTORS.map(d => `<option>${d}</option>`).join('')}<option>Equipe Clínica FA</option></select></div><button class="btn primary block" data-a="doMsg" data-id="${id}">Enviar</button>`); },
  doMsg: el => { const t = $('#mt').value.trim(); if (!t) return; const id = el.dataset.id; S.get().messages.push({ id: uid('ms'), patientId: id, text: t, by: $('#mb').value, at: new Date().toISOString() }); S.addNotification(id, 'carinho', 'Um recado da Clínica FA', t.slice(0, 120), new Date().toISOString()); S.logContact(id, 'clinic', 'app', 'acompanhamento', 'Recado enviado pelo app.', by); S.commit(); closeModal(); toast('Recado enviado.'); },
  newRem: el => { const id = el?.dataset?.id; modal(`<h3 style="font-size:28px;margin-bottom:14px">Novo lembrete</h3><div class="field"><label>Paciente</label><select class="select" id="rp">${patientOpts(id)}</select></div><div class="field"><label>Tipo</label><select class="select" id="rt">${Object.entries(S.NOTIF_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div><div class="field"><label>Título</label><input class="input" id="rh" value="Um pequeno momento para você"></div><div class="field"><label>Mensagem</label><textarea class="textarea" id="rb" style="min-height:80px">Como está se sentindo hoje? Estamos por aqui.</textarea></div><div class="field"><label>Enviar em</label><input class="input" type="date" id="rd" value="${isoDay()}"></div><button class="btn primary block" data-a="doRem">Criar lembrete</button>`); },
  doRem: () => { const d = $('#rd').value || isoDay(); const at = d === isoDay() ? new Date().toISOString() : new Date(d + 'T09:00:00').toISOString(); S.addNotification($('#rp').value, $('#rt').value, $('#rh').value.trim() || 'Lembrete', $('#rb').value.trim(), at); S.commit(); closeModal(); toast(d === isoDay() ? 'Lembrete enviado.' : 'Lembrete agendado.'); },
  sendNow: el => { const n = S.get().notifications.find(x => x.id === el.dataset.nid); n.at = new Date().toISOString(); S.commit(); toast('Enviado agora.'); },
  delRem: el => { const s = S.get(); s.notifications = s.notifications.filter(x => x.id !== el.dataset.nid); S.commit(); toast('Lembrete cancelado.'); },
  newAppt: el => { const id = el.dataset.id; modal(`<h3 style="font-size:28px;margin-bottom:14px">Agendar para ${esc(first(P(id).name))}</h3><div class="field"><label>Título</label><input class="input" id="at" value="Retorno com ${esc(P(id).doctor)}"></div><div class="field"><label>Data</label><input class="input" type="date" id="ad" value="${isoDay(addDays(new Date(), 7))}"></div><div class="field"><label>Horário</label><input class="input" type="time" id="ah" value="15:00"></div><button class="btn primary block" data-a="doAppt" data-id="${id}">Agendar</button>`); },
  doAppt: el => { const id = el.dataset.id, d = $('#ad').value; if (!d) return; S.get().appointments.push({ id: uid('ap'), patientId: id, title: $('#at').value.trim() || 'Retorno', date: d, time: $('#ah').value, kind: 'retorno' }); const p = P(id); if (p.status === 'retorno_pendente') p.status = 'em_acompanhamento'; S.addNotification(id, 'consulta', 'Seu retorno foi agendado', `${fmtLong(d)} às ${$('#ah').value}. Estamos te esperando.`, new Date().toISOString()); S.commit(); closeModal(); toast('Retorno agendado e paciente avisada.'); },
  zoom: el => { const x = S.get().photos.find(p => p.id === el.dataset.id); modal(`<img alt="" src="${x.src}" style="width:100%;border-radius:18px;max-height:70vh;object-fit:contain"><p class="muted" style="margin-top:10px">Dia ${pad2(x.day)} · ${fmtFull(x.date)}${x.note ? ' · “' + esc(x.note) + '”' : ''}</p>`); },
  newPatient: () => modal(`<h3 style="font-size:28px;margin-bottom:14px">Nova paciente</h3><div class="field"><label>Nome</label><input class="input" id="pn"></div><div class="field"><label>Procedimento</label><select class="select" id="pp">${S.PROCEDURES.map(x => `<option>${x}</option>`).join('')}</select></div><div class="field"><label>Data</label><input class="input" type="date" id="pd" value="${isoDay()}" max="${isoDay()}"></div><div class="field"><label>Médica</label><select class="select" id="pm">${S.DOCTORS.map(x => `<option>${x}</option>`).join('')}</select></div><p class="soft" style="font-size:12.5px;margin-bottom:14px">A paciente confirma o consentimento (LGPD) no primeiro acesso.</p><button class="btn primary block" data-a="doPatient">Criar acesso</button>`),
  doPatient: () => { const n = $('#pn').value.trim(); if (!n) return; const p = S.createPatient({ name: n, procDate: $('#pd').value, procedure: $('#pp').value, doctor: $('#pm').value, consent: {} }); p.consent.health = false; S.commit(); closeModal(); location.hash = '#/paciente/' + p.id; },
  toggleApprove: el => { const g = S.get().guidance.find(x => x.id === el.dataset.gid); g.approved = !g.approved; g.approvedBy = g.approved ? 'Dra. Francine Almeida' : ''; g.approvedAt = g.approved ? new Date().toISOString() : ''; g.demo = false; S.commit(); toast(g.approved ? 'Orientação aprovada e publicada.' : 'Aprovação retirada. Oculta para pacientes.'); },
  delGuide: el => { const s = S.get(); s.guidance = s.guidance.filter(x => x.id !== el.dataset.gid); S.commit(); toast('Orientação excluída.'); },
  newGuide: () => guideModal(), editGuide: el => guideModal(el.dataset.gid),
  saveGuide: el => { const t = $('#gt').value.trim(), b = $('#gb').value.trim(); if (!t || !b) return; const s = S.get(); let g = s.guidance.find(x => x.id === el.dataset.gid); if (!g) { g = { id: uid('gd'), procedure: guideProc }; s.guidance.push(g); } Object.assign(g, { category: $('#gc').value, title: t, body: b, approved: false, approvedBy: '', demo: false }); S.commit(); closeModal(); toast('Salvo como rascunho. Aprove para publicar.'); },
  saveCfg: () => { const c = S.get().clinic; c.whatsapp = $('#cw').value.replace(/\D/g, ''); c.maxDaysNoContact = Math.max(1, +$('#cd').value || 4); S.commit(); toast('Configurações salvas.'); },
  addCp: () => { $('#cps').insertAdjacentHTML('beforeend', `<div style="display:flex;gap:8px;margin-bottom:8px"><input class="input cpd" type="number" min="0" value="" style="width:90px;min-height:46px"><input class="input cpl" style="min-height:46px" placeholder="Nome do marco"><button class="iconbtn" data-a="rmCp">${icon('x', 'sm')}</button></div>`); },
  rmCp: el => el.parentElement.remove(),
  saveCps: () => { const d = $$('.cpd').map(e => e.value), l = $$('.cpl').map(e => e.value); const arr = d.map((v, i) => ({ day: +v, label: l[i].trim() || 'Registro' })).filter((x, i) => d[i] !== '' && x.day >= 0).sort((a, b) => a.day - b.day); if (arr.length < 2) return toast('Defina ao menos dois marcos.'); S.get().checkpoints = arr; S.commit(); toast('Marcos atualizados.'); },
  reset: () => { S.resetDemo(); toast('Demonstração restaurada.'); },
  doContact: el => { const id = el.dataset.id; S.handleAll(id); S.logContact(id, 'clinic', $('#cc').value, 'acompanhamento', $('#cn').value.trim() || 'Contato realizado.', by); const p = P(id); if (p.status === 'novo') p.status = 'em_acompanhamento'; S.commit(); closeModal(); toast('Contato registrado. Alertas tratados.'); },
};
function contactModal(id) { modal(`<h3 style="font-size:28px;margin-bottom:6px">Registrar contato com ${esc(first(P(id).name))}</h3><p class="muted" style="font-size:14px;margin-bottom:14px">Isso marca os alertas em aberto desta paciente como tratados.</p><div class="field"><label>Canal</label><select class="select" id="cc"><option value="whatsapp">WhatsApp</option><option value="telefone">Telefone</option><option value="presencial">Presencial</option></select></div><div class="field"><label>O que foi combinado?</label><textarea class="textarea" id="cn" style="min-height:90px" placeholder="Resumo do contato…"></textarea></div><button class="btn primary block" data-a="doContact" data-id="${id}">Registrar</button>`); }
function guideModal(gid) { const g = S.get().guidance.find(x => x.id === gid) || {}; modal(`<h3 style="font-size:28px;margin-bottom:14px">${gid ? 'Editar' : 'Nova'} orientação</h3><p class="soft" style="font-size:12.5px;margin-bottom:14px">${esc(guideProc)} · após salvar, o conteúdo fica como rascunho até a aprovação médica.</p><div class="field"><label>Categoria</label><select class="select" id="gc">${S.GUIDE_CATS.map(c => `<option ${g.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div><div class="field"><label>Título</label><input class="input" id="gt" value="${esc(g.title || '')}"></div><div class="field"><label>Texto</label><textarea class="textarea" id="gb" style="min-height:150px">${esc(g.body || '')}</textarea></div><button class="btn primary block" data-a="saveGuide" data-gid="${gid || ''}">Salvar rascunho</button>`); }

document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]'); if (go && !e.target.closest('[data-a]')) { location.hash = '#/paciente/' + go.dataset.go; return; }
  const el = e.target.closest('[data-a]'); if (!el || el.tagName === 'SELECT') return; if (A[el.dataset.a]) { e.preventDefault(); A[el.dataset.a](el); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.tagName === 'SELECT' && t.dataset.a) A[t.dataset.a](t);
  if (t.id === 'fs') { filter.status = t.value; render(); } if (t.id === 'fd') { filter.doctor = t.value; render(); } if (t.id === 'gp') { guideProc = t.value; render(); }
});
document.addEventListener('input', e => { if (e.target.id === 'q') { filter.q = e.target.value; render(); } });
document.addEventListener('submit', e => { if (e.target.id !== 'f-login') return; e.preventDefault(); if ($('#pw').value === S.get().clinic.adminPass) { S.setStaffSession(true); render(); } else $('#pe').hidden = false; });
render();
