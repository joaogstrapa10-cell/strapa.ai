# FA ESSÊNCIA — Clínica FA

> Seu cuidado continua. Sua beleza, naturalmente.

App web mobile-first de acompanhamento pós-procedimento + painel interno da equipe.

## Como abrir
Sem build. Sirva a pasta com qualquer servidor estático (módulos ES exigem http, não `file://`):

```bash
cd fa-essencia && python3 -m http.server 8000
```
- App da paciente: `http://localhost:8000/index.html` (em desktop aparece em moldura de celular)
- Painel da equipe: `http://localhost:8000/admin.html` — senha demo **fa2026**
- Peças de lançamento: `launch/index.html` (PNGs prontos em `launch/peca-1..4.png`)

Abra o app e o painel em abas diferentes: os dados são compartilhados e atualizam em tempo real
(check-in "quero conversar" na paciente → alerta no painel → "Registrar contato realizado" resolve).

## Estrutura
- `css/base.css` design system (tokens, botões, cards, chips, sheets, skeleton) · `app.css` · `admin.css`
- `js/store.js` camada de dados + regras de alerta · `js/app.js` paciente · `js/admin.js` equipe
- `supabase/schema.sql` banco real: tabelas, RLS, Storage privado, consentimentos (LGPD)

## Estado atual (honesto)
- **Demo funcional** usa `localStorage` com dados fictícios. Login demo, sem e-mail/SMS reais.
- **Produção:** `supabase/schema.sql` está pronto, mas **ainda não foi aplicado nem ligado** ao front-end.
  Falta trocar `js/store.js` por um adaptador Supabase (Auth por link mágico, Storage com URLs assinadas, Realtime).
- Lembretes: aparecem no app (banner + central) e como Notification do navegador se permitido.
  Push com o app fechado exige Service Worker + Web Push/servidor.
- WhatsApp: abre `wa.me` com mensagem contextual. O número em Configurações é **placeholder** (5541999990000).
- Orientações clínicas: textos seed são neutros e de demonstração; só aparecem para a paciente se **aprovados** pela equipe médica.

## Identidade
Ícone e símbolo em `brand/` (`icon-1024.png` para as lojas, `icon-rounded-1024.png`, `symbol.svg`).
