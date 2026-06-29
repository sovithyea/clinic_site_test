/* ============================================================
   PHNOM PENH MEDICAL CENTRE — SCRIPT.JS
   Vanilla JS — no libraries
   Behaviours:
     - Sticky nav with scroll shadow
     - Mobile hamburger menu
     - Testimonial carousel (scroll-snap + JS)
     - AOS-style scroll-triggered fade animations
     - Active nav link via IntersectionObserver
     - Booking form validation + toast
     - Smooth scroll offset by nav height
     - Scroll-to-top button
   ============================================================ */

(function () {
  'use strict';

  /* ── Helpers ── */
  const el  = (sel, ctx = document) => ctx.querySelector(sel);
  const els = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const NAV_HEIGHT = () =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;

  /* ============================================================
     1. STICKY NAV — shadow on scroll
     ============================================================ */
  const header = el('#site-header');

  const handleNavScroll = () => {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // Run on load


  /* ============================================================
     2. MOBILE HAMBURGER
     ============================================================ */
  const hamburger = el('#hamburger');
  const navMenu   = el('#nav-menu');

  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    navMenu.classList.toggle('open');
    document.body.style.overflow = expanded ? '' : 'hidden';
  });

  // Close menu on link click
  els('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target) && navMenu.classList.contains('open')) {
      hamburger.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });


  /* ============================================================
     3. SMOOTH SCROLL — offset by nav height
     ============================================================ */
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const target = el(targetId);
    if (!target) return;

    e.preventDefault();

    const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT();
    window.scrollTo({ top, behavior: 'smooth' });
  });


  /* ============================================================
     4. AOS-STYLE SCROLL ANIMATIONS
     ============================================================ */
  const animatedEls = els('.animate-on-scroll');

  if ('IntersectionObserver' in window) {
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          animObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    animatedEls.forEach(el => animObserver.observe(el));
  } else {
    // Fallback: show all immediately
    animatedEls.forEach(el => el.classList.add('is-visible'));
  }


  /* ============================================================
     5. ACTIVE NAV LINK — IntersectionObserver
     ============================================================ */
  const sections = els('section[id], header[id]');
  const navLinks = els('.nav-link');

  const setActiveLink = (id) => {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${id}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    }, {
      rootMargin: `-${NAV_HEIGHT() + 20}px 0px -60% 0px`,
      threshold: 0
    });

    sections.forEach(s => navObserver.observe(s));
  }


  /* ============================================================
     6. TESTIMONIAL CAROUSEL
     ============================================================ */
  const track    = el('#carousel-track');
  const dotsWrap = el('#carousel-dots');
  const prevBtn  = el('#carousel-prev');
  const nextBtn  = el('#carousel-next');

  if (track && dotsWrap) {
    const cards         = els('.testimonial-card', track);
    let current         = 0;
    let autoplayTimer   = null;
    let isAnimating     = false;

    // Detect how many cards to show per view
    const getVisible = () => {
      if (window.innerWidth <= 640) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    };

    const maxIndex = () => Math.max(0, cards.length - getVisible());

    // Build dots
    const buildDots = () => {
      dotsWrap.innerHTML = '';
      const total = maxIndex() + 1;
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === current ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', String(i === current));
        dot.setAttribute('aria-label', `Testimonial group ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      }
    };

    const updateDots = () => {
      els('.carousel-dot', dotsWrap).forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
        dot.setAttribute('aria-selected', String(i === current));
      });
    };

    const getOffset = () => {
      const card = cards[0];
      if (!card) return 0;
      const gap   = parseFloat(getComputedStyle(track).gap) || 24;
      const width = card.getBoundingClientRect().width;
      return (width + gap) * current;
    };

    const goTo = (index) => {
      if (isAnimating) return;
      isAnimating = true;

      current = Math.max(0, Math.min(index, maxIndex()));
      track.style.transform = `translateX(-${getOffset()}px)`;
      updateDots();

      // Update button states
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === maxIndex();

      setTimeout(() => { isAnimating = false; }, 520);
    };

    const goNext = () => goTo(current + 1);
    const goPrev = () => goTo(current - 1);

    prevBtn.addEventListener('click', () => { resetAutoplay(); goPrev(); });
    nextBtn.addEventListener('click', () => { resetAutoplay(); goNext(); });

    // Autoplay
    const startAutoplay = () => {
      autoplayTimer = setInterval(() => {
        if (current >= maxIndex()) {
          goTo(0);
        } else {
          goNext();
        }
      }, 5000);
    };

    const resetAutoplay = () => {
      clearInterval(autoplayTimer);
      startAutoplay();
    };

    // Touch/swipe
    let touchStartX = 0;
    let touchDeltaX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchDeltaX = 0;
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      touchDeltaX = e.touches[0].clientX - touchStartX;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      if (Math.abs(touchDeltaX) > 50) {
        resetAutoplay();
        touchDeltaX < 0 ? goNext() : goPrev();
      }
    });

    // Pause on hover
    track.parentElement.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
    track.parentElement.addEventListener('mouseleave', startAutoplay);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const carousel = el('#carousel');
      if (!carousel) return;
      const rect = carousel.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      if (e.key === 'ArrowLeft') { resetAutoplay(); goPrev(); }
      if (e.key === 'ArrowRight') { resetAutoplay(); goNext(); }
    });

    // Resize handler — rebuild on viewport change
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        current = Math.min(current, maxIndex());
        buildDots();
        track.style.transition = 'none';
        requestAnimationFrame(() => {
          track.style.transform = `translateX(-${getOffset()}px)`;
          requestAnimationFrame(() => { track.style.transition = ''; });
        });
      }, 150);
    });

    // Init
    buildDots();
    goTo(0);
    startAutoplay();
  }


  /* ============================================================
     7. BOOKING FORM VALIDATION + TOAST
     ============================================================ */
  const bookingForm = el('#booking-form');
  const toast       = el('#toast');

  const showToast = (message, type = 'success', duration = 4000) => {
    toast.textContent = message;
    toast.className = `toast toast--${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.className = 'toast';
    }, duration);
  };

  const validateField = (field) => {
    const wrap = field.closest('.booking-field');
    if (!wrap) return field.value.trim() !== '';

    if (!field.value.trim()) {
      wrap.classList.add('has-error');
      return false;
    }

    // Phone: must be at least 8 digits
    if (field.type === 'tel') {
      const digits = field.value.replace(/\D/g, '');
      if (digits.length < 8) {
        wrap.classList.add('has-error');
        return false;
      }
    }

    wrap.classList.remove('has-error');
    return true;
  };

  if (bookingForm) {
    const fields = els('select, input', bookingForm);

    // Live validation: clear error on input
    fields.forEach(field => {
      field.addEventListener('input', () => {
        const wrap = field.closest('.booking-field');
        if (wrap) wrap.classList.remove('has-error');
      });
    });

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;
      fields.forEach(field => {
        if (!validateField(field)) valid = false;
      });

      if (!valid) {
        showToast('Please fill in all required fields.', 'error');

        // Focus first invalid field
        const firstInvalid = el('.has-error select, .has-error input', bookingForm);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Simulate submission
      const submitBtn = el('.booking-submit', bookingForm);
      const originalText = submitBtn.innerHTML;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        bookingForm.reset();
        showToast('✓ Appointment request sent! We\'ll confirm via WhatsApp shortly.', 'success', 5000);
      }, 1400);
    });
  }


  /* ============================================================
     8. SCROLL TO TOP BUTTON
     ============================================================ */
  const scrollTopBtn = el('#scroll-top');

  if (scrollTopBtn) {
    const toggleScrollBtn = () => {
      if (window.scrollY > 500) {
        scrollTopBtn.hidden = false;
      } else {
        scrollTopBtn.hidden = true;
      }
    };

    window.addEventListener('scroll', toggleScrollBtn, { passive: true });
    toggleScrollBtn();

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ============================================================
     9. SET MIN DATE ON BOOKING DATE INPUT
     ============================================================ */
  const dateInput = el('#book-date');
  if (dateInput) {
    const today = new Date();
    const yyyy  = today.getFullYear();
    const mm    = String(today.getMonth() + 1).padStart(2, '0');
    const dd    = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }


  /* ============================================================
     10. MOBILE STICKY BOTTOM BAR
     Injects a fixed "Book Appointment" bar on small screens
     only — hides when booking bar is in view
     ============================================================ */
  const isMobile = () => window.innerWidth <= 640;

  const mobileBar = document.createElement('div');
  mobileBar.className = 'mobile-cta-bar';
  mobileBar.setAttribute('aria-hidden', 'true'); // decorative duplicate
  mobileBar.innerHTML = `
    <a href="tel:+85523456789" class="mobile-cta-phone">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
      Call
    </a>
    <a href="#booking-bar" class="mobile-cta-book btn btn-amber">Book Appointment</a>
  `;
  document.body.appendChild(mobileBar);

  // Inject matching CSS via a style tag (keeps it co-located with the logic)
  const mobileBarStyle = document.createElement('style');
  mobileBarStyle.textContent = `
    .mobile-cta-bar {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 90;
      background: #fff;
      border-top: 1px solid #D1D5DB;
      padding: 0.75rem 1rem;
      gap: 0.75rem;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.10);
      align-items: center;
    }
    @media (max-width: 640px) {
      .mobile-cta-bar {
        display: flex;
      }
      /* Push page content above sticky bar */
      body { padding-bottom: 72px; }
    }
    .mobile-cta-phone {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1B4332;
      border: 2px solid #1B4332;
      border-radius: 6px;
      padding: 0.625rem 1rem;
      white-space: nowrap;
      text-decoration: none;
      flex-shrink: 0;
      transition: background 200ms, color 200ms;
    }
    .mobile-cta-phone:hover,
    .mobile-cta-phone:focus {
      background: #1B4332;
      color: #fff;
    }
    .mobile-cta-book {
      flex: 1;
      justify-content: center;
      text-align: center;
      border-radius: 6px;
      padding: 0.625rem 1rem;
    }
    .mobile-cta-bar.hidden {
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    .mobile-cta-bar:not(.hidden) {
      transform: translateY(0);
      transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    }
  `;
  document.head.appendChild(mobileBarStyle);

  // Hide bar when booking section is in viewport
  const bookingSection = el('#booking-bar');
  if (bookingSection && 'IntersectionObserver' in window) {
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        mobileBar.classList.toggle('hidden', entry.isIntersecting);
      });
    }, { threshold: 0.2 });
    barObserver.observe(bookingSection);
  }
})();