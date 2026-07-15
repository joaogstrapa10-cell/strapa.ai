# Plano de lançamento Meta Ads — Strapa.ai

> Criado em 2026-07-10. Primeira campanha da marca. Objetivo: colocar a
> Strapa.ai na frente de pequenos e médios empresários de Curitiba,
> gerar visitas ao perfil do Instagram e, na fase 2, tráfego pro site.

---

## 1. Decisões principais (resumo)

| Pergunta | Decisão |
|---|---|
| Quantas campanhas? | **1 campanha principal** agora (visitas ao perfil), não 3. Reconhecimento vem de tabela. |
| Quantos públicos? | **3 conjuntos de anúncios:** Aberto, Interesses, Bairros nobres. |
| Quantos criativos? | **4 variações estáticas**, as mesmas nos 3 conjuntos. |
| Onde? | Só **Curitiba** (pessoas que moram na cidade). |
| Tráfego pro site? | **Fase 2.** Só depois que o site estiver no ar com Pixel instalado. |
| Antes de anunciar? | Publicar **3 posts no feed**. Anúncio levando pra perfil vazio queima verba. |

### Por que não subir campanha de Reconhecimento separada

Campanha de Reconhecimento (alcance) otimiza pra mostrar o anúncio pro
máximo de gente, sem se importar se a pessoa clica ou visita o perfil.
Com verba pequena e marca nova, isso vira impressão barata que não deixa
rastro. A campanha de visitas ao perfil já gera reconhecimento como
efeito colateral, e ainda entrega gente dentro do perfil. Uma campanha,
verba concentrada, aprendizado mais rápido.

---

## 2. Pré-requisitos (setup da conta, na ordem)

Nada disso dá pra fazer pelo Claude: não existe conexão direta com a
Meta nesta sessão. O caminho é fazer no navegador, seguindo esta ordem:

1. **Instagram profissional.** No app: Configurações > Tipo de conta >
   Mudar para conta profissional. Categoria: Serviço de marketing.
   Bio e nome conforme `marketing/perfil-instagram.md`.
2. **Página do Facebook.** Criar página "Strapa.ai" (obrigatória pra
   anunciar). Mesma foto de perfil (logo-icon) e mesma bio resumida.
3. **Vincular Instagram à Página.** Na Página: Configurações > Contas
   vinculadas > Instagram.
4. **Portfólio de negócios.** Em business.facebook.com, criar o
   portfólio (antigo Business Manager) com o e-mail da marca.
5. **Conta de anúncios.** Dentro do portfólio: Configurações >
   Contas > Contas de anúncios > Criar. Moeda BRL, fuso
   America/Sao_Paulo (isso não pode ser trocado depois).
6. **Pagamento.** Adicionar cartão em Configurações de pagamento.
   Ativar autenticação de dois fatores no perfil pessoal (a Meta exige
   e contas novas sem 2FA caem em bloqueio com facilidade).
7. **Publicar os 3 primeiros posts** (plano abaixo) antes de ativar
   qualquer anúncio.
8. **Fase 2, quando o site subir:** criar o Pixel (Gerenciador de
   Eventos > Conjunto de dados) e instalar no site antes da campanha
   de tráfego.

**Aviso de conta nova:** conta de anúncios recém-criada tem limite de
gasto diário baixo e passa por análise nos primeiros anúncios. Começar
com verba modesta e sem editar a campanha toda hora ajuda a não cair em
bloqueio automático.

---

## 3. Antes dos anúncios: os 3 posts de abertura

Sequência já definida em `marketing/perfil-instagram.md`:

1. **Apresentação** — carrossel "Prazer, Strapa.ai" (quem é, o que faz, pra quem)
2. **Educativo** — carrossel "3 sinais de que teu negócio tá perdendo cliente na internet"
3. **Oferta/serviço** — "O que a Strapa.ai faz por um negócio de bairro"

Mínimo pra ligar a campanha: posts 1 e 2 publicados. Ideal: os 3.
Quem clica no anúncio e visita o perfil precisa encontrar conteúdo que
confirme a promessa do anúncio em 5 segundos.

---

## 4. Estrutura da campanha principal

**Campanha: STR | Visitas ao perfil | Curitiba**

- **Objetivo no Gerenciador:** Tráfego
- **Local de conversão:** Perfil do Instagram
- **Orçamento:** no nível do conjunto (ABO), não no da campanha.
  Motivo: é teste de público. Com orçamento na campanha (CBO) a Meta
  joga tudo num conjunto só e os outros dois não aprendem nada.
- **Posicionamentos:** Advantage+ (automático). Feed e Stories dominam
  sozinhos; não vale restringir no começo.

### Conjunto 1 — Aberto

| Campo | Valor |
|---|---|
| Local | Curitiba, PR (pessoas que moram neste local) |
| Idade | 25 a 55 |
| Gênero | Todos |
| Interesses | Nenhum (deixar aberto) |
| Público Advantage+ | Ativado |

É o conjunto que dá liberdade total pro algoritmo. Em 2026 costuma ser
o que entrega mais barato depois de alguns dias de aprendizado. Serve de
régua pra comparar com os outros dois.

### Conjunto 2 — Interesses (empresários e empreendedorismo)

| Campo | Valor |
|---|---|
| Local | Curitiba, PR (pessoas que moram neste local) |
| Idade | 28 a 55 |
| Gênero | Todos |
| Direcionamento detalhado | Ver lista abaixo |

Buscar na caixa de direcionamento detalhado (os nomes podem variar um
pouco, usar o mais próximo):

- Comportamento: **Pequenos empresários** (small business owners)
- Comportamento: **Administradores de Página do Facebook** (todas ou "de negócios")
- Interesse: **Empreendedorismo**
- Interesse: **Pequenas e médias empresas**
- Interesse: **Negócios**
- Interesse: **Marketing digital**

Marcar todos como "OU" (qualquer um deles), não como restrição em
camadas. Público estimado deve ficar entre 150 e 400 mil. Se cair muito
abaixo de 100 mil, tirar o direcionamento mais restritivo.

### Conjunto 3 — Bairros nobres

| Campo | Valor |
|---|---|
| Local | Alfinetes (pins) com raio de 1 a 2 km, ver lista |
| Idade | 28 a 60 |
| Gênero | Todos |
| Interesses | Nenhum (o filtro aqui é geográfico) |

No campo de localização, soltar alfinete (opção "soltar alfinete" no
mapa) nos bairros, raio de 1 a 2 km em cada:

- Batel
- Bigorrilho / Champagnat
- Água Verde
- Ecoville (Mossunguê / Campo Comprido)
- Cabral
- Juvevê / Hugo Lange
- Jardim Social / Alto da XV

Selecionar "pessoas que moram neste local" (senão pega quem só passa ou
trabalha ali). Público menor e CPM mais caro que os outros dois; é
esperado. A aposta é qualidade: dono de clínica, salão e comércio dessas
regiões com mais verba pra contratar.

**Exclusão nos 3 conjuntos:** nenhuma por enquanto. Quando a base
crescer, excluir quem já segue o perfil.

---

## 5. Criativos: quantos e quais

**Resposta direta: subir 4 variações estáticas, as mesmas nos 3
conjuntos.** Um criativo só é aposta cega: se o anúncio for fraco, o
teste inteiro morre junto e a fadiga chega em poucos dias. Quatro
variações deixam a Meta distribuir a verba pro que funciona, e como os
3 conjuntos rodam os mesmos criativos, a comparação entre públicos fica
limpa (a variável é só o público).

Formato: **1080x1350 (4:5)** pro feed. A Meta adapta pro Stories; se
algum criativo vencer com folga, fazer a versão 1080x1920 dedicada.
Produção conforme regra da marca: SVG editável no Figma, paleta
`#0B1A2F` / `#2E6BFF` / `#F5F8FF`, Space Grotesk + Inter, sem emoji.

### V1 — Dor do concorrente

- Kicker: NEGÓCIO LOCAL, CURITIBA
- Headline: **Teu concorrente aparece na internet. Teu negócio não.**
- Apoio: Site, Instagram e WhatsApp arrumados pra quem já procura o que você vende.
- CTA: Ver como funciona

### V2 — Oferta concreta

- Kicker: STRAPA.AI
- Headline: **Site no ar, Instagram arrumado e WhatsApp respondendo. Sem contratar equipe.**
- Apoio: Presença digital completa pra negócio de bairro, com preço de negócio de bairro.
- CTA: Conhecer a Strapa.ai

### V3 — Autoridade local

- Kicker: CURITIBA E REGIÃO
- Headline: **IA pra negócios de Curitiba. Sem complicação e sem preço de agência grande.**
- Apoio: Quem procura na internet encontra teu negócio pronto: site, perfil e atendimento.
- CTA: Ver o perfil

### V4 — Checklist (espelha o post educativo)

- Kicker: TESTE RÁPIDO
- Headline: **3 sinais de que teu negócio tá perdendo cliente na internet.**
- Apoio: Se um deles for verdade aí, a solução é mais simples e mais barata do que parece.
- CTA: Ver os 3 sinais

### Texto do anúncio (legenda, igual pros 4)

> Todo dia tem gente em Curitiba procurando o que o teu negócio vende.
> Se ela não te encontra, compra do concorrente.
>
> A Strapa.ai arruma isso: site, Instagram e atendimento no WhatsApp,
> tudo feito com IA e preço que negócio de bairro paga.
>
> Toca no perfil e veja como funciona.

---

## 6. Orçamento e regras de decisão

**Verba de teste sugerida: R$ 15/dia por conjunto (R$ 45/dia no total),
por 7 a 10 dias.** Total do teste: R$ 315 a 450. Se apertar, dá pra
rodar com R$ 10/dia por conjunto, aceitando aprendizado mais lento.

### Depois de 7 a 10 dias

1. **Desligar** o conjunto com custo por visita ao perfil claramente
   pior (regra prática: 2x mais caro que o melhor).
2. **Realocar** a verba dele pros conjuntos vencedores.
3. **Pausar** dentro de cada conjunto os criativos que quase não
   receberam entrega ou têm CTR muito abaixo dos irmãos.
4. Não editar nada nos primeiros 3 a 4 dias: cada edição reinicia o
   aprendizado do conjunto.

### Referências pra avaliar (mercado local BR, ordem de grandeza)

- CPM: R$ 8 a 25 (bairros nobres pode passar disso)
- CTR (todos os cliques): acima de 1% é saudável pra estático
- Custo por visita ao perfil: até R$ 1,00 bom, acima de R$ 2,50 ruim
- Sinal de qualidade real: seguidores novos e mensagens no WhatsApp/direct

---

## 7. Fase 2 — Tráfego pro site (quando o site subir)

O site já existe em `site/index.html` mas precisa estar publicado
(Netlify ou similar) com domínio e Pixel instalado antes de receber
anúncio. Quando isso acontecer:

- **Campanha: STR | Tráfego site | Curitiba**
- Objetivo: Tráfego, local de conversão: Site
- Otimização: cliques no link no início; visualizações da página de
  destino quando o Pixel estiver medindo direito
- Começar só com o público vencedor do teste da Fase 1 (1 conjunto)
- Reaproveitar os 2 criativos vencedores com CTA "Saiba mais" pro site
- Verba: R$ 15 a 20/dia

Mais pra frente, com o WhatsApp como canal de fechamento, vale testar
campanha de **Engajamento > Apps de mensagem (WhatsApp)** apontando pro
41 99206-8607: é o objetivo que mais aproxima anúncio de conversa de
venda pra serviço local.

---

## 8. Checklist de execução

- [ ] Conta profissional no Instagram configurada (bio + destaques)
- [ ] Página do Facebook criada e vinculada
- [ ] Portfólio de negócios + conta de anúncios (BRL, fuso São Paulo)
- [ ] Pagamento cadastrado + 2FA ativo
- [ ] Post 1 (apresentação) publicado
- [ ] Post 2 (educativo) publicado
- [ ] Post 3 (oferta) publicado
- [ ] 4 criativos estáticos produzidos (SVG > PNG 1080x1350)
- [ ] Campanha criada com os 3 conjuntos, em rascunho
- [ ] Revisão final e ativação
- [ ] D+7: primeira leitura de resultados e corte
