// Utilidades compartilhadas
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const P = {
  home:'M4 11.2 12 4l8 7.2V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  image:'M4 5h16v14H4zM4 16l4.5-4.5 4 4 3-3L20 16M15.5 9.2h.01',
  book:'M5 4.5h11.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11.5M9 8.5h6',
  leaf:'M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19c2-4 5-7 9-9',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  camera:'M4 8h3l1.6-2h6.8L17 8h3v11H4zM12 16.5a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6z',
  upload:'M12 16V5m0 0-4 4m4-4 4 4M5 15v4h14v-4',
  trash:'M5 7h14M10 7V4.5h4V7M7 7l.8 12h8.4L17 7M10 11v5M14 11v5',
  chat:'M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4.5 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  bell:'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0',
  check:'m5 12.5 4.5 4.5L19 7.5',
  chevR:'m9 5 7 7-7 7', chevL:'m15 5-7 7 7 7', chevD:'m5 9 7 7 7-7',
  arrow:'M5 12h14m-5-5 5 5-5 5',
  x:'M6 6l12 12M18 6 6 18',
  cal:'M4.5 6h15v14h-15zM4.5 10h15M8.5 3.5v4M15.5 3.5v4',
  plus:'M12 5v14M5 12h14',
  compare:'M4 5h7v14H4zM13 5h7v14h-7z',
  lock:'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  spark:'M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5zM18.5 16c.3 1.8 1 2.5 2.5 2.8-1.5.3-2.2 1-2.5 2.7-.3-1.700-1-2.400-2.500-2.700 1.500-.300 2.200-1 2.500-2.800z',
  send:'m4 12 16-8-5 16-3.2-6.2z',
  star:'m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.300 7.200 18.900l1-5.400-4-3.800 5.400-.700z',
  search:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  gear:'M12 15.5a3.5 3.5 0 1 0 0-7 3.500 3.500 0 0 0 0 7zM19 12a7 7 0 0 0-.1-1.300l1.900-1.500-1.800-3.100-2.300.9a7 7 0 0 0-2.200-1.300L14 3.200h-3.600l-.5 2.500a7 7 0 0 0-2.200 1.300l-2.300-.9-1.800 3.100L5.500 10.700A7 7 0 0 0 5.400 12c0 .4 0 .9.100 1.300l-1.900 1.500 1.800 3.100 2.300-.9a7 7 0 0 0 2.200 1.300l.5 2.500H14l.5-2.500a7 7 0 0 0 2.200-1.300l2.300.9 1.800-3.100-1.900-1.500c.1-.4.100-.9.100-1.300z',
  clock:'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 8v4.500l3 1.800',
  alert:'M12 4 3.500 19h17zM12 10v4.500M12 17h.01',
  shield:'M12 3.500 5 6v5.500c0 4.300 3 7.500 7 9 4-1.500 7-4.700 7-9V6z',
  phone:'M6.500 4h3l1.300 3.800-2 1.300a11 11 0 0 0 5.100 5.100l1.300-2L19 13.500v3A2.500 2.500 0 0 1 16.500 19 12.500 12.500 0 0 1 4 6.500 2.500 2.500 0 0 1 6.500 4z',
  logout:'M10 4.500H5v15h5M14 8l4 4-4 4M18 12H9',
  edit:'M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4',
  help:'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9.700 9.700a2.400 2.400 0 1 1 3.400 2.200c-.700.400-1.100.900-1.100 1.600M12 16.500h.01',
  list:'M8 6.500h12M8 12h12M8 17.500h12M4 6.500h.01M4 12h.01M4 17.500h.01',
  users:'M9 11a3.200 3.200 0 1 0 0-6.400A3.200 3.200 0 0 0 9 11zM3 19a6 6 0 0 1 12 0M16 5.200a3.200 3.200 0 0 1 0 5.800M17.500 14a6 6 0 0 1 3.500 5',
  grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  download:'M12 4v11m0 0-4-4m4 4 4-4M5 19h14',
  eye:'M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12zM12 14.800a2.800 2.800 0 1 0 0-5.600 2.800 2.800 0 0 0 0 5.600z',
  note:'M6 4h9l3 3v13H6zM9 11h6M9 14.500h6',
  heart:'M12 20s-7.500-4.600-7.500-10A4.200 4.200 0 0 1 12 7.600 4.200 4.200 0 0 1 19.500 10c0 5.400-7.500 10-7.500 10z',
  flag:'M6 20V4.500M6 5h11l-2 3.500 2 3.500H6',
  menu:'M4 7h16M4 12h16M4 17h16',
};
export const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || ''}"/></svg>`;

// Datas
export const parseDate = s => { if (!s) return null; if (s instanceof Date) return s; if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); } return new Date(s); };
export const sod = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const dayN = s => Math.round((sod(new Date()) - sod(parseDate(s))) / 864e5);
export const daysBetween = (a, b) => Math.round((sod(parseDate(b)) - sod(parseDate(a))) / 864e5);
export const isoDay = (d = new Date()) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const fmtLong = s => parseDate(s).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
export const fmtFull = s => parseDate(s).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtShort = s => parseDate(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
export const fmtTime = s => new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const ago = iso => { const m = Math.round((Date.now() - new Date(iso)) / 6e4); if (m < 1) return 'agora'; if (m < 60) return `há ${m} min`; const h = Math.round(m / 60); if (h < 24) return `há ${h} h`; const d = Math.round(h / 24); return d === 1 ? 'ontem' : `há ${d} dias`; };
export const pad2 = n => String(Math.max(0, n)).padStart(2, '0');
export const first = n => String(n || '').trim().split(/\s+/)[0];
export const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();

// Arte editorial abstrata (placeholder para fotografia) — gera SVG suave nas cores da marca
export function art(seed = 1, w = 600, h = 760) {
  const pals = [['#E9E0D5', '#B8AA9A', '#8B7866'], ['#F1EBE1', '#8B9180', '#B8AA9A'], ['#E4D9CB', '#8B7866', '#292927'], ['#EFE8DD', '#B8AA9A', '#8B9180']];
  const p = pals[Math.abs(seed) % pals.length], r = n => ((Math.sin(seed * 9301 + n * 49297) * 233280) % 1 + 1) % 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="#F7F5F0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="38"/></filter></defs><rect width="${w}" height="${h}" fill="url(#g)"/><g filter="url(#b)"><circle cx="${w * (.25 + r(1) * .5)}" cy="${h * (.25 + r(2) * .3)}" r="${150 + r(3) * 90}" fill="${p[1]}" opacity=".55"/><circle cx="${w * (.4 + r(4) * .4)}" cy="${h * (.6 + r(5) * .3)}" r="${120 + r(6) * 80}" fill="${p[2]}" opacity=".4"/></g><g fill="none" stroke="${p[2]}" stroke-opacity=".35" stroke-width="1.2"><ellipse cx="${w / 2}" cy="${h * .46}" rx="${w * .2}" ry="${h * .26}"/><path d="M${w * .3} ${h * .78}q${w * .2} ${-h * .1} ${w * .4} 0"/></g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Comprime imagem enviada (privacidade + espaço)
export function compressImage(file, max = 900, q = .78) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', q));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

export const WA_FALLBACK = '5541999990000';
export function waLink(number, text) { return `https://wa.me/${String(number || WA_FALLBACK).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`; }
