/* main.js — JS mínimo para el sitio Fulbito */

(function () {
  'use strict';

  // ════════════════════════════════════════════════
  // Scroll reveal — IntersectionObserver
  // ════════════════════════════════════════════════
  function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveals.forEach(el => {
        el.classList.add('visible');
        el.style.willChange = 'auto';
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
            // Free GPU memory after animation completes
            setTimeout(() => {
              entry.target.style.willChange = 'auto';
            }, 600);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px'
      }
    );

    reveals.forEach(el => observer.observe(el));
  }

  // ════════════════════════════════════════════════
  // Header scroll effect
  // ════════════════════════════════════════════════
  function initHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    let ticking = false;

    function updateHeader() {
      if (window.scrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });

    updateHeader();
  }

  // ════════════════════════════════════════════════
  // Smooth scroll for anchor links
  // ════════════════════════════════════════════════
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const headerHeight = document.getElementById('site-header')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        history.pushState(null, '', targetId);
      });
    });
  }

  // ════════════════════════════════════════════════
  // Lightbox — tap para ver screenshots en grande
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

    document.querySelectorAll('.phone-frame__screen').forEach(screen => {
      screen.style.cursor = 'zoom-in';
      screen.addEventListener('click', () => {
        open(screen.src, screen.alt);
      });
    });

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-active')) close();
    });
  }

  // ════════════════════════════════════════════════
  // Init
  // ════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initHeader();
    initSmoothScroll();
    initLightbox();
  });

})();
