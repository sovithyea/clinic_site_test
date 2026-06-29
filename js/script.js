/* ============================================================
   SECRET CLINIC — SCRIPT.JS
   ============================================================ */
(function () {
  'use strict';

  const el  = (sel, ctx = document) => ctx.querySelector(sel);
  const els = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const NAV_H = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;

  /* ── Sticky nav ── */
  const header = el('#site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  /* ── Hamburger ── */
  const hamburger = el('#hamburger');
  const navMenu   = el('#nav-menu');

  const closeMenu = () => {
    hamburger.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('open');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => {
    const open = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!open));
    navMenu.classList.toggle('open');
    document.body.style.overflow = open ? '' : 'hidden';
  });

  els('.nav-link').forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('click', (e) => {
    if (!header.contains(e.target) && navMenu.classList.contains('open')) closeMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) closeMenu();
  });

  /* ── Smooth scroll ── */
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const target = el(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - NAV_H(), behavior: 'smooth' });
  });

  /* ── Scroll animations ── */
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els('.animate-on-scroll').forEach(el => obs.observe(el));
  } else {
    els('.animate-on-scroll').forEach(el => el.classList.add('is-visible'));
  }

  /* ── Active nav ── */
  const sections = els('section[id]');
  if ('IntersectionObserver' in window) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          els('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`));
        }
      });
    }, { rootMargin: `-${NAV_H() + 20}px 0px -60% 0px` });
    sections.forEach(s => navObs.observe(s));
  }

  /* ── Carousel ── */
  const track    = el('#carousel-track');
  const dotsWrap = el('#carousel-dots');
  const prevBtn  = el('#carousel-prev');
  const nextBtn  = el('#carousel-next');

  if (track) {
    const cards = els('.testimonial-card', track);
    let current = 0;
    let autoTimer = null;
    let busy = false;

    const getVisible = () => window.innerWidth <= 640 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
    const maxIdx = () => Math.max(0, cards.length - getVisible());
    const getOffset = () => {
      const gap = parseFloat(getComputedStyle(track).gap) || 24;
      return (cards[0].getBoundingClientRect().width + gap) * current;
    };

    const buildDots = () => {
      dotsWrap.innerHTML = '';
      for (let i = 0; i <= maxIdx(); i++) {
        const d = document.createElement('button');
        d.className = 'carousel-dot' + (i === current ? ' active' : '');
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', `Slide ${i + 1}`);
        d.addEventListener('click', () => { resetAuto(); goTo(i); });
        dotsWrap.appendChild(d);
      }
    };

    const updateDots = () => {
      els('.carousel-dot', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === current));
    };

    const goTo = (idx) => {
      if (busy) return;
      busy = true;
      current = Math.max(0, Math.min(idx, maxIdx()));
      track.style.transform = `translateX(-${getOffset()}px)`;
      updateDots();
      setTimeout(() => { busy = false; }, 520);
    };

    const startAuto = () => { autoTimer = setInterval(() => goTo(current >= maxIdx() ? 0 : current + 1), 5000); };
    const resetAuto = () => { clearInterval(autoTimer); startAuto(); };

    prevBtn.addEventListener('click', () => { resetAuto(); goTo(current - 1); });
    nextBtn.addEventListener('click', () => { resetAuto(); goTo(current + 1); });

    // Touch
    let tx = 0, td = 0;
    track.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchmove',  e => { td = e.touches[0].clientX - tx; }, { passive: true });
    track.addEventListener('touchend',   () => { if (Math.abs(td) > 50) { resetAuto(); td < 0 ? goTo(current + 1) : goTo(current - 1); } });

    track.parentElement.addEventListener('mouseenter', () => clearInterval(autoTimer));
    track.parentElement.addEventListener('mouseleave', startAuto);

    let rTimer;
    window.addEventListener('resize', () => {
      clearTimeout(rTimer);
      rTimer = setTimeout(() => {
        current = Math.min(current, maxIdx());
        buildDots();
        track.style.transition = 'none';
        requestAnimationFrame(() => {
          track.style.transform = `translateX(-${getOffset()}px)`;
          requestAnimationFrame(() => { track.style.transition = ''; });
        });
      }, 150);
    });

    buildDots();
    goTo(0);
    startAuto();
  }

  /* ── Scroll to top ── */
  const scrollBtn = el('#scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.hidden = window.scrollY <= 500;
    }, { passive: true });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── Mobile sticky CTA ── */
  const mobileBar = document.createElement('div');
  mobileBar.className = 'mobile-cta-bar';
  mobileBar.setAttribute('aria-hidden', 'true');
  mobileBar.innerHTML = `
    <a href="tel:+85512345678" class="mobile-cta-call">Call Us</a>
    <a href="https://t.me/secretclinic" target="_blank" rel="noopener" class="mobile-cta-book">Book via Telegram</a>
  `;
  document.body.appendChild(mobileBar);

  const mobileStyle = document.createElement('style');
  mobileStyle.textContent = `
    .mobile-cta-bar {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 95;
      background: #FAF6F1;
      border-top: 1px solid #D9C9B8;
      padding: 0.75rem 1rem env(safe-area-inset-bottom, 0);
      gap: 0.75rem;
      box-shadow: 0 -4px 20px rgba(28,20,16,0.12);
      align-items: center;
      transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    @media (max-width: 640px) {
      .mobile-cta-bar { display: flex; }
    }
    .mobile-cta-bar.hidden { transform: translateY(100%); }
    .mobile-cta-call {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #1C1410;
      border: 1.5px solid #D9C9B8;
      border-radius: 4px;
      padding: 0.75rem 1rem;
      text-decoration: none;
      min-height: 48px;
      transition: all 220ms;
    }
    .mobile-cta-call:active { background: #F0E9E0; }
    .mobile-cta-book {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      background: #C4541A;
      color: #fff;
      border-radius: 4px;
      padding: 0.75rem 1rem;
      text-decoration: none;
      min-height: 48px;
      transition: background 220ms;
    }
    .mobile-cta-book:active { background: #A04313; }
  `;
  document.head.appendChild(mobileStyle);

  // Hide when contact section is visible
  const contactSection = el('#contact');
  if (contactSection && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => mobileBar.classList.toggle('hidden', e.isIntersecting));
    }, { threshold: 0.1 }).observe(contactSection);
  }

})();