/* main.js — Motor de interacción del sitio Fulbito
   ──────────────────────────────────────────────────────────
   - Reveals de entrada (IntersectionObserver → .is-inview)
   - Sección pinned "Cómo funciona": morph del phone ligado al scroll
   - Tilt 3D de la Card FUT
   - Parallax fallback (navegadores sin animation-timeline)
   - Header sticky, smooth scroll, lightbox
   ────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsScrollTimeline = CSS.supports && CSS.supports('animation-timeline: view()');

  // ════════════════════════════════════════════════
  // 1. Reveals de entrada
  // ════════════════════════════════════════════════
  function initReveal() {
    const reveals = document.querySelectorAll('.reveal, .line-reveal');
    if (!reveals.length) return;

    if (reduceMotion) {
      reveals.forEach(el => el.classList.add('is-inview'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-inview');
          observer.unobserve(entry.target);
          setTimeout(() => { entry.target.style.willChange = 'auto'; }, 1000);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    reveals.forEach(el => observer.observe(el));
  }

  // ════════════════════════════════════════════════
  // 2. Pinned "Cómo funciona" — morph ligado al scroll
  // ════════════════════════════════════════════════
  function initHowto() {
    const track = document.querySelector('[data-howto-track]');
    if (!track) return;

    const stage = track.querySelector('.howto__stage');
    const phone = track.querySelector('.howto__phone');
    const screens = Array.from(track.querySelectorAll('.howto__screen'));
    const steps = Array.from(track.querySelectorAll('[data-step]'));
    const dots = Array.from(track.querySelectorAll('[data-dot]'));
    const fill = track.querySelector('[data-howto-progress]');
    const total = parseInt(track.getAttribute('data-howto-track'), 10) || 4;
    if (!stage || !steps.length) return;

    let current = -1;
    let ticking = false;

    function setActive(idx) {
      if (idx === current) return;
      current = idx;
      // En los pasos "de espaldas" (impares) el teléfono está rotado 180°, así que
      // la captura se ve espejada → la des-espejamos con scaleX(-1).
      const flipped = (idx % 2) === 1;
      steps.forEach(el => {
        el.classList.toggle('is-active', parseInt(el.getAttribute('data-step'), 10) === idx);
      });
      screens.forEach(s => {
        const on = parseInt(s.getAttribute('data-step'), 10) === idx;
        s.classList.toggle('is-flipped', on && flipped);
      });
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }

    function update() {
      ticking = false;
      const rect = track.getBoundingClientRect();
      // El tramo pineable real = alto del track menos el alto del stage (que ya
      // descuenta el header). Así el morph completa los 4 pasos justo dentro del pin.
      const scrollable = rect.height - stage.offsetHeight;
      if (scrollable <= 0) { setActive(0); return; }

      // progreso 0..1 a lo largo del tramo pineable
      let p = (-rect.top) / scrollable;
      p = Math.max(0, Math.min(1, p));

      if (fill) fill.style.transform = 'scaleX(' + p + ')';

      // El TELÉFONO gira ligado al scroll: media vuelta (180°) por paso.
      // Faces "de frente" en 0/180/360… → coinciden con cada paso asentado.
      if (phone) {
        const rot = p * (total - 1) * 180;
        phone.style.transform = 'rotateY(' + rot.toFixed(1) + 'deg)';
      }

      // El paso cambia en los puntos "de canto" (90/270/450°), donde el teléfono
      // está de perfil y no se ve el cambio de pantalla.
      const idx = Math.round(p * (total - 1));
      setActive(idx);
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  // ════════════════════════════════════════════════
  // 3. Tilt 3D de la Card FUT
  // ════════════════════════════════════════════════
  function initTilt() {
    if (reduceMotion) return;
    const cards = document.querySelectorAll('[data-tilt]');
    if (!cards.length) return;

    cards.forEach(card => {
      const MAX = 12; // grados
      let raf = null;

      function move(e) {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const ry = (px - 0.5) * 2 * MAX;
        const rx = -(py - 0.5) * 2 * MAX;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform =
            'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
          card.style.setProperty('--glare-x', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--glare-y', (py * 100).toFixed(1) + '%');
        });
      }
      function reset() {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
      }

      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', reset);
    });
  }

  // ════════════════════════════════════════════════
  // 3b. Scroll-spin: la card gira en 3D ligada al scroll
  //     (toda la pieza, sticker incluido). Funciona en iOS
  //     Safari, donde animation-timeline de CSS no existe.
  // ════════════════════════════════════════════════
  function initScrollSpin() {
    if (reduceMotion) return;
    const els = document.querySelectorAll('[data-scroll-spin]');
    if (!els.length) return;

    const SPIN = 150; // grados totales de barrido (±75°)
    let ticking = false;

    function update() {
      ticking = false;
      const vh = window.innerHeight;
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > vh + 120) return;
        const center = rect.top + rect.height / 2;
        // 0 cuando el centro está al fondo del viewport, 1 cuando llega arriba
        let p = 1 - (center / vh);
        p = Math.max(0, Math.min(1, p));
        const deg = (0.5 - p) * SPIN; // +75 (entra) → 0 (centro) → -75 (sale)
        el.style.transform = 'perspective(1100px) rotateY(' + deg.toFixed(1) + 'deg)';
      });
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  // ════════════════════════════════════════════════
  // 4. Parallax fallback (sin animation-timeline)
  // ════════════════════════════════════════════════
  function initParallaxFallback() {
    if (reduceMotion || supportsScrollTimeline) return; // CSS ya lo maneja
    const items = document.querySelectorAll('.parallax');
    if (!items.length) return;

    let ticking = false;
    function update() {
      ticking = false;
      const vh = window.innerHeight;
      items.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const shift = el.classList.contains('parallax--strong') ? 80
          : el.classList.contains('parallax--soft') ? 34 : 56;
        // -1 (entrando) .. 1 (saliendo)
        const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        el.style.transform = 'translateY(' + (-progress * shift).toFixed(1) + 'px)';
      });
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  // ════════════════════════════════════════════════
  // 5. Header scroll state
  // ════════════════════════════════════════════════
  function initHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    // Exponer la altura real del header como var CSS (la usa la sección pinned
    // para no quedar tapada por el header).
    function setHeaderVar() {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    }
    setHeaderVar();
    window.addEventListener('resize', setHeaderVar, { passive: true });

    let ticking = false;
    function update() {
      header.classList.toggle('scrolled', window.scrollY > 60);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  // ════════════════════════════════════════════════
  // 6. Smooth scroll para anchors
  // ════════════════════════════════════════════════
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        const headerH = document.getElementById('site-header')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
        history.pushState(null, '', targetId);
      });
    });
  }

  // ════════════════════════════════════════════════
  // 7. Lightbox
  // ════════════════════════════════════════════════
  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const img = lightbox.querySelector('.lightbox__img');
    const closeBtn = lightbox.querySelector('.lightbox__close');

    function open(src, alt) {
      img.src = src;
      img.alt = alt || '';
      lightbox.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lightbox.classList.remove('is-active');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('[data-zoom] .phone-frame__screen, .phone-frame--gallery .phone-frame__screen').forEach(screen => {
      screen.style.cursor = 'zoom-in';
      screen.addEventListener('click', () => open(screen.src, screen.alt));
    });
    closeBtn?.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-active')) close();
    });
  }

  // ════════════════════════════════════════════════
  // Init
  // ════════════════════════════════════════════════
  function safe(fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[fulbito]', e); }
  }

  function init() {
    // initReveal primero: si algo más fallara, el contenido igual se muestra.
    safe(initReveal);
    safe(initHeader);
    safe(initHowto);
    safe(initTilt);
    safe(initScrollSpin);
    safe(initParallaxFallback);
    safe(initSmoothScroll);
    safe(initLightbox);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
