# Ajuste Fino Atelier

Pasta da cliente dentro do MazyOS. Tudo que for criado para o Ajuste Fino a partir de agora mora aqui.

## O que existe hoje

| Caminho | O que é |
|---|---|
| `site/` | Site institucional completo (estático, pronto para hospedar) |
| `site/index.html` | Página principal: serviços, curso, domicílio, sobre, FAQ, mapa |
| `site/curso.html` | Página dedicada do curso de reforma de roupas |
| `site/css/style.css` | Folha de estilo com a identidade visual da marca |
| `site/js/main.js` | Animações de scroll, menu mobile, FAQ |
| `site/img/` | Logo recriado em SVG (símbolo, logo completo e favicon) |
| `site/fonts/` | Fontes embutidas no site (Cormorant Garamond e Jost), sem dependência do Google Fonts |
| `identidade-visual.md` | Guia da marca: cores, fontes e uso do logo |

## Dados usados no site

- WhatsApp: (41) 99788-5498, link `wa.me/5541997885498`
- Endereço: Rua Eurides Cunha, 90, Loja 3, Vila Isabel, Curitiba, PR
- Atendimento a domicílio nos principais bairros de Curitiba

## Pendências para fechar com a cliente

1. **Arquivo original do logo**: o símbolo no cabeçalho e no rodapé é uma recriação em vetor feita a partir da foto do cartão de visita. Quando o arquivo original do logo chegar (PNG com fundo transparente ou vetor), trocar nos dois lugares e conferir a fonte do wordmark.
2. **Nome da costureira**: a seção "Sobre" foi escrita sem nome próprio. Quando tiver o nome, é só incluir no texto.
3. **Horário de atendimento**: o site está com segunda a sexta das 9h às 18h e sábado das 9h às 13h. Confirmar com a cliente e ajustar no rodapé das duas páginas se for diferente.
4. **Nome do curso**: está genérico como "Curso de Reforma de Roupas". Trocar em `index.html` e `curso.html` quando ela definir.
5. **Preço e datas do curso**: a página do curso manda para o WhatsApp. Quando existirem turmas e valores, dá para incluir na página.
6. **@ do Instagram**: o ícone de Instagram do rodapé está desativado (comentado no HTML das duas páginas) para não haver link quebrado. Descomentar e colocar o link do perfil quando ele estiver arrumado.
7. **Fotos reais**: o site ainda não tem fotos do trabalho da cliente. Quando existirem (antes e depois, ateliê, aulas), vale incluir nas seções de serviços, sobre e curso.

## Como visualizar o site

Abrir `site/index.html` no navegador. Não precisa de servidor, é tudo estático.
