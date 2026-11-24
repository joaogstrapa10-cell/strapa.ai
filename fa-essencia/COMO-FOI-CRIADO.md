# Como o FA Essência foi criado

Roteiro para apresentar o projeto: do problema ao produto.

## 1. Problema (pesquisa de Design Thinking)
Na análise do CRM da Clínica FA, 53,7% das pacientes que já fizeram procedimento estão paradas na fase "Pós tratamento", e "sem resposta" é o principal motivo de desistência (44%). Hipótese: o acompanhamento depende de ação manual da equipe e falha em etapas críticas.

## 2. Conceito
"A clínica não acompanha apenas o procedimento. Acompanha a paciente." Um diário privado de autocuidado, com a equipe sempre por perto.

## 3. Design
- Paleta da marca: ivory, areia, taupe, marrom suave, verde oliva, grafite.
- Tipografia: Cormorant Garamond (títulos) + Manrope (interface).
- Sem rosa saturado, sem aparência hospitalar, sem gamificação, sem "antes e depois".
- Tokens e componentes em `css/base.css` (design system).

## 4. Produto
- **App da paciente** (`index.html`): onboarding, Início, Minha evolução (álbum privado), Meu diário (check-in e feedback), Cuidados, Perfil, contato por WhatsApp.
- **Painel da equipe** (`admin.html`): visão geral, "Precisa de atenção", pacientes, lembretes, orientações com aprovação, configurações.
- **Peças de lançamento** (`launch/`): Story, Post, tela in-app, convite de WhatsApp.

## 5. Decisões
- Alertas calculados por regras (`js/store.js`, função `alertsFor`): pediu contato, dúvida, feedback ≤ 2 estrelas, retorno pendente, etapa vencida, sem interação por N dias (configurável).
- Orientações clínicas só aparecem se **aprovadas** pela equipe médica; nada de condutas inventadas.
- Privacidade (LGPD): consentimento no cadastro, fotos só visíveis à equipe se a paciente autorizar, exportar e excluir dados.
- Os intervalos da jornada (dias 0, 1, 3, 7, 15, 30) são configuráveis pela clínica.

## 6. Tecnologia
HTML, CSS e JavaScript puros (sem build), mobile-first. Dados da demo em `localStorage` (fictícios). Banco real preparado em `supabase/schema.sql` (tabelas, RLS, Storage privado), ainda não conectado.

## 7. Como mostrar
Abra `index.html` (entre como Mariana Duarte) e `admin.html` (senha `fa2026`) lado a lado: um check-in "quero conversar" no app vira alerta no painel.
