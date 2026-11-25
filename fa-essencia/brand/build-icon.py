import math
# Símbolo: "A" em arco (haste do F à esquerda + braço superior do F = topo do A) + travessão em oliva (braço do F = barra do A)
# envolvido por um arco aberto (continuidade / ciclo do cuidado).
BODY='''<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M610 145 A380 380 0 1 1 243 243" stroke="#B8AA9A" stroke-width="18"/>
  <path d="M394 730 L394 450 C394 342 446 272 520 272 C600 272 646 346 650 450 C654 548 648 650 636 730" stroke="#8B7866" stroke-width="46"/>
  <path d="M394 548 C470 514 560 512 648 550" stroke="#8B9180" stroke-width="46"/>
</g>'''
def svg(rounded=False,bg=True):
    defs='''<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7F5F0"/><stop offset="1" stop-color="#E9E0D5"/></linearGradient>
<clipPath id="c"><rect width="1024" height="1024" rx="229"/></clipPath></defs>'''
    inner=('<rect width="1024" height="1024" fill="url(#g)"/>' if bg else '')+BODY
    if rounded: inner=f'<g clip-path="url(#c)">{inner}</g>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">{defs}{inner}</svg>'
open('icon-fullbleed.svg','w').write(svg())
open('icon-rounded.svg','w').write(svg(rounded=True))
open('symbol.svg','w').write(svg(bg=False).replace('viewBox="0 0 1024 1024"','viewBox="130 130 764 764"').replace('width="1024" height="1024"','width="764" height="764"'))
