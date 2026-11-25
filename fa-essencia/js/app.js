import * as S from './store.js';
import { esc, $, $$, icon, uid, dayN, isoDay, parseDate, fmtLong, fmtFull, fmtShort, fmtTime, ago, pad2, first, initials, art, compressImage, waLink, addDays } from './util.js';

S.load();
const root = $('#view'), nav = $('#nav');
const WA_SVG = '<svg class="wa-ic" viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3zm0 1.6a7.4 7.4 0 1 1-3.9 13.7l-.3-.2-2.600.7.700-2.500-.2-.3A7.400 7.400 0 0 1 12 4.600zm-2.700 3.600c-.2 0-.4.100-.6.300-.2.300-.8.800-.8 2s.9 2.300 1 2.500c.1.200 1.700 2.700 4.200 3.700 2 .8 2.500.6 2.900.6.500-.1 1.500-.6 1.700-1.200.2-.6.200-1.100.1-1.200l-.5-.3-1.600-.8c-.2-.1-.4-.1-.5.100l-.7.900c-.1.200-.3.200-.5.100-.9-.4-1.700-.9-2.400-1.600a8 8 0 0 1-1.400-1.800c-.1-.2 0-.3.100-.5l.4-.5.200-.4v-.4l-.8-1.900c-.2-.5-.4-.4-.6-.4z"/></svg>';
const P = () => S.patientById(S.patientSession());
const clinic = () => S.get().clinic;
let draft = { photo: null, note: '' }, gcat = 'Todas', cmp = { a: null, b: null }, mood = null, tag = 'Percepção', stars = 0, ob = {}, tagShare = false;
const seen = new Set();

/* ---------- helpers de UI ---------- */
function toast(msg, ic = 'check') { $('.toast')?.remove(); const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = icon(ic, 'sm') + esc(msg); document.body.append(t); setTimeout(() => t.remove(), 3200); }
function sheet(html, opts = {}) {
  const s = document.createElement('div'); s.className = 'scrim' + (opts.center ? ' center' : '');
  s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${opts.center ? '' : '<div class="grab"></div>'}${html}</div>`;
  const close = () => s.remove();
  s.addEventListener('click', e => { if (e.target === s) close(); });
  s.close = close; document.body.append(s); return s;
}
const closeSheets = () => $$('.scrim').forEach(s => s.remove());
const back = (href, label = 'Voltar') => `<a class="back" href="${href}">${icon('chevL', 'sm')}${label}</a>`;
const shell = (inner, bare) => ({ html: inner, bare });
function skeleton() { return `<div class="sk" style="height:46px;width:70%;margin-bottom:14px"></div><div class="sk" style="height:18px;width:50%;margin-bottom:28px"></div><div class="sk" style="height:300px;border-radius:34px;margin-bottom:24px"></div><div class="sk" style="height:110px;margin-bottom:16px"></div><div class="sk" style="height:140px"></div>`; }

/* ---------- lógica de jornada ---------- */
const proc = p => S.currentProc(p);
const nDay = p => dayN(proc(p).date);
function ensureAuto(p) {
  const s = S.get(), today = isoDay(), n = nDay(p), cps = s.checkpoints.map(c => c.day);
  const has = (type) => s.notifications.some(x => x.patientId === p.id && x.source === 'auto' && x.type === type && x.at.slice(0, 10) === new Date().toISOString().slice(0, 10) && x.key === today + type);
  const add = (type, title, body) => { s.notifications.push({ id: uid('nt'), patientId: p.id, type, title, body, at: new Date().toISOString(), read: false, source: 'auto', key: today + type }); };
  if (S.isActive(p) && cps.includes(n) && n > 0 && !s.photos.some(x => x.patientId === p.id && x.date === today) && !has('registro')) add('registro', 'Um pequeno momento para você', 'Se quiser, registre hoje um novo momento da sua evolução.');
  const lastCk = s.checkins.filter(c => c.patientId === p.id).map(c => c.at).sort().pop();
  if (S.isActive(p) && n >= 2 && (!lastCk || (Date.now() - new Date(lastCk)) / 864e5 >= 3) && !has('checkin')) add('checkin', 'Como está se sentindo hoje?', 'Seu acompanhamento está passando por uma nova etapa. Estamos por aqui.');
  S.persist();
}
function nextCare(p) {
  const s = S.get(), n = nDay(p), today = isoDay(), cps = s.checkpoints, ph = S.forPatient('photos', p.id);
  if (!S.isActive(p)) return { ic: 'heart', t: 'Seu acompanhamento desta etapa foi concluído.', d: 'Seu histórico continua guardado aqui. Quando quiser retornar, estamos por perto.', cta: 'Quero agendar meu retorno', href: '#/contato' };
  const todayCp = cps.find(c => c.day === n);
  if (todayCp && n > 0 && !ph.some(x => x.date === today)) return { ic: 'camera', t: 'Hoje é dia de registrar sua evolução.', d: `Dia ${pad2(n)} · ${todayCp.label}. Um registro leve, no seu tempo.`, cta: 'Registrar agora', href: '#/evolucao/novo' };
  const ap = S.forPatient('appointments', p.id).filter(a => a.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (ap) return { ic: 'cal', t: ap.title, d: `${fmtLong(ap.date)}${ap.time ? ' às ' + ap.time : ''}. Nos vemos em breve.`, cta: 'Ver meu histórico', href: '#/perfil/historico' };
  const nx = cps.find(c => c.day > n);
  if (nx) return { ic: 'clock', t: `Seu próximo momento é o dia ${pad2(nx.day)}.`, d: `${nx.label} · em ${nx.day - n} ${nx.day - n === 1 ? 'dia' : 'dias'}. Enquanto isso, conte como você está.`, cta: 'Fazer meu check-in', href: '#/diario' };
  return { ic: 'leaf', t: 'Você chegou ao fim desta etapa.', d: 'A equipe vai conversar com você sobre os próximos passos.', cta: 'Falar com a equipe', href: '#/contato' };
}
function openWA(kind, text) {
  const p = P(), msg = `Olá, aqui é ${p.name}. ${text} (Procedimento: ${proc(p).name} · dia ${pad2(nDay(p))})`;
  S.logContact(p.id, 'patient', 'whatsapp', kind, text, p.name); S.commit();
  window.open(waLink(clinic().whatsapp, msg), '_blank', 'noopener');
}

/* ---------- telas: onboarding ---------- */
function welcome() {
  return shell(`<div class="welcome">
    <div class="rise"><div class="logo"><img src="brand/fa-monograma-preto.png" alt="FA"><div class="rule"></div><span>Essência</span></div></div>
    <div class="art rise" style="animation-delay:.15s"><img alt="" style="width:100%;height:100%;object-fit:cover" src="${art(5, 700, 400)}"></div>
    <div class="rise" style="animation-delay:.3s">
      <h1>Um cuidado que não termina <span class="em">quando você sai da clínica.</span></h1>
      <p class="sub">Seu espaço para acompanhar cada etapa, registrar sua evolução e estar sempre perto da equipe Clínica FA.</p>
      <a class="btn primary block" href="#/cadastro">Começar minha jornada ${icon('arrow', 'sm')}</a>
      <p style="margin-top:18px"><a class="link" href="#/entrar">Já tenho acesso</a></p>
    </div></div>`, true);
}
function cadastro() {
  const d = ob;
  return shell(`${back('#/welcome')}<div class="stepper"><i class="on"></i><i></i></div>
    <p class="quote">Cada jornada é única.<br>Este espaço foi criado para acompanhar a sua.</p>
    <form id="f-cad" autocomplete="off" novalidate>
      <div style="display:flex;justify-content:center;margin-bottom:22px"><label class="avatar" style="cursor:pointer" title="Adicionar foto (opcional)">${d.avatar ? `<img alt="" src="${d.avatar}">` : icon('camera', 'lg')}<input type="file" id="f-avatar" accept="image/*" hidden></label></div>
      <p class="soft" style="text-align:center;font-size:12.5px;margin:-10px 0 22px">Foto de perfil (opcional)</p>
      <div class="field"><label for="c-name">Seu nome</label><input class="input" id="c-name" required placeholder="Como gostaria de ser chamada?" value="${esc(d.name || '')}"></div>
      <div class="field"><label for="c-proc">Procedimento realizado</label><select class="select" id="c-proc">${S.PROCEDURES.map(x => `<option ${d.procedure === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="field"><label for="c-date">Data do procedimento</label><input class="input" type="date" id="c-date" max="${isoDay()}" value="${d.procDate || isoDay()}"></div>
      <div class="field"><label for="c-doc">Médica responsável</label><select class="select" id="c-doc">${S.DOCTORS.map(x => `<option ${d.doctor === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="card" style="padding:18px;margin:6px 0 22px;display:grid;gap:16px">
        <label class="check"><input type="checkbox" id="c-lgpd" ${d.lgpd ? 'checked' : ''}><span>Concordo com o tratamento dos meus dados pessoais e de saúde pela Clínica FA para o meu acompanhamento, conforme a LGPD. Posso revisar ou retirar meu consentimento a qualquer momento no Perfil. <b>(obrigatório)</b></span></label>
        <label class="check"><input type="checkbox" id="c-photos" ${d.photosStaff ? 'checked' : ''}><span>Autorizo a equipe médica a visualizar as fotos do meu diário de evolução. Elas nunca são públicas. <i>(opcional)</i></span></label>
      </div>
      <p id="c-err" style="color:var(--risk);font-size:13.5px;margin-bottom:12px" hidden></p>
      <button class="btn primary block" type="submit">Continuar ${icon('arrow', 'sm')}</button>
    </form>`, true);
}
function intro() {
  const f = [['spark', 'Acompanhe sua evolução', 'Veja sua jornada em uma linha do tempo delicada, no seu ritmo.'], ['camera', 'Registre seus momentos', 'Um álbum privado de fotos e notas, só seu.'], ['bell', 'Receba seus cuidados e lembretes', 'Orientações aprovadas pela equipe médica e lembretes gentis.'], ['chat', 'Fale com nossa equipe', 'Um toque e você está no WhatsApp da Clínica FA.']];
  return shell(`${back('#/cadastro')}<div class="stepper"><i></i><i class="on"></i></div>
    <div class="ph"><span class="eyebrow">Seu espaço</span><h1>Tudo o que você precisa, com calma.</h1></div>
    ${f.map((x, i) => `<div class="feat" style="animation-delay:${i * .12}s"><div class="ic">${icon(x[0])}</div><div><h3>${x[1]}</h3><p>${x[2]}</p></div></div>`).join('')}
    <div style="margin-top:34px"><button class="btn primary block" data-act="enter">Entrar no meu espaço ${icon('arrow', 'sm')}</button></div>`, true);
}
function entrar() {
  const ps = S.get().patients;
  return shell(`${back('#/welcome')}<div class="ph"><span class="eyebrow">Acesso</span><h1>Bem-vinda de volta.</h1><p>Escolha uma paciente de demonstração para entrar.</p></div>
    ${ps.map(p => `<button class="opt" data-act="login" data-id="${p.id}"><span class="avatar sm">${p.avatar ? `<img alt="" src="${p.avatar}">` : initials(p.name)}</span><span style="flex:1"><b style="display:block">${esc(p.name)}</b><small class="soft">${esc(proc(p).name)} · dia ${pad2(nDay(p))}</small></span>${icon('chevR', 'sm')}</button>`).join('')}
    <p class="demo-note">Dados fictícios para demonstração. Em produção, o acesso é feito por link seguro enviado pela clínica (Supabase Auth).</p>`, true);
}
function launch() {
  return shell(`<div class="launch"><div class="orb"><i style="width:260px;height:260px;background:var(--sand);top:-60px;right:-80px"></i><i style="width:240px;height:240px;background:var(--olive);bottom:-40px;left:-90px;opacity:.28"></i></div>
    <div class="rise" style="position:relative"><div class="logo"><img src="brand/fa-monograma-preto.png" alt="FA"><div class="rule"></div><span>Essência</span></div>
    <h1>Bem-vinda ao seu espaço.</h1>
    <p>Criamos este lugar pensando em você. Para que suas dúvidas tenham espaço, seus momentos sejam registrados e você nunca se sinta sozinha durante sua jornada.</p>
    <button class="btn primary block" data-act="finishLaunch">Continuar ${icon('arrow', 'sm')}</button></div></div>`, true);
}

/* ---------- Home ---------- */
function home() {
  const p = P(), pr = proc(p), n = nDay(p), s = S.get(), cps = s.checkpoints, nc = nextCare(p);
  const ph = S.forPatient('photos', p.id).sort((a, b) => b.at.localeCompare(a.at));
  const msg = S.forPatient('messages', p.id).sort((a, b) => b.at.localeCompare(a.at))[0];
  let idx = cps.findIndex((c, i) => c.day <= n && (!cps[i + 1] || cps[i + 1].day > n)); if (idx < 0) idx = 0;
  const nxt = cps[idx + 1], frac = nxt ? (n - cps[idx].day) / (nxt.day - cps[idx].day) : 1;
  const pct = Math.min(100, ((idx + Math.min(frac, 1)) / (cps.length - 1)) * 100);
  const unread = S.dueNotifications(p.id).filter(x => !x.read).length;
  const statusTxt = { novo: 'Acompanhamento iniciado', em_acompanhamento: 'Acompanhamento ativo', retorno_pendente: 'Vamos combinar seu retorno', concluido: 'Etapa concluída' }[p.status];
  return shell(`
  <div class="topbar"><div class="logo sm"><img src="brand/fa-monograma-preto.png" alt="FA"></div><a class="iconbtn" href="#/notificacoes" aria-label="Notificações">${icon('bell')}${unread ? '<i class="badge"></i>' : ''}</a></div>
  <div class="hello rise"><h1>Olá, ${esc(first(p.name))}.</h1><p>Estamos cuidando de cada detalhe da sua jornada.</p></div>
  <div class="journey rise" style="animation-delay:.1s">
    <span class="eyebrow">Sua jornada de cuidado</span>
    <h2>${esc(pr.name)}</h2>
    <div class="meta">Realizado em ${fmtLong(pr.date)} · ${esc(pr.doctor)}</div>
    <div class="day">Seu cuidado, <em>dia ${pad2(n)}</em></div>
    <div class="say">Estamos aqui com você em cada etapa.</div>
    <div class="track" aria-hidden="true"><div class="ln"></div><div class="fl" data-w="${pct}"></div>${cps.map((c, i) => `<div class="st ${c.day < n && i < idx ? 'done' : ''} ${i === idx ? 'now' : ''} ${i < idx ? 'done' : ''}" style="left:${(i / (cps.length - 1)) * 100}%"><b></b>${c.day}</div>`).join('')}</div>
    <div class="soft" style="color:rgba(247,245,240,.5);font-size:11px">Marcos definidos pela clínica · cada pessoa tem seu tempo</div>
    <div class="pill"><i></i>${statusTxt}</div>
  </div>
  <section class="sec"><span class="eyebrow">Seu próximo cuidado</span>
    <div class="card"><div class="next"><div class="ic">${icon(nc.ic)}</div><div><h3>${esc(nc.t)}</h3><p>${esc(nc.d)}</p></div></div><a class="btn primary block" style="margin-top:20px" href="${nc.href}">${esc(nc.cta)}</a></div></section>
  <section class="sec"><span class="eyebrow">Um recado da Clínica FA</span>
    <div class="recado"><span class="q">“</span><p>${esc(msg ? msg.text : 'Cada pessoa tem seu próprio tempo. Se tiver alguma dúvida sobre como está se sentindo, estamos aqui para conversar.')}</p><small>— ${esc(msg ? msg.by : 'Equipe Clínica FA')}${msg ? ' · ' + ago(msg.at) : ''}</small></div></section>
  <section class="sec"><span class="eyebrow">Seu diário</span>
    ${ph[0] ? `<div class="card"><div class="diarycard"><div class="th"><img alt="Último registro" src="${ph[0].src}"></div><div><h3 style="font-size:24px;margin-bottom:4px">Último registro</h3><p class="muted" style="font-size:13.5px">${fmtLong(ph[0].date)} · dia ${pad2(ph[0].day ?? 0)}</p>${ph[0].note ? `<p class="soft" style="font-size:13px;margin-top:6px">“${esc(ph[0].note.slice(0, 70))}${ph[0].note.length > 70 ? '…' : ''}”</p>` : ''}</div></div><a class="btn sand block" style="margin-top:18px" href="#/evolucao">Continuar meu diário</a></div>`
      : `<div class="empty"><div class="ill">${icon('book', 'lg')}</div><h3>Seu diário está começando.</h3><p class="muted" style="font-size:14px;margin-bottom:18px">Cada registro é uma forma de acompanhar sua jornada com carinho.</p><a class="btn primary" href="#/evolucao/novo">Fazer o primeiro registro</a></div>`}</section>
  <section class="sec"><span class="eyebrow">Estamos por perto</span>
    <div class="near"><h3>Precisa de nós?</h3><p>Uma conversa de verdade, quando você quiser.</p>
    <button class="btn primary block wa" data-act="wa" data-kind="geral" data-text="Gostaria de conversar com a equipe.">${WA_SVG} Falar com a equipe</button>
    <p style="margin-top:14px"><a class="link" href="#/contato">Outras formas de pedir ajuda</a></p></div></section>`);
}

/* ---------- Minha evolução ---------- */
function evolucao() {
  const p = P(), pr = proc(p), n = nDay(p), s = S.get();
  const ph = S.forPatient('photos', p.id).sort((a, b) => a.at.localeCompare(b.at));
  const days = new Map(); s.checkpoints.forEach(c => days.set(c.day, c.label));
  ph.forEach(x => { if (!days.has(x.day)) days.set(x.day, 'Registro'); });
  const items = [...days.entries()].sort((a, b) => a[0] - b[0]);
  let nowDay = -1; items.forEach(([d]) => { if (d <= n) nowDay = d; });
  const html = items.map(([d, label], i) => {
    const arr = ph.filter(x => x.day === d), done = d <= n, isNow = d === nowDay;
    const date = isoDay(addDays(parseDate(pr.date), d));
    return `<div class="tl-item ${done ? 'done' : 'future'} ${isNow ? 'now' : ''}" style="animation-delay:${i * .06}s"><span class="pt">${done && (arr.length || d === 0) ? icon('check') : ''}</span>
      <div class="tl-head"><h3>Dia ${pad2(d)} — ${esc(d === 0 ? 'Procedimento' : label)}</h3><small>${fmtShort(date)}</small></div>
      ${d === 0 ? `<p class="muted" style="font-size:13.5px;margin-bottom:6px">${esc(pr.name)} · ${esc(pr.doctor)}</p>` : ''}
      ${arr.map(x => `<div class="photo" data-act="viewPhoto" data-id="${x.id}"><img alt="Registro do dia ${pad2(x.day)}" src="${x.src}" loading="lazy"><div class="cap"><b>${fmtLong(x.date)}</b>${x.note ? esc(x.note) : '<span class="soft">Sem observações</span>'}</div></div>`).join('')}
      ${!arr.length && d > 0 && done ? `<p class="soft" style="font-size:13px">Quando quiser, registre este momento.</p>` : ''}
      ${!done ? `<p class="soft" style="font-size:13px">Momento sugerido pela clínica para o seu acompanhamento.</p>` : ''}</div>`;
  }).join('');
  return shell(`<div class="ph"><span class="eyebrow">Minha evolução</span><h1>Seu álbum privado.</h1><p>Seus registros, em ordem cronológica, no seu tempo.</p></div>
    <div class="privacy">${icon('lock')}<span>Somente você vê estas fotos${p.consent.photosStaff ? ' e a equipe médica, conforme sua autorização' : ''}. Não há compartilhamento público.</span></div>
    ${ph.length ? `<div style="display:flex;gap:10px;margin-bottom:20px"><a class="btn sand sm" href="#/evolucao/comparar" ${ph.length < 2 ? 'style="opacity:.5;pointer-events:none"' : ''}>${icon('compare', 'sm')} Comparar registros</a></div>` : `<div class="empty" style="margin-bottom:26px"><div class="ill">${icon('image', 'lg')}</div><h3>Seu diário está começando.</h3><p class="muted" style="font-size:14px;margin-bottom:18px">Cada registro é uma forma de acompanhar sua jornada com carinho.</p></div>`}
    <div class="tl">${html}</div>
    <div class="fab"><a class="btn primary" href="#/evolucao/novo">${icon('plus', 'sm')} Novo registro</a></div>`);
}
function novoRegistro() {
  const p = P(), n = nDay(p);
  return shell(`${back('#/evolucao')}<div class="ph"><span class="eyebrow">Novo registro</span><h1>Um momento seu.</h1></div>
    <div class="pick"><button data-act="pickCam">${icon('camera', 'lg')}Tirar foto</button><button data-act="pickGal">${icon('upload', 'lg')}Da galeria</button></div>
    <input type="file" id="f-cam" accept="image/*" capture="user" hidden><input type="file" id="f-gal" accept="image/*" hidden>
    ${draft.photo ? `<div class="preview"><img alt="Pré-visualização" src="${draft.photo}"></div>` : ''}
    <p class="muted" style="font-size:14px;margin-bottom:18px">${icon('cal', 'sm')} <b>Hoje, ${fmtLong(isoDay())}</b> · dia ${pad2(n)} — a data é registrada automaticamente.</p>
    <div class="field"><label for="n-note">Como estou me sentindo hoje?</label><textarea class="textarea" id="n-note" placeholder="Uma nota só sua (opcional)…">${esc(draft.note)}</textarea></div>
    <div class="privacy">${icon('lock')}<span>Registro privado. Sem opção de publicação ou compartilhamento.</span></div>
    <button class="btn primary block" data-act="savePhoto" ${draft.photo ? '' : 'disabled'} id="b-save">Guardar registro</button>`, true);
}
function comparar() {
  const p = P(), ph = S.forPatient('photos', p.id).sort((a, b) => a.at.localeCompare(b.at));
  if (ph.length < 2) return shell(`${back('#/evolucao')}<div class="empty"><h3>Registre ao menos duas fotos.</h3><p class="muted">Assim você poderá comparar momentos diferentes da sua jornada.</p></div>`, true);
  if (!ph.find(x => x.id === cmp.a)) cmp.a = ph[0].id; if (!ph.find(x => x.id === cmp.b)) cmp.b = ph[ph.length - 1].id;
  const A = ph.find(x => x.id === cmp.a), B = ph.find(x => x.id === cmp.b);
  const opt = sel => ph.map(x => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>Dia ${pad2(x.day)} · ${fmtShort(x.date)}</option>`).join('');
  const fig = x => `<figure><img alt="" src="${x.src}"><figcaption><b>Dia ${pad2(x.day)}</b>${fmtLong(x.date)}</figcaption></figure>`;
  return shell(`${back('#/evolucao')}<div class="ph"><span class="eyebrow">Comparar</span><h1>Dois momentos, lado a lado.</h1><p>Uma comparação só para você. Ela não é salva nem compartilhada.</p></div>
    <div class="cmp" style="margin-bottom:16px"><select class="select" id="cmp-a">${opt(cmp.a)}</select><select class="select" id="cmp-b">${opt(cmp.b)}</select></div>
    <div class="cmp">${fig(A)}${fig(B)}</div>
    <div class="privacy" style="margin-top:22px">${icon('lock')}<span>Cada pessoa tem seu próprio tempo. Esta comparação não indica resultado.</span></div>`, true);
}
function viewPhoto(id) {
  const x = S.get().photos.find(p => p.id === id); if (!x) return;
  const s = sheet(`<img alt="" src="${x.src}" style="width:100%;border-radius:22px;max-height:48vh;object-fit:cover;margin-bottom:16px">
    <h3 style="font-size:28px">Dia ${pad2(x.day)} · ${fmtLong(x.date)}</h3>
    <p class="muted" style="margin:8px 0 20px">${x.note ? esc(x.note) : 'Sem observações.'}</p>
    <div style="display:flex;gap:10px"><button class="btn ghost" style="flex:1" data-act="closeSheet">Fechar</button><button class="btn danger" data-act="delPhoto" data-id="${x.id}">${icon('trash', 'sm')} Excluir</button></div>`);
}

/* ---------- Meu diário ---------- */
const MOODS = [['bem', 'Estou me sentindo bem.', 'heart'], ['duvidas', 'Tenho algumas dúvidas.', 'help'], ['conversar', 'Gostaria de conversar com a equipe.', 'chat'], ['registrar', 'Quero registrar algo sobre minha experiência.', 'edit']];
const TAGS = ['Percepção', 'Dúvida', 'Sensação', 'Expectativa', 'Atendimento', 'Comentário'];
function diario() {
  const p = P(), s = S.get();
  const ck = S.forPatient('checkins', p.id).map(x => ({ ...x, _t: 'ck' })), jr = S.forPatient('journal', p.id).map(x => ({ ...x, _t: 'jr' })), fb = S.forPatient('feedbacks', p.id);
  const entries = [...ck, ...jr].sort((a, b) => b.at.localeCompare(a.at));
  const lastFb = fb.sort((a, b) => b.at.localeCompare(a.at))[0];
  const todayCk = ck.filter(c => c.at.slice(0, 10) === new Date().toISOString().slice(0, 10)).sort((a, b) => b.at.localeCompare(a.at))[0];
  return shell(`<div class="ph"><span class="eyebrow">Meu diário</span><h1>Como você está se sentindo hoje?</h1><p>Sua resposta chega à equipe, que acompanha você de perto.</p></div>
    <div class="moods">${MOODS.map(m => `<button class="mood ${todayCk && todayCk.kind === m[0] ? 'on' : ''}" data-act="mood" data-k="${m[0]}"><span class="ic">${icon(m[2])}</span><b>${m[1]}</b></button>`).join('')}</div>
    <section class="sec" id="free"><span class="eyebrow">Registro livre</span>
      <div class="card"><div class="tags">${TAGS.map(t => `<button class="tag ${tag === t ? 'on' : ''}" data-act="tag" data-t="${t}">${t}</button>`).join('')}</div>
      <div class="field" style="margin-bottom:14px"><textarea class="textarea" id="j-text" placeholder="Conte um pouco sobre como está sendo sua experiência..." aria-label="Registro livre"></textarea></div>
      <label class="check" style="margin-bottom:16px"><input type="checkbox" id="j-share" ${tag === 'Dúvida' || tagShare ? 'checked' : ''}><span>Quero que a equipe veja este registro e me retorne. ${tag === 'Dúvida' ? '<i>(dúvidas são sempre compartilhadas)</i>' : '<i>Por padrão, ele fica só com você.</i>'}</span></label>
      <button class="btn primary block" data-act="saveJournal">Guardar registro</button></div></section>
    <section class="sec"><span class="eyebrow">Feedback</span>
      <div class="card" style="text-align:center"><h3 style="font-size:28px">Como foi seu cuidado com a Clínica FA até aqui?</h3>
      <div class="stars" role="radiogroup" aria-label="Avaliação">${[1, 2, 3, 4, 5].map(i => `<button data-act="star" data-n="${i}" class="${stars >= i ? 'on' : ''}" aria-label="${i} estrelas">${icon('star')}</button>`).join('')}</div>
      <div class="field" style="text-align:left"><textarea class="textarea" id="fb-text" style="min-height:90px" placeholder="Quer deixar um comentário? (opcional)" aria-label="Comentário"></textarea></div>
      <button class="btn primary block" data-act="sendFb">Enviar feedback</button>
      <p class="soft" style="font-size:12px;margin-top:12px">Seu feedback é enviado à equipe para que ela cuide de você cada vez melhor.</p>
      ${lastFb ? `<p class="muted" style="font-size:13px;margin-top:10px">Último envio: ${'★'.repeat(lastFb.rating)} · ${ago(lastFb.at)}</p>` : ''}</div></section>
    <section class="sec"><span class="eyebrow">Seus registros</span>
    ${entries.length ? entries.map(e => e._t === 'ck' ? `<div class="entry"><div class="top"><span class="chip ${e.kind === 'bem' ? 'ok' : 'warn'}">Check-in</span><small>${ago(e.at)}</small></div><p>${esc(MOODS.find(m => m[0] === e.kind)?.[1] || '')}${e.note ? `<br><span class="muted">“${esc(e.note)}”</span>` : ''}</p></div>`
      : `<div class="entry"><div class="top"><span class="chip">${esc(e.tag)}${e.share ? ' · enviado à equipe' : ' · privado'}</span><small>${ago(e.at)}</small></div><p>${esc(e.text)}</p><button class="link" style="margin-top:10px" data-act="delJournal" data-id="${e.id}">Excluir</button></div>`).join('')
      : `<div class="empty"><div class="ill">${icon('book', 'lg')}</div><h3>Seu diário está começando.</h3><p class="muted" style="font-size:14px">Cada registro é uma forma de acompanhar sua jornada com carinho.</p></div>`}</section>`);
}

/* ---------- Cuidados ---------- */
function cuidados() {
  const p = P(), pr = proc(p), all = S.guidanceFor(pr.name), cats = ['Todas', ...S.GUIDE_CATS.filter(c => all.some(g => g.category === c))];
  const list = all.filter(g => gcat === 'Todas' || g.category === gcat);
  const rem = S.dueNotifications(p.id).slice(0, 3);
  return shell(`<div class="ph"><span class="eyebrow">Seus cuidados</span><h1>Orientações para ${esc(pr.name.toLowerCase())}.</h1><p>Conteúdo cadastrado e aprovado pela equipe médica da Clínica FA.</p></div>
    <div class="seg">${cats.map(c => `<button class="${gcat === c ? 'on' : ''}" data-act="gcat" data-c="${esc(c)}">${esc(c.replace('Orientações pós-procedimento', 'Pós-procedimento'))}</button>`).join('')}</div>
    ${list.length ? list.map(g => `<details class="guide"><summary><div><small>${esc(g.category)}</small><h3>${esc(g.title)}</h3></div>${icon('chevD')}</summary><div class="body">${esc(g.body).replace(/\n/g, '<br>')}<div class="approved">${icon('shield', 'sm')} Aprovado por ${esc(g.approvedBy || 'equipe médica')}</div></div></details>`).join('')
      : `<div class="empty"><div class="ill">${icon('leaf', 'lg')}</div><h3>Orientações a caminho.</h3><p class="muted" style="font-size:14px">A equipe médica ainda não publicou conteúdo para este procedimento. Fale com a equipe se precisar.</p></div>`}
    <section class="sec"><span class="eyebrow">Lembretes</span>
      ${rem.length ? rem.map(notifHtml).join('') : '<p class="muted" style="font-size:14px;margin-bottom:12px">Nenhum lembrete por enquanto.</p>'}
      <a class="btn ghost block" href="#/perfil/notificacoes">${icon('bell', 'sm')} Configurar lembretes</a></section>
    <div class="help-box"><h3>Ficou com alguma dúvida?</h3><p>Fale com a equipe sempre que quiser. Em caso de urgência, procure atendimento médico imediato.</p><button class="btn primary wa" data-act="wa" data-kind="duvida" data-text="Tenho uma dúvida sobre meu procedimento.">${WA_SVG} Falar com a equipe</button></div>`);
}
const NIC = { registro: 'camera', orientacao: 'leaf', retorno: 'cal', consulta: 'cal', checkin: 'chat', carinho: 'heart' };
function notifHtml(n) { return `<div class="notif ${n.read ? '' : 'unread'}"><div class="ic">${icon(NIC[n.type] || 'bell')}</div><div><h4>${esc(n.title)}</h4><p>${esc(n.body)}</p><small>${ago(n.at)}</small></div></div>`; }
function notificacoes() {
  const p = P(), list = S.dueNotifications(p.id);
  setTimeout(() => { let ch = false; list.forEach(n => { if (!n.read) { n.read = true; ch = true; } }); if (ch) S.persist(); }, 600);
  return shell(`${back('#/home')}<div class="ph"><span class="eyebrow">Notificações</span><h1>Para você.</h1></div>
    ${list.length ? list.map(notifHtml).join('') : `<div class="empty"><div class="ill">${icon('bell', 'lg')}</div><h3>Tudo tranquilo por aqui.</h3><p class="muted" style="font-size:14px">Seus lembretes e recados aparecerão aqui.</p></div>`}
    <a class="btn ghost block" style="margin-top:14px" href="#/perfil/notificacoes">Configurar lembretes</a>`, true);
}

/* ---------- Contato ---------- */
const QUICK = [['duvida', 'Tenho uma dúvida sobre meu procedimento.', 'help'], ['sentimento', 'Quero falar sobre como estou me sentindo.', 'heart'], ['ajuda', 'Preciso de ajuda.', 'alert'], ['retorno', 'Quero agendar meu retorno.', 'cal'], ['medica', 'Quero falar com minha médica.', 'user']];
function contato() {
  return shell(`${back('#/home')}<div class="ph"><span class="eyebrow">Estamos por perto</span><h1>Você nunca está sozinha.</h1><p>Escolha como quer começar. Abriremos o WhatsApp da Clínica FA com a mensagem pronta.</p></div>
    <button class="btn primary block wa" style="margin-bottom:24px" data-act="wa" data-kind="geral" data-text="Gostaria de conversar com a Clínica FA.">${WA_SVG} Conversar com a Clínica FA</button>
    <span class="eyebrow" style="display:block;margin-bottom:12px">Começar por aqui</span>
    ${QUICK.map(q => `<button class="opt" data-act="wa" data-kind="${q[0]}" data-text="${esc(q[1])}"><span class="ic">${icon(q[2])}</span><b>${q[1]}</b>${icon('chevR', 'sm')}</button>`).join('')}
    <div class="help-box"><h3>Em caso de urgência</h3><p>Procure atendimento médico imediato. Este app não substitui atendimento de emergência.</p></div>`, true);
}

/* ---------- Perfil ---------- */
function perfil() {
  const p = P(), pr = proc(p);
  return shell(`<div class="prof rise"><div class="avatar">${p.avatar ? `<img alt="" src="${p.avatar}">` : initials(p.name)}</div><h1>${esc(p.name)}</h1><p>${esc(pr.name)} · dia ${pad2(nDay(p))}</p><span class="chip ok" style="margin-top:10px"><i class="dot"></i>${S.STATUS[p.status]}</span></div>
    <div class="list">
      <button class="row" data-act="editProfile"><span class="ic">${icon('user')}</span><span class="t">Meus dados<small>${esc(p.email || 'Adicionar e-mail')} · ${esc(p.phone || 'telefone')}</small></span><span class="ch">${icon('chevR', 'sm')}</span></button>
      <a class="row" href="#/perfil/historico"><span class="ic">${icon('book')}</span><span class="t">Meu histórico<small>Procedimentos, consultas e contatos</small></span><span class="ch">${icon('chevR', 'sm')}</span></a>
      <div class="row"><span class="ic">${icon('heart')}</span><span class="t">Médica responsável<small>${esc(pr.doctor)}</small></span></div>
    </div>
    <div class="list">
      <a class="row" href="#/perfil/notificacoes"><span class="ic">${icon('bell')}</span><span class="t">Notificações<small>Escolha seus lembretes</small></span><span class="ch">${icon('chevR', 'sm')}</span></a>
      <a class="row" href="#/perfil/privacidade"><span class="ic">${icon('lock')}</span><span class="t">Privacidade e consentimentos<small>LGPD, fotos e seus dados</small></span><span class="ch">${icon('chevR', 'sm')}</span></a>
    </div>
    <div class="list">
      <a class="row" href="#/perfil/ajuda"><span class="ic">${icon('help')}</span><span class="t">Ajuda</span><span class="ch">${icon('chevR', 'sm')}</span></a>
      <a class="row" href="#/contato"><span class="ic">${icon('chat')}</span><span class="t">Contato da clínica<small>${esc(clinic().name)} · ${esc(clinic().city)}</small></span><span class="ch">${icon('chevR', 'sm')}</span></a>
      <a class="row" href="#/lancamento"><span class="ic">${icon('spark')}</span><span class="t">Mensagem de boas-vindas</span><span class="ch">${icon('chevR', 'sm')}</span></a>
    </div>
    <div class="list"><button class="row" data-act="logout"><span class="ic">${icon('logout')}</span><span class="t">Sair da conta</span></button></div>
    ${p.demo ? '<p class="demo-note">Dados fictícios de demonstração.</p>' : ''}`);
}
function historico() {
  const p = P(), s = S.get(), today = isoDay();
  const aps = S.forPatient('appointments', p.id).sort((a, b) => a.date.localeCompare(b.date)), cts = S.forPatient('contacts', p.id).sort((a, b) => b.at.localeCompare(a.at)), fb = S.forPatient('feedbacks', p.id).sort((a, b) => b.at.localeCompare(a.at));
  const sec = (t, inner) => `<span class="eyebrow" style="display:block;margin:26px 0 12px">${t}</span><div class="list">${inner}</div>`;
  return shell(`${back('#/perfil')}<div class="ph"><span class="eyebrow">Meu histórico</span><h1>Sua história com a Clínica FA.</h1></div>
    ${sec('Procedimentos', p.procedures.map((x, i) => `<div class="hist"><h4>${esc(x.name)}</h4><small>${fmtFull(x.date)} · ${esc(x.doctor)}${i === 0 ? ' · ' + S.STATUS[p.status] : ''}</small></div>`).join(''))}
    ${sec('Consultas e retornos', aps.length ? aps.map(a => `<div class="hist"><h4>${esc(a.title)}</h4><small>${fmtFull(a.date)}${a.time ? ' às ' + a.time : ''} · ${a.date >= today ? 'Agendada' : 'Realizada'}</small></div>`).join('') : '<div class="hist"><small>Nenhuma consulta agendada.</small></div>')}
    ${sec('Contatos com a clínica', cts.length ? cts.slice(0, 8).map(c => `<div class="hist"><h4 style="font-size:19px">${c.direction === 'clinic' ? 'A equipe entrou em contato' : 'Você falou com a equipe'}</h4><small>${esc(c.note)} · ${ago(c.at)}</small></div>`).join('') : '<div class="hist"><small>Sem contatos registrados.</small></div>')}
    ${sec('Feedbacks enviados', fb.length ? fb.map(f => `<div class="hist"><h4>${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</h4><small>${f.comment ? esc(f.comment) + ' · ' : ''}${ago(f.at)}</small></div>`).join('') : '<div class="hist"><small>Nenhum feedback ainda.</small></div>')}`, true);
}
function notifPrefs() {
  const p = P(), perm = 'Notification' in window ? Notification.permission : 'unsupported';
  return shell(`${back('#/perfil')}<div class="ph"><span class="eyebrow">Notificações</span><h1>Lembretes no seu ritmo.</h1><p>Ative apenas o que fizer sentido para você. Você pode desligar tudo quando quiser.</p></div>
    <div class="list">${Object.entries(S.NOTIF_TYPES).map(([k, v]) => `<div class="row sw"><span class="ic">${icon(NIC[k])}</span><span class="t">${v}</span><label class="switch"><input type="checkbox" data-pref="${k}" ${p.prefs[k] !== false ? 'checked' : ''} aria-label="${v}"></label></div>`).join('')}</div>
    <div class="card" style="margin-bottom:12px"><h3 style="font-size:24px;margin-bottom:6px">Avisos no celular</h3><p class="muted" style="font-size:13.5px;margin-bottom:14px">${perm === 'granted' ? 'Notificações do navegador ativadas neste aparelho.' : perm === 'denied' ? 'Bloqueadas no navegador. Libere nas configurações do aparelho.' : perm === 'unsupported' ? 'Seu navegador não oferece notificações.' : 'Permita avisos para receber lembretes mesmo com o app fechado.'}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${perm === 'default' ? '<button class="btn sand sm" data-act="askPerm">Ativar avisos</button>' : ''}<button class="btn ghost sm" data-act="testPush">Ver um lembrete de exemplo</button></div></div>
    <button class="btn ghost block" data-act="muteAll">Desativar todos os lembretes</button>`, true);
}
function privacidade() {
  const p = P();
  return shell(`${back('#/perfil')}<div class="ph"><span class="eyebrow">Privacidade</span><h1>Seus dados são seus.</h1><p>Informações de saúde e fotos são tratadas como dados sensíveis (LGPD) e nunca ficam públicas.</p></div>
    <div class="list">
      <div class="row sw"><span class="ic">${icon('shield')}</span><span class="t">Tratamento de dados para acompanhamento<small>Necessário para usar o app · concedido em ${fmtLong(p.consent.at)}</small></span><span class="chip ok">Ativo</span></div>
      <div class="row sw"><span class="ic">${icon('eye')}</span><span class="t">Equipe médica pode ver minhas fotos<small>Quando desligado, só você acessa o álbum</small></span><label class="switch"><input type="checkbox" data-consent="photosStaff" ${p.consent.photosStaff ? 'checked' : ''} aria-label="Equipe pode ver fotos"></label></div>
    </div>
    <div class="card" style="margin-bottom:18px"><h3 style="font-size:24px;margin-bottom:8px">O que fazemos com seus dados</h3><p class="muted" style="font-size:14px">Usamos seus dados apenas para acompanhar seu cuidado. Suas fotos não são usadas em divulgação nem compartilhadas. Você pode baixar ou excluir seus registros quando quiser.</p></div>
    <button class="btn ghost block" style="margin-bottom:10px" data-act="exportData">${icon('download', 'sm')} Baixar meus dados</button>
    <button class="btn ghost block" style="margin-bottom:10px" data-act="wipePersonal">Excluir minhas fotos e notas</button>
    <button class="btn danger block" data-act="deleteAccount">Excluir minha conta</button>`, true);
}
function ajuda() {
  const p = P(), faq = S.guidanceFor(proc(p).name).filter(g => g.category === 'Dúvidas frequentes' || g.category === 'Quando falar com a clínica');
  return shell(`${back('#/perfil')}<div class="ph"><span class="eyebrow">Ajuda</span><h1>Podemos ajudar?</h1></div>
    ${faq.map(g => `<details class="guide"><summary><div><h3>${esc(g.title)}</h3></div>${icon('chevD')}</summary><div class="body">${esc(g.body)}</div></details>`).join('')}
    <details class="guide"><summary><div><h3>Como minhas informações chegam à equipe?</h3></div>${icon('chevD')}</summary><div class="body">Seus check-ins e feedbacks são enviados à equipe. Registros livres e fotos só são vistos se você autorizar.</div></details>
    <a class="btn primary block wa" style="margin-top:20px" href="#/contato">Falar com a equipe</a>`, true);
}

/* ---------- router ---------- */
const routes = {
  '/welcome': welcome, '/cadastro': cadastro, '/intro': intro, '/entrar': entrar, '/lancamento': launch,
  '/home': home, '/evolucao': evolucao, '/evolucao/novo': novoRegistro, '/evolucao/comparar': comparar, '/diario': diario, '/cuidados': cuidados,
  '/perfil': perfil, '/perfil/historico': historico, '/perfil/notificacoes': notifPrefs, '/perfil/privacidade': privacidade, '/perfil/ajuda': ajuda,
  '/contato': contato, '/notificacoes': notificacoes
};
const PUBLIC = ['/welcome', '/cadastro', '/intro', '/entrar'];
const TABS = [['/home', 'Início', 'home'], ['/evolucao', 'Minha evolução', 'image'], ['/diario', 'Meu diário', 'book'], ['/cuidados', 'Cuidados', 'leaf'], ['/perfil', 'Perfil', 'user']];
let lastPath = '';
function render() {
  const path = location.hash.slice(1) || '/';
  const sess = P();
  if (!sess && !PUBLIC.includes(path)) return location.replace('#/welcome');
  if (sess && (path === '/' || PUBLIC.includes(path))) { if (!(path === '/entrar' || path === '/welcome') ) return location.replace('#/home'); }
  if (path === '/') return location.replace('#/welcome');
  const fn = routes[path]; if (!fn) return location.replace(sess ? '#/home' : '#/welcome');
  if (sess) ensureAuto(sess);
  const isTab = TABS.some(t => t[0] === path), firstTime = isTab && !seen.has(path);
  const go = () => {
    const r = fn();
    root.className = (r.bare ? 'bare ' : '') + 'enter'; root.innerHTML = r.html; void root.offsetWidth;
    const showNav = sess && (isTab || ['/contato', '/notificacoes'].includes(path)) && !r.bare;
    nav.hidden = !showNav;
    if (showNav) nav.innerHTML = `<div class="bar">${TABS.map(t => `<a href="#${t[0]}" class="${t[0] === path ? 'on' : ''}" ${t[0] === path ? 'aria-current="page"' : ''}>${icon(t[2])}${t[1].replace('Minha evolução', 'Evolução')}</a>`).join('')}</div>`;
    if (path !== lastPath) window.scrollTo(0, 0); lastPath = path;
    requestAnimationFrame(() => $$('.fl[data-w]').forEach(f => f.style.width = f.dataset.w + '%'));
  };
  if (firstTime) { seen.add(path); root.className = 'bare'; root.innerHTML = skeleton(); nav.hidden = false; setTimeout(() => { if ((location.hash.slice(1) || '/') === path) go(); }, 380); } else go();
}
window.addEventListener('hashchange', () => { closeSheets(); render(); });
S.subscribe(() => { if (!$('.scrim') && !['/cadastro', '/evolucao/novo'].includes(location.hash.slice(1)) && !document.activeElement?.matches?.('textarea,input')) render(); });

/* ---------- ações ---------- */
const A = {
  closeSheet: () => closeSheets(),
  login: el => { S.setPatientSession(el.dataset.id); location.hash = '#/home'; },
  logout: () => { S.setPatientSession(null); location.hash = '#/welcome'; },
  wa: el => openWA(el.dataset.kind, el.dataset.text),
  enter: () => {
    const d = ob; const p = S.createPatient({ name: d.name, avatar: d.avatar, procDate: d.procDate, procedure: d.procedure, doctor: d.doctor, consent: { photosStaff: d.photosStaff } });
    S.setPatientSession(p.id); ob = {}; location.hash = '#/lancamento';
  },
  finishLaunch: () => { const p = P(); p.seenLaunch = true; S.commit(); location.hash = '#/home'; },
  pickCam: () => { saveNote(); $('#f-cam').click(); }, pickGal: () => { saveNote(); $('#f-gal').click(); },
  savePhoto: () => {
    const p = P(), note = $('#n-note').value.trim(), n = nDay(p);
    if (!draft.photo) return;
    S.get().photos.push({ id: uid('ph'), patientId: p.id, date: isoDay(), at: new Date().toISOString(), note, src: draft.photo, day: n });
    if (p.status === 'novo') p.status = 'em_acompanhamento';
    if (!S.commit()) { S.get().photos.pop(); return toast('Sem espaço para guardar esta foto. Exclua um registro antigo.', 'alert'); }
    draft = { photo: null, note: '' };
    root.className = 'bare enter';
    root.innerHTML = `<div class="success" style="padding-top:90px"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="38"/><path d="m27 43 11 11 20-23"/></svg><h2>Registro guardado com carinho.</h2><p class="muted" style="margin-bottom:30px">Mais um momento da sua jornada, só seu.</p><a class="btn primary" href="#/evolucao">Ver minha evolução</a></div>`;
  },
  viewPhoto: el => viewPhoto(el.dataset.id),
  delPhoto: el => {
    const s = sheet(`<h3 style="font-size:28px;margin-bottom:8px">Excluir este registro?</h3><p class="muted" style="margin-bottom:22px">A foto e a nota serão removidas definitivamente do seu álbum.</p><div style="display:flex;gap:10px"><button class="btn ghost" style="flex:1" data-act="closeSheet">Manter</button><button class="btn danger" style="flex:1" data-act="confirmDelPhoto" data-id="${el.dataset.id}">Excluir</button></div>`, { center: true });
  },
  confirmDelPhoto: el => { const s = S.get(); s.photos = s.photos.filter(x => x.id !== el.dataset.id); S.commit(); closeSheets(); toast('Registro excluído.', 'trash'); render(); },
  mood: el => {
    const k = el.dataset.k, p = P();
    if (k === 'registrar') { $('#free').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#j-text').focus(), 500); return; }
    if (k === 'bem') { S.get().checkins.push({ id: uid('ck'), patientId: p.id, kind: 'bem', at: new Date().toISOString(), handled: true }); S.commit(); toast('Que bom saber. Registrado com carinho.', 'heart'); render(); return; }
    const isD = k === 'duvidas';
    const sh = sheet(`<h3 style="font-size:30px;margin-bottom:8px">${isD ? 'Quer nos contar sua dúvida?' : 'Vamos conversar.'}</h3>
      <p class="muted" style="margin-bottom:16px">${isD ? 'Escreva abaixo (opcional). A equipe recebe seu aviso e retorna para você.' : 'Avisaremos a equipe agora. Se preferir falar já, abra o WhatsApp.'}</p>
      ${isD ? '<div class="field"><textarea class="textarea" id="m-note" placeholder="Qual é a sua dúvida?"></textarea></div>' : ''}
      <button class="btn primary block" style="margin-bottom:10px" data-act="sendMood" data-k="${k}">Avisar a equipe</button>
      <button class="btn ghost block wa-btn" data-act="sendMood" data-k="${k}" data-wa="1">${icon('chat', 'sm')} Avisar e abrir WhatsApp</button>`);
  },
  sendMood: el => {
    const p = P(), k = el.dataset.k, note = ($('#m-note')?.value || '').trim();
    S.get().checkins.push({ id: uid('ck'), patientId: p.id, kind: k, note, at: new Date().toISOString(), handled: false }); S.commit(); closeSheets();
    toast('A equipe foi avisada e vai retornar.', 'check');
    if (el.dataset.wa) openWA(k === 'duvidas' ? 'duvida' : 'sentimento', note || (k === 'duvidas' ? 'Tenho uma dúvida.' : 'Gostaria de conversar com a equipe.'));
    render();
  },
  tag: el => { const v = $('#j-text')?.value; tag = el.dataset.t; tagShare = $('#j-share')?.checked; render(); const t = $('#j-text'); if (t) t.value = v || ''; },
  saveJournal: () => {
    const text = $('#j-text').value.trim(); if (!text) return toast('Escreva algumas palavras primeiro.', 'edit');
    S.get().journal.push({ id: uid('jr'), patientId: P().id, tag, text, share: tag === 'Dúvida' || $('#j-share').checked, at: new Date().toISOString(), handled: false });
    S.commit(); tagShare = false; toast('Registro guardado.'); render();
  },
  delJournal: el => { const s = S.get(); s.journal = s.journal.filter(x => x.id !== el.dataset.id); S.commit(); toast('Registro excluído.', 'trash'); render(); },
  star: el => { const c = $('#fb-text')?.value; stars = +el.dataset.n; render(); const t = $('#fb-text'); if (t) t.value = c || ''; },
  sendFb: () => {
    if (!stars) return toast('Escolha de 1 a 5 estrelas.', 'star');
    const comment = $('#fb-text').value.trim(), p = P();
    S.get().feedbacks.push({ id: uid('fb'), patientId: p.id, rating: stars, comment, at: new Date().toISOString(), handled: stars > 2 });
    const low = stars <= 2; stars = 0; S.commit();
    if (low) sheet(`<h3 style="font-size:30px;margin-bottom:8px">Sentimos muito.</h3><p class="muted" style="margin-bottom:20px">Sua mensagem foi destacada para a equipe, que vai entrar em contato com cuidado. Se preferir, você pode falar agora.</p><button class="btn primary block wa" data-act="wa" data-kind="ajuda" data-text="Preciso de ajuda.">${WA_SVG} Falar com a equipe</button><button class="btn ghost block" style="margin-top:10px" data-act="closeSheet">Agora não</button>`, { center: true });
    else toast('Obrigada por compartilhar. Isso nos ajuda a cuidar melhor.', 'heart');
    render();
  },
  gcat: el => { gcat = el.dataset.c; render(); },
  editProfile: () => {
    const p = P();
    sheet(`<h3 style="font-size:30px;margin-bottom:18px">Meus dados</h3>
      <div style="display:flex;justify-content:center;margin-bottom:18px"><label class="avatar" style="cursor:pointer">${p.avatar ? `<img id="e-av" alt="" src="${p.avatar}">` : `<span id="e-av-ph">${icon('camera', 'lg')}</span>`}<input type="file" id="e-avatar" accept="image/*" hidden></label></div>
      <div class="field"><label for="e-name">Nome</label><input class="input" id="e-name" value="${esc(p.name)}"></div>
      <div class="field"><label for="e-email">E-mail</label><input class="input" id="e-email" type="email" value="${esc(p.email)}"></div>
      <div class="field"><label for="e-phone">Telefone</label><input class="input" id="e-phone" value="${esc(p.phone)}"></div>
      <button class="btn primary block" data-act="saveProfile">Salvar</button>`);
  },
  saveProfile: () => { const p = P(), n = $('#e-name').value.trim(); if (!n) return; p.name = n; p.email = $('#e-email').value.trim(); p.phone = $('#e-phone').value.trim(); if (window._av) { p.avatar = window._av; window._av = null; } S.commit(); closeSheets(); toast('Dados atualizados.'); render(); },
  askPerm: async () => { try { await Notification.requestPermission(); } catch {} render(); },
  testPush: () => showPush({ title: 'Um pequeno momento para você', body: 'Como está se sentindo hoje?', type: 'registro' }),
  muteAll: () => { const p = P(); Object.keys(p.prefs).forEach(k => p.prefs[k] = false); S.commit(); toast('Lembretes desativados.', 'bell'); render(); },
  exportData: () => {
    const p = P(), id = p.id, s = S.get(), out = { paciente: p, fotos: s.photos.filter(x => x.patientId === id), checkins: s.checkins.filter(x => x.patientId === id), diario: s.journal.filter(x => x.patientId === id), feedbacks: s.feedbacks.filter(x => x.patientId === id), contatos: s.contacts.filter(x => x.patientId === id), consultas: s.appointments.filter(x => x.patientId === id) };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })); a.download = 'meus-dados-fa-essencia.json'; a.click(); toast('Seus dados foram baixados.', 'download');
  },
  wipePersonal: () => sheet(`<h3 style="font-size:28px;margin-bottom:8px">Excluir fotos e notas?</h3><p class="muted" style="margin-bottom:22px">Todas as suas fotos, registros do diário e notas serão removidos definitivamente.</p><div style="display:flex;gap:10px"><button class="btn ghost" style="flex:1" data-act="closeSheet">Cancelar</button><button class="btn danger" style="flex:1" data-act="confirmWipe">Excluir tudo</button></div>`, { center: true }),
  confirmWipe: () => { const id = P().id, s = S.get(); s.photos = s.photos.filter(x => x.patientId !== id); s.journal = s.journal.filter(x => x.patientId !== id); S.commit(); closeSheets(); toast('Registros pessoais excluídos.', 'trash'); },
  deleteAccount: () => sheet(`<h3 style="font-size:28px;margin-bottom:8px">Excluir minha conta?</h3><p class="muted" style="margin-bottom:22px">Seus dados serão removidos deste app. A clínica pode manter o prontuário clínico conforme a legislação aplicável.</p><div style="display:flex;gap:10px"><button class="btn ghost" style="flex:1" data-act="closeSheet">Cancelar</button><button class="btn danger" style="flex:1" data-act="confirmDelete">Excluir conta</button></div>`, { center: true }),
  confirmDelete: () => { const id = P().id, s = S.get(); ['photos', 'checkins', 'feedbacks', 'contacts', 'journal', 'messages', 'notifications', 'appointments', 'notes'].forEach(c => s[c] = s[c].filter(x => x.patientId !== id)); s.patients = s.patients.filter(p => p.id !== id); S.setPatientSession(null); S.commit(); closeSheets(); location.hash = '#/welcome'; },
};
function saveNote() { const t = $('#n-note'); if (t) draft.note = t.value; }
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && A[el.dataset.act]) { e.preventDefault(); A[el.dataset.act](el, e); } });
document.addEventListener('submit', e => {
  if (e.target.id !== 'f-cad') return; e.preventDefault();
  const name = $('#c-name').value.trim(), date = $('#c-date').value, err = $('#c-err');
  const bad = !name ? 'Conte-nos seu nome para personalizarmos seu espaço.' : !date ? 'Informe a data do procedimento.' : date > isoDay() ? 'A data do procedimento não pode ser no futuro.' : !$('#c-lgpd').checked ? 'Para continuar, precisamos do seu consentimento para o tratamento dos dados.' : '';
  if (bad) { err.textContent = bad; err.hidden = false; return; }
  ob = { ...ob, name, procedure: $('#c-proc').value, procDate: date, doctor: $('#c-doc').value, lgpd: true, photosStaff: $('#c-photos').checked };
  location.hash = '#/intro';
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'f-avatar' || t.id === 'e-avatar') { const f = t.files[0]; if (!f) return; try { const d = await compressImage(f, 300, .8); if (t.id === 'f-avatar') { ob = { ...ob, name: $('#c-name').value, avatar: d }; render(); } else { window._av = d; const lb = t.closest('label'); lb.innerHTML = `<img alt="" src="${d}">`; lb.append(t); } } catch { toast('Não foi possível ler a imagem.', 'alert'); } }
  if (t.id === 'f-cam' || t.id === 'f-gal') { const f = t.files[0]; if (!f) return; try { draft.photo = await compressImage(f); render(); } catch { toast('Não foi possível ler a imagem.', 'alert'); } }
  if (t.id === 'cmp-a') { cmp.a = t.value; render(); } if (t.id === 'cmp-b') { cmp.b = t.value; render(); }
  if (t.dataset.pref) { P().prefs[t.dataset.pref] = t.checked; S.commit(); toast(t.checked ? 'Lembrete ativado.' : 'Lembrete desativado.', 'bell'); }
  if (t.dataset.consent) { P().consent[t.dataset.consent] = t.checked; S.commit(); toast(t.checked ? 'Autorização concedida.' : 'Autorização retirada.', 'lock'); }
});

/* ---------- notificações em app + sistema ---------- */
function showPush(n) {
  $('.push')?.remove(); const d = document.createElement('div'); d.className = 'push'; d.innerHTML = `<span class="lg">FA</span><div><b>FA Essência · agora</b><b style="font-weight:600;color:#fff;margin-top:2px">${esc(n.title)}</b><span>${esc(n.body)}</span></div>`;
  d.onclick = () => { d.remove(); location.hash = '#/notificacoes'; }; document.body.append(d); setTimeout(() => d.remove(), 6000);
}
function pollPush() {
  const p = P(); if (!p) return; let pushed = []; try { pushed = JSON.parse(sessionStorage.getItem('fa_pushed') || '[]'); } catch {}
  const n = S.dueNotifications(p.id).find(x => !x.read && !pushed.includes(x.id)); if (!n) return;
  pushed.push(n.id); try { sessionStorage.setItem('fa_pushed', JSON.stringify(pushed)); } catch {}
  showPush(n);
  try { if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification(n.title, { body: n.body, icon: 'icon.svg' }); } catch {}
}

/* ---------- boot ---------- */
render();
setTimeout(() => $('#splash').classList.add('out'), 1500);
setTimeout(pollPush, 2600); setInterval(pollPush, 30000);
