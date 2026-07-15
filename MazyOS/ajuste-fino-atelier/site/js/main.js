// Ajuste Fino Atelier: interações do site

(function () {
  'use strict';

  // Marca que o JS está ativo: o CSS só esconde os blocos .reveal quando
  // esta classe existe, então sem JS a página aparece inteira
  document.documentElement.classList.add('js');

  // Sombra no cabeçalho quando a página desce
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Menu mobile
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });

    var closeMenu = function (returnFocus) {
      if (!nav.classList.contains('is-open')) { return; }
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      if (returnFocus) { toggle.focus(); }
    };

    // Fecha o menu ao clicar em um link
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { closeMenu(false); });
    });

    // Fecha com Esc, devolvendo o foco ao botão
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { closeMenu(true); }
    });

    // Fecha ao clicar ou tocar fora do menu
    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) {
        closeMenu(false);
      }
    });
  }

  // Conteúdo aparece conforme o scroll
  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealItems.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  } else {
    // Navegadores antigos: mostra tudo direto
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  // FAQ: abre um item por vez
  var faqGroups = document.querySelectorAll('.faq-wrap');
  faqGroups.forEach(function (group) {
    var items = group.querySelectorAll('details.faq-item');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (item.open) {
          items.forEach(function (other) {
            if (other !== item) { other.open = false; }
          });
        }
      });
    });
  });
})();
