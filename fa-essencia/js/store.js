// Camada de dados — adaptador LOCAL (localStorage) para demonstração.
// A mesma estrutura de entidades existe em supabase/schema.sql (tabelas, RLS, Storage privado).
// Para produção, troque este módulo por um adaptador Supabase mantendo a mesma API.
import { uid, isoDay, addDays, art } from './util.js';

const KEY = 'fa_essencia_db_v1', SKP = 'fa_essencia_patient_session', SKS = 'fa_essencia_staff_session';
let state, subs = new Set();

export const PROCEDURES = ['Preenchimento labial', 'Preenchimento de mento', 'Preenchimento de olheira', 'Toxina botulínica (Botox)', 'Bioestimulador de colágeno', 'Skinbooster', 'Microagulhamento'];
export const DOCTORS = ['Dra. Francine Almeida', 'Dra. Inaiara'];
export const NOTIF_TYPES = {
  registro: 'Hora de registrar sua evolução', orientacao: 'Orientações enviadas pela médica', retorno: 'Data de retorno',
  consulta: 'Consulta agendada', checkin: 'Check-in de acompanhamento', carinho: 'Mensagens de carinho da equipe'
};
export const STATUS = { novo: 'Novo acesso', em_acompanhamento: 'Em acompanhamento', retorno_pendente: 'Retorno pendente', concluido: 'Acompanhamento concluído' };
export const GUIDE_CATS = ['Orientações pós-procedimento', 'Cuidados específicos', 'O que evitar', 'Processo de recuperação', 'Próximas etapas', 'Dúvidas frequentes', 'Quando falar com a clínica'];

const iso = (daysAgo, h = 10, m = 0) => { const d = addDays(new Date(), -daysAgo); d.setHours(h, m, 0, 0); return d.toISOString(); };
const day = n => isoDay(addDays(new Date(), -n));

function seed() {
  const P = (id, name, proc, daysAgo, doc, status, extra = {}) => ({
    id, name, email: name.split(' ')[0].toLowerCase() + '@exemplo.com', phone: '(41) 99999-0' + id.slice(-3), avatar: '', status, createdAt: iso(daysAgo),
    procedures: [{ id: uid('pr'), name: proc, date: day(daysAgo), doctor: doc }],
    doctor: doc, nextStep: '', nextStepDate: '', followUpUntil: '',
    prefs: { registro: true, orientacao: true, retorno: true, consulta: true, checkin: true, carinho: true },
    consent: { health: true, photosStaff: true, reminders: true, at: iso(daysAgo) },
    seenLaunch: true, demo: true, ...extra
  });
  const patients = [
    P('pat_001', 'Mariana Duarte', 'Preenchimento labial', 3, DOCTORS[0], 'em_acompanhamento', { nextStep: 'Check-in do dia 7', nextStepDate: day(-4) }),
    P('pat_002', 'Camila Rocha', 'Toxina botulínica (Botox)', 8, DOCTORS[1], 'em_acompanhamento', { nextStep: 'Ligar para entender a dúvida', nextStepDate: day(0) }),
    P('pat_003', 'Beatriz Lima', 'Bioestimulador de colágeno', 16, DOCTORS[0], 'em_acompanhamento'),
    P('pat_004', 'Juliana Prado', 'Preenchimento de mento', 31, DOCTORS[0], 'retorno_pendente', { nextStep: 'Agendar retorno', nextStepDate: day(2) }),
    P('pat_005', 'Fernanda Alves', 'Skinbooster', 6, DOCTORS[1], 'em_acompanhamento'),
    P('pat_006', 'Larissa Menezes', 'Microagulhamento', 12, DOCTORS[1], 'em_acompanhamento'),
    P('pat_007', 'Renata Souza', 'Preenchimento de olheira', 45, DOCTORS[0], 'concluido', { procedures: [{ id: uid('pr'), name: 'Preenchimento de olheira', date: day(45), doctor: DOCTORS[0] }, { id: uid('pr'), name: 'Skinbooster', date: day(200), doctor: DOCTORS[0] }] }),
    P('pat_008', 'Patrícia Gomes', 'Toxina botulínica (Botox)', 1, DOCTORS[0], 'em_acompanhamento'),
  ];
  const photos = [
    { id: uid('ph'), patientId: 'pat_001', date: day(2), at: iso(2, 20), note: 'Primeiro registro. Me senti bem tranquila hoje.', src: art(1), day: 1 },
    { id: uid('ph'), patientId: 'pat_003', date: day(15), at: iso(15, 19), note: 'Registro de acompanhamento.', src: art(2), day: 1 },
    { id: uid('ph'), patientId: 'pat_003', date: day(9), at: iso(9, 19), note: '', src: art(3), day: 7 },
    { id: uid('ph'), patientId: 'pat_007', date: day(44), at: iso(44, 18), note: 'Primeiro dia.', src: art(0), day: 1 },
  ];
  const checkins = [
    { id: uid('ck'), patientId: 'pat_001', kind: 'bem', at: iso(2, 20, 5), handled: true },
    { id: uid('ck'), patientId: 'pat_002', kind: 'conversar', at: iso(0, 8, 40), handled: false },
    { id: uid('ck'), patientId: 'pat_006', kind: 'duvidas', note: 'Estou com uma dúvida sobre o que posso usar na pele nos próximos dias.', at: iso(1, 21), handled: false },
    { id: uid('ck'), patientId: 'pat_003', kind: 'bem', at: iso(9, 19, 10), handled: true },
    { id: uid('ck'), patientId: 'pat_008', kind: 'bem', at: iso(0, 9), handled: true },
  ];
  const feedbacks = [
    { id: uid('fb'), patientId: 'pat_003', rating: 2, comment: 'Fiquei alguns dias sem retorno depois do procedimento e me senti um pouco perdida.', at: iso(4, 14), handled: false },
    { id: uid('fb'), patientId: 'pat_007', rating: 5, comment: 'Atendimento incrível, me senti muito acolhida.', at: iso(30, 11), handled: true },
    { id: uid('fb'), patientId: 'pat_001', rating: 5, comment: 'Equipe muito atenciosa.', at: iso(2, 20, 20), handled: true },
  ];
  const contacts = [
    { id: uid('ct'), patientId: 'pat_002', direction: 'patient', channel: 'whatsapp', kind: 'medica', note: 'Quero falar com minha médica', at: iso(0, 8, 41), handled: false },
    { id: uid('ct'), patientId: 'pat_001', direction: 'clinic', channel: 'whatsapp', kind: 'acompanhamento', note: 'Mensagem de boas-vindas enviada.', at: iso(3, 9), handled: true, by: 'Equipe Clínica FA' },
    { id: uid('ct'), patientId: 'pat_007', direction: 'clinic', channel: 'telefone', kind: 'acompanhamento', note: 'Retorno de acompanhamento concluído.', at: iso(30, 15), handled: true, by: 'Equipe Clínica FA' },
    { id: uid('ct'), patientId: 'pat_005', direction: 'clinic', channel: 'whatsapp', kind: 'acompanhamento', note: 'Orientações enviadas após o procedimento.', at: iso(6, 17), handled: true, by: 'Equipe Clínica FA' },
    { id: uid('ct'), patientId: 'pat_004', direction: 'clinic', channel: 'whatsapp', kind: 'acompanhamento', note: 'Contato sobre janela de retorno.', at: iso(14, 11), handled: true, by: 'Equipe Clínica FA' },
  ];
  const journal = [
    { id: uid('jr'), patientId: 'pat_001', tag: 'Sensação', text: 'Hoje acordei me sentindo leve e curiosa para ver como tudo se assenta.', share: false, at: iso(1, 22), handled: true },
  ];
  const messages = [
    { id: uid('ms'), patientId: 'pat_001', text: 'Cada pessoa tem seu próprio tempo. Se tiver alguma dúvida sobre como está se sentindo, estamos aqui para conversar.', by: 'Dra. Francine', at: iso(2, 18) },
  ];
  const notifications = [
    { id: uid('nt'), patientId: 'pat_001', type: 'registro', title: 'Um pequeno momento para você', body: 'Como está se sentindo hoje? Se quiser, registre um novo momento da sua evolução.', at: iso(0, 7), read: false, source: 'auto' },
    { id: uid('nt'), patientId: 'pat_004', type: 'retorno', title: 'Seu acompanhamento está passando por uma nova etapa', body: 'Estamos por aqui. Vamos combinar seu retorno?', at: addDays(new Date(), 1).toISOString(), read: false, source: 'staff' },
  ];
  const appointments = [
    { id: uid('ap'), patientId: 'pat_001', title: 'Retorno com a Dra. Francine', date: day(-27), time: '15:00', kind: 'retorno' },
    { id: uid('ap'), patientId: 'pat_003', title: 'Consulta de acompanhamento', date: day(-10), time: '10:30', kind: 'consulta' },
  ];
  const notes = [
    { id: uid('nn'), patientId: 'pat_002', text: 'Paciente demonstrou interesse em conversar com a Dra. Inaiara. Priorizar ligação.', by: 'Equipe Clínica FA', at: iso(0, 9) },
  ];
  const guidance = seedGuidance();
  return {
    v: 1,
    clinic: { name: 'Clínica FA', doctor: 'Dra. Francine Almeida', city: 'Curitiba', whatsapp: '5541999990000', maxDaysNoContact: 4, adminPass: 'fa2026' },
    checkpoints: [{ day: 0, label: 'Procedimento' }, { day: 1, label: 'Primeiro registro' }, { day: 3, label: 'Novo registro' }, { day: 7, label: 'Registro de evolução' }, { day: 15, label: 'Acompanhamento' }, { day: 30, label: 'Registro final da etapa' }],
    patients, photos, checkins, feedbacks, contacts, journal, messages, notifications, appointments, notes, guidance
  };
}

function seedGuidance() {
  const out = [];
  const add = (procedure, category, title, body) => out.push({ id: uid('gd'), procedure, category, title, body, approved: true, approvedBy: 'Dra. Francine Almeida', approvedAt: new Date().toISOString(), demo: true });
  const common = [
    ['Orientações pós-procedimento', 'Siga o que sua médica orientou', 'No dia do procedimento, sua médica passou as orientações específicas para o seu caso. Siga exatamente o que foi combinado com ela e, se algo não estiver claro, pergunte à equipe antes de decidir por conta própria.'],
    ['O que evitar', 'Confirme antes de decidir', 'Sobre produtos, atividades, medicamentos ou rotinas: não decida sozinha. Confirme com a equipe o que é adequado para você neste momento.'],
    ['Processo de recuperação', 'Cada pessoa tem seu próprio tempo', 'O seu processo é individual e pode ser diferente do de outras pessoas. Registre como você se sente no diário — isso ajuda a equipe a acompanhar você de perto.'],
    ['Próximas etapas', 'Seu acompanhamento', 'Os registros de evolução e os check-ins deste app acontecem nos momentos definidos pela clínica para você. A equipe também pode combinar seu retorno por aqui.'],
    ['Dúvidas frequentes', 'Posso registrar fotos aqui?', 'Sim. Suas fotos ficam em um álbum privado, visível apenas para você e — somente se você autorizar — para a equipe médica da Clínica FA. Elas nunca são compartilhadas ou usadas em divulgação.'],
    ['Dúvidas frequentes', 'Como falo com a equipe?', 'Pelo botão “Falar com a equipe”, que abre uma conversa no WhatsApp da clínica já com uma mensagem inicial.'],
    ['Quando falar com a clínica', 'Sempre que precisar', 'Fale com a equipe sempre que tiver dúvida, perceber algo diferente do que você esperava ou simplesmente quiser conversar. Em caso de urgência, procure atendimento médico imediatamente.'],
  ];
  PROCEDURES.forEach(p => {
    common.forEach(c => add(p, c[0], c[1], c[2]));
    add(p, 'Cuidados específicos', `Cuidados com ${p.toLowerCase()}`, 'As orientações específicas deste procedimento são definidas e aprovadas pela equipe médica da Clínica FA. Elas aparecerão aqui assim que forem cadastradas; enquanto isso, siga o que sua médica explicou presencialmente.');
  });
  return out;
}

// ---------- núcleo ----------
export function load() {
  try { const r = localStorage.getItem(KEY); state = r ? JSON.parse(r) : null; } catch { state = null; }
  if (!state) { state = seed(); persist(); }
  return state;
}
export const get = () => state || load();
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; } }
export function commit() { const ok = persist(); subs.forEach(f => f()); return ok; }
export const subscribe = f => { subs.add(f); return () => subs.delete(f); };
window.addEventListener('storage', e => { if (e.key === KEY && e.newValue) { try { state = JSON.parse(e.newValue); subs.forEach(f => f()); } catch {} } });
export function resetDemo() { state = seed(); commit(); }

// ---------- sessões ----------
export const patientSession = () => { try { return localStorage.getItem(SKP) || null; } catch { return null; } };
export const setPatientSession = id => { try { id ? localStorage.setItem(SKP, id) : localStorage.removeItem(SKP); } catch {} };
export const staffSession = () => { try { return localStorage.getItem(SKS) === '1'; } catch { return false; } };
export const setStaffSession = v => { try { v ? localStorage.setItem(SKS, '1') : localStorage.removeItem(SKS); } catch {} };

// ---------- consultas ----------
export const patientById = id => get().patients.find(p => p.id === id);
export const forPatient = (col, id) => get()[col].filter(x => x.patientId === id);
export const currentProc = p => p.procedures[0];
export const guidanceFor = proc => get().guidance.filter(g => g.procedure === proc && g.approved);

export function createPatient({ name, avatar, procDate, procedure, doctor, consent }) {
  const id = uid('pat');
  const p = {
    id, name, email: '', phone: '', avatar: avatar || '', status: 'novo', createdAt: new Date().toISOString(),
    procedures: [{ id: uid('pr'), name: procedure, date: procDate, doctor }], doctor, nextStep: '', nextStepDate: '', followUpUntil: '',
    prefs: { registro: true, orientacao: true, retorno: true, consulta: true, checkin: true, carinho: true },
    consent: { health: true, photosStaff: !!consent?.photosStaff, reminders: true, at: new Date().toISOString() }, seenLaunch: false, demo: false
  };
  get().patients.push(p);
  get().contacts.push({ id: uid('ct'), patientId: id, direction: 'clinic', channel: 'app', kind: 'acompanhamento', note: 'Acesso ao FA Essência criado.', at: new Date().toISOString(), handled: true, by: 'Sistema' });
  commit();
  return p;
}

// ---------- lógica de acompanhamento (alertas, última interação, etapa) ----------
export function lastInteraction(p) {
  const s = get(), id = p.id;
  const ts = [
    ...s.photos.filter(x => x.patientId === id).map(x => x.at), ...s.checkins.filter(x => x.patientId === id).map(x => x.at),
    ...s.feedbacks.filter(x => x.patientId === id).map(x => x.at), ...s.journal.filter(x => x.patientId === id && x.share).map(x => x.at),
    ...s.contacts.filter(x => x.patientId === id).map(x => x.at), p.createdAt
  ].filter(Boolean).sort();
  return ts[ts.length - 1];
}
export function lastPatientActivity(p) {
  const s = get(), id = p.id;
  const ts = [...s.photos.filter(x => x.patientId === id).map(x => x.at), ...s.checkins.filter(x => x.patientId === id).map(x => x.at), ...s.feedbacks.filter(x => x.patientId === id).map(x => x.at), ...s.journal.filter(x => x.patientId === id).map(x => x.at)].sort();
  return ts[ts.length - 1] || null;
}
export const isActive = p => p.status !== 'concluido';

export function alertsFor(p) {
  const s = get(), id = p.id, out = [], today = isoDay();
  if (!isActive(p)) return out;
  s.contacts.filter(c => c.patientId === id && c.direction === 'patient' && !c.handled).forEach(c => out.push({ type: 'contato', sev: 3, label: 'Solicitou contato', detail: c.note, at: c.at, ref: c.id }));
  s.checkins.filter(c => c.patientId === id && !c.handled && (c.kind === 'duvidas' || c.kind === 'conversar')).forEach(c => out.push({ type: 'preocupacao', sev: 3, label: c.kind === 'conversar' ? 'Quer conversar com a equipe' : 'Registrou uma dúvida', detail: c.note || '', at: c.at, ref: c.id }));
  s.journal.filter(j => j.patientId === id && j.share && !j.handled && j.tag === 'Dúvida').forEach(j => out.push({ type: 'preocupacao', sev: 3, label: 'Dúvida compartilhada no diário', detail: j.text, at: j.at, ref: j.id }));
  s.feedbacks.filter(f => f.patientId === id && !f.handled && f.rating <= 2).forEach(f => out.push({ type: 'negativo', sev: 3, label: `Feedback negativo (${f.rating}★)`, detail: f.comment, at: f.at, ref: f.id }));
  if (p.status === 'retorno_pendente') out.push({ type: 'pendente', sev: 2, label: 'Retorno pendente', detail: p.nextStep || '', at: p.createdAt });
  if (p.nextStepDate && p.nextStepDate < today) out.push({ type: 'pendente', sev: 2, label: 'Etapa do acompanhamento vencida', detail: p.nextStep, at: p.nextStepDate });
  const li = lastInteraction(p), daysSince = Math.floor((Date.now() - new Date(li)) / 864e5);
  if (daysSince >= s.clinic.maxDaysNoContact) out.push({ type: 'silencio', sev: 1, label: `Sem interação há ${daysSince} dias`, detail: '', at: li });
  return out.sort((a, b) => b.sev - a.sev);
}
export const handleAll = id => {
  const s = get();
  ['checkins', 'feedbacks', 'contacts', 'journal'].forEach(col => s[col].forEach(x => { if (x.patientId === id) x.handled = true; }));
};
export function dueNotifications(patientId) {
  const s = get(), p = patientById(patientId), now = Date.now();
  return s.notifications.filter(n => n.patientId === patientId && new Date(n.at) <= now && (n.source === 'staff' ? true : p.prefs[n.type] !== false) && p.prefs[n.type] !== false).sort((a, b) => new Date(b.at) - new Date(a.at));
}
export const pendingReminders = () => get().notifications.filter(n => new Date(n.at) > Date.now() && !n.read);

export function addNotification(patientId, type, title, body, atIso, source = 'staff') {
  get().notifications.push({ id: uid('nt'), patientId, type, title, body, at: atIso || new Date().toISOString(), read: false, source });
}
export function logContact(patientId, direction, channel, kind, note, by) {
  get().contacts.push({ id: uid('ct'), patientId, direction, channel, kind, note, at: new Date().toISOString(), handled: direction === 'clinic', by });
}
