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
  // 1b. Count-up de números (prueba social)
  // ════════════════════════════════════════════════
  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    const render = (el, val) =>
      el.textContent = (el.dataset.prefix || '') + val + (el.dataset.suffix || '');

    if (reduceMotion) {
      els.forEach(el => render(el, parseInt(el.dataset.count, 10) || 0));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target;
        const target = parseInt(el.dataset.count, 10) || 0;
        const dur = 1100;
        const start = performance.now();
        (function tick(now) {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          render(el, Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.4 });

    els.forEach(el => { render(el, 0); io.observe(el); });
  }

  // ════════════════════════════════════════════════
  // 1c. Métricas en vivo desde el admin (con fallback)
  // ════════════════════════════════════════════════
  function fetchLiveStats() {
    fetch('https://admin.fulbito.futbol/api/public/stats', { mode: 'cors' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const setCount = (stat, val) => {
          if (val == null || isNaN(val)) return;
          const el = document.querySelector('[data-stat="' + stat + '"]');
          if (el) el.dataset.count = String(val);
        };
        // jugadores: máx entre usuarios de la app y grupos×10 (cada grupo tiene
        // ~10 jugadores que se benefician del armado aunque no todos usen la app).
        // Redondeo honesto al múltiplo de 10 inferior, prefijo "+".
        if (typeof d.players === 'number') {
          const raw = Math.max(d.players, (d.groups || 0) * 10);
          setCount('players', Math.max(0, Math.floor(raw / 10) * 10));
        }
        setCount('groups', d.groups);
        setCount('matches', d.matches);

        // actividad reciente
        const act = document.querySelector('.proof-activity');
        if (act && d.last_match_date) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const last = new Date(d.last_match_date + 'T00:00:00');
          const days = Math.round((today.getTime() - last.getTime()) / 86400000);
          let phrase = 'El último partido se armó esta semana';
          if (days <= 0) phrase = 'El último partido se armó hoy';
          else if (days === 1) phrase = 'El último partido se armó ayer';
          else if (days <= 7) phrase = 'El último partido se armó esta semana';
          else phrase = 'El último partido se armó hace ' + days + ' días';
          act.innerHTML = '<span class="proof-activity__dot" aria-hidden="true"></span>' + phrase;
        }
      })
      .catch(() => { /* el sitio ya tiene números de fallback en el HTML */ });
  }

  // ════════════════════════════════════════════════
  // 2. Pinned "Cómo funciona" — morph ligado al scroll
  // ════════════════════════════════════════════════
  function initHowto() {
    const track = document.querySelector('[data-howto-track]');
    if (!track) return;

    const stage = track.querySelector('.howto__stage');
    const phone = track.querySelector('.howto__phone');
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
      steps.forEach(el => {
        el.classList.toggle('is-active', parseInt(el.getAttribute('data-step'), 10) === idx);
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

      // Legibilidad primero: el teléfono SIEMPRE de frente, con un tilt sutil
      // (±9°) ligado al scroll para dar vida sin tapar la pantalla.
      if (phone) {
        const tilt = (p - 0.5) * 18;
        phone.style.transform = 'perspective(1400px) rotateY(' + tilt.toFixed(1) + 'deg)';
      }

      // Pasos con dwell parejo (1/total cada uno) → da tiempo a leer cada pantalla.
      const idx = Math.min(total - 1, Math.floor(p * total * 0.999));
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

    // Los teléfonos de "Cómo funciona" alternan la dirección de giro.
    let hi = 0;
    els.forEach(el => {
      if (el.closest('#como-funciona')) {
        el.dataset.spinDir = (hi++ % 2 === 0) ? '1' : '-1';
      }
    });

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
        // barrido configurable por elemento (data-spin-deg); default ±75°
        const spin = parseFloat(el.getAttribute('data-spin-deg')) || SPIN;
        const dir = parseFloat(el.getAttribute('data-spin-dir')) || 1; // dirección alternada
        const deg = (0.5 - p) * spin * dir; // entra girado → de frente al centro → gira al salir
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
  // 3c. Fusión — flip ligado al scroll (foto + crack → fusión)
  // ════════════════════════════════════════════════
  function initFusion() {
    const root = document.querySelector('[data-fusion-anim]');
    if (!root) return;
    const stage = root.querySelector('.fusion__stage');
    const flip = root.querySelector('[data-fusion-flip]');
    const left = root.querySelector('[data-fusion-left]');
    const right = root.querySelector('[data-fusion-right]');
    const front = root.querySelector('.fusion__face--front');
    const back = root.querySelector('.fusion__face--back');
    const glow = root.querySelector('.fusion__glow');
    if (!stage || !flip || !left || !right) return;

    if (reduceMotion) { root.classList.add('fusion--static'); return; }

    let ticking = false;
    function update() {
      ticking = false;
      const rect = stage.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -80 || rect.top > vh + 80) return;

      // progreso: 0 cuando el stage entra por abajo, 1 cuando su centro sube al ~40%
      const center = rect.top + rect.height / 2;
      let p = 1 - (center - vh * 0.4) / (vh * 0.55);
      p = Math.max(0, Math.min(1, p));

      const conv = Math.min(1, p / 0.55);              // solapar los círculos
      const flipP = Math.max(0, (p - 0.55) / 0.45);    // girar la carta

      // De separados (±apart) a solape COMPLETO (0): los dos círculos terminan
      // apilados en el centro antes de girar.
      const xoff = rect.width * 0.68 * (1 - conv);
      left.style.transform = 'translateX(' + (-xoff).toFixed(1) + 'px)';
      right.style.transform = 'translateX(' + xoff.toFixed(1) + 'px)';
      flip.style.transform = 'rotateY(' + (flipP * 180).toFixed(1) + 'deg)';

      // Swap de caras al cruzar los 90° (a prueba de iOS: no dependemos solo de
      // backface-visibility). Antes del cruce se ven los orbs; después, la fusión.
      const showBack = flipP >= 0.5;
      if (front) front.style.opacity = showBack ? '0' : '1';
      if (back) back.style.opacity = showBack ? '1' : '0';
      if (glow) glow.style.opacity = (conv * 0.85).toFixed(2);
    }
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    window.addEventListener('resize', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
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
  // ════════════════════════════════════════════════
  // 8. Reproductor del relato (audio real)
  // ════════════════════════════════════════════════
  function initRelatoPlayer() {
    const player = document.querySelector('[data-relato]');
    if (!player) return;
    const audio = player.querySelector('.relator-player__audio');
    const btn = player.querySelector('[data-relato-play]');
    if (!audio || !btn) return;

    btn.addEventListener('click', () => {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });
    audio.addEventListener('play', () => {
      player.classList.add('is-playing');
      btn.setAttribute('aria-label', 'Pausar relato');
    });
    const stop = () => {
      player.classList.remove('is-playing');
      btn.setAttribute('aria-label', 'Reproducir relato');
    };
    audio.addEventListener('pause', stop);
    audio.addEventListener('ended', stop);
  }

  // ════════════════════════════════════════════════
  // 9. Showcase "Mucho más que armar equipos"
  //    - Paneo horizontal ligado al scroll vertical (sin pin/scrolljacking)
  //    - El swipe manual sigue funcionando (overflow-x)
  //    - La card centrada se eleva (coverflow focus)
  // ════════════════════════════════════════════════
  function initShowcase() {
    const carousel = document.querySelector('.showcase-carousel');
    const track = carousel && carousel.querySelector('.showcase-carousel__track');
    if (!track) return;
    const items = Array.from(track.querySelectorAll('.showcase-carousel__item'));
    if (!items.length) return;
    const section = carousel.closest('.showcase-section') || carousel;

    let focusIdx = -1;
    function updateFocus() {
      const cRect = track.getBoundingClientRect();
      const cx = cRect.left + cRect.width / 2;
      let best = 0, bestDist = Infinity;
      items.forEach((it, i) => {
        const r = it.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - cx);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      if (best !== focusIdx) {
        items.forEach((it, i) => it.classList.toggle('is-focus', i === best));
        focusIdx = best;
      }
    }

    function autoPan() {
      if (reduceMotion) return;
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // progreso 0..1: 0 cuando el centro de la sección está abajo del viewport,
      // 0.5 cuando está centrada, 1 cuando sube fuera por arriba.
      const center = rect.top + rect.height / 2;
      let p = (vh - center) / vh;
      p = Math.max(0, Math.min(1, p));
      track.scrollLeft = p * max;
    }

    let rafWin = false, rafTrack = false;
    function onWinScroll() {
      if (rafWin) return;
      rafWin = true;
      requestAnimationFrame(() => { rafWin = false; autoPan(); updateFocus(); });
    }
    function onTrackScroll() {
      if (rafTrack) return;
      rafTrack = true;
      requestAnimationFrame(() => { rafTrack = false; updateFocus(); });
    }

    window.addEventListener('scroll', onWinScroll, { passive: true });
    window.addEventListener('resize', onWinScroll, { passive: true });
    track.addEventListener('scroll', onTrackScroll, { passive: true });
    onWinScroll();
  }

  // ════════════════════════════════════════════════
  // Platform CTA — en Android, descarga directa de Google Play
  // ════════════════════════════════════════════════
  const PLAY_URL = 'https://play.google.com/store/apps/details?id=futbol.fulbito.app';
  function initPlatformCTA() {
    // Excluir Chrome OS (corre en "Android" pero no es un teléfono → mejor la PWA/web).
    const ua = navigator.userAgent || '';
    if (!/Android/i.test(ua) || /CrOS/i.test(ua)) return;
    const actions = document.getElementById('cta-hero')?.parentElement
      || document.querySelector('.hero__actions');
    if (!actions || actions.querySelector('.hero__btn--play')) return;
    const play = document.createElement('a');
    play.href = PLAY_URL;
    play.target = '_blank';
    play.rel = 'noopener';
    play.className = 'btn-primary btn-primary--lg hero__btn hero__btn--play';
    play.innerHTML = '▶ Descargar en Google Play';
    // CTA primario para Android: lo ponemos primero.
    actions.insertBefore(play, actions.firstChild);
  }

  function safe(fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[fulbito]', e); }
  }

  function init() {
    // initReveal primero: si algo más fallara, el contenido igual se muestra.
    safe(initReveal);
    safe(fetchLiveStats);
    safe(initCounters);
    safe(initHeader);
    safe(initHowto);
    safe(initTilt);
    safe(initScrollSpin);
    safe(initFusion);
    safe(initParallaxFallback);
    safe(initSmoothScroll);
    safe(initLightbox);
    safe(initRelatoPlayer);
    safe(initShowcase);
    safe(initPlatformCTA);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
