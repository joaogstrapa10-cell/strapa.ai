# Projeto Claude: Strapa.AI Conteúdo

> Pacote pronto para criar o Projeto no claude.ai dedicado ao conteúdo da marca
> (copys, carrossel, estático, reels, stories e ideias). Só da Strapa.AI, nunca
> de clientes. Criado em 2026-07-08.

## Como montar (5 minutos)

1. Acesse **claude.ai** e clique em **Projects** (menu lateral) e depois **New project**.
2. Nome do projeto: **Strapa.AI · Conteúdo da marca**.
3. Abra o arquivo `instrucoes-do-projeto.md` desta pasta, copie TODO o conteúdo (sem a primeira linha de título) e cole no campo **"Instructions"** (ícone de engrenagem ou "Set project instructions").
4. Em **"Project knowledge"**, faça upload dos 7 arquivos `conhecimento-01` a `conhecimento-07` desta pasta.
5. Pronto. Toda conversa dentro desse projeto já nasce sabendo a marca, a identidade, o método e as regras.

## Arquivos do pacote

| Arquivo | O que é |
|---|---|
| `instrucoes-do-projeto.md` | Colar nas Instructions (comportamento do projeto) |
| `conhecimento-01-marca.md` | Empresa, público, serviços, contato, fase atual |
| `conhecimento-02-identidade-visual.md` | Cores, fontes, logo, estilo, o que nunca fazer |
| `conhecimento-03-metodo-conteudo.md` | Como construir carrossel, estático, reels e stories |
| `conhecimento-04-banco-de-hooks.md` | 56 hooks comprovados para headlines e capas |
| `conhecimento-05-manual-editorial.md` | Os 7 parâmetros de qualidade do texto |
| `conhecimento-06-anti-ai-slop.md` | Lista de construções proibidas (texto com cara de IA) |
| `conhecimento-07-exemplos-qualidade.md` | 2 carrosséis completos como âncora de qualidade |

## Prompts de exemplo pra usar no projeto

- "Me traz as ideias da semana" (vem cardápio de carrossel + estático + reels)
- "Faz o carrossel da ideia 2"
- "Roteiro de reels sobre link pelado no WhatsApp"
- "Stories de hoje: tô montando o site de um cliente"
- "Transforma esse print em conteúdo" (colar print)

## Manutenção

- Quando a marca evoluir (site no ar, primeiro case fechado, preço novo), atualizar o `conhecimento-01-marca.md` aqui E reenviar no projeto (deletar o antigo e subir o novo).
- Quando surgir cliente, criar OUTRO projeto no claude.ai só dele (não misturar neste).
- Os originais dos arquivos 04 a 07 vivem em `MazyOS/.claude/agents/refs/`; se eles mudarem lá, recopiar pra cá.
