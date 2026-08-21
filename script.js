/* ==========================================================================
   OK STUDIOS — Script
   Modular vanilla JS. No dependencies.
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ============================================================
     HERO ENTRANCE ANIMATION
     ============================================================ */
  function initHeroAnimation() {
    const items = document.querySelectorAll('[data-hero]');
    if (!items.length) return;

    if (prefersReducedMotion) {
      items.forEach((item) => {
        item.style.opacity = '1';
        item.style.transform = 'none';
      });
      return;
    }

    items.forEach((item, i) => {
      setTimeout(() => {
        item.classList.add('is-in');
      }, 120 + i * 130);
    });
  }

  /* ============================================================
     SCROLL REVEAL (IntersectionObserver)
     ============================================================ */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    if (prefersReducedMotion) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const siblingsInSameSection = el.parentElement
              ? Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'))
              : [];
            const idx = siblingsInSameSection.indexOf(el);
            const delay = idx > -1 ? Math.min(idx * 90, 360) : 0;
            setTimeout(() => el.classList.add('is-visible'), delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  /* ============================================================
     STICKY NAV — subtle elevation on scroll
     ============================================================ */
  function initNavElevation() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    let ticking = false;

    function update() {
      nav.style.boxShadow = window.scrollY > 8 ? '0 1px 0 rgba(17,17,17,0.06)' : 'none';
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ============================================================
     BEFORE / AFTER SLIDERS
     ============================================================ */
  class BeforeAfterSlider {
    constructor(root) {
      this.root = root;
      this.frame = root.querySelector('.ba-frame');
      this.afterEl = root.querySelector('[data-ba-after]');
      this.divider = root.querySelector('[data-ba-divider]');
      this.range = root.querySelector('[data-ba-range]');
      this.hint = root.querySelector('[data-ba-hint]');

      this.value = 50;
      this.autoPlaying = true;
      this.rafId = null;
      this.lastTime = null;
      this.speed = 6; // percent per second
      this.isDragging = false;
      this.resumeTimer = null;
      this.idleResumeDelay = 30000; // ms of no interaction before auto-demo picks back up
      this.sequence = [25, 75, 50];
      this.seqIndex = 0;

      // Bound once so it can be reused across pause/resume cycles
      this.step = this.step.bind(this);

      this.bindEvents();
      this.beginAutoDemo();
    }

    setValue(v) {
      this.value = Math.max(0, Math.min(100, v));
      this.afterEl.style.clipPath = `inset(0 0 0 ${this.value}%)`;
      this.divider.style.left = `${this.value}%`;
      this.range.value = String(this.value);
    }

    // Called on any user interaction: pause the demo and queue a resume
    // after a period of inactivity (unless reduced motion is requested).
    interrupt() {
      this.autoPlaying = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.hint) this.hint.classList.add('is-hidden');

      if (this.resumeTimer) clearTimeout(this.resumeTimer);
      if (prefersReducedMotion) return;

      this.resumeTimer = setTimeout(() => {
        this.lastTime = null;
        this.autoPlaying = true;
        this.rafId = requestAnimationFrame(this.step);
      }, this.idleResumeDelay);
    }

    beginAutoDemo() {
      if (prefersReducedMotion) {
        this.setValue(50);
        return;
      }
      this.setValue(50);
      this.rafId = requestAnimationFrame(this.step);
    }

    step(timestamp) {
      if (!this.autoPlaying) return;
      if (this.lastTime === null) this.lastTime = timestamp;
      const dt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;

      const target = this.sequence[this.seqIndex];
      const diff = target - this.value;
      const dir = diff > 0 ? 1 : -1;
      const move = this.speed * dt;

      if (Math.abs(diff) <= move) {
        this.setValue(target);
        this.seqIndex = (this.seqIndex + 1) % this.sequence.length;
        this.lastTime = null;
        setTimeout(() => {
          if (this.autoPlaying) this.rafId = requestAnimationFrame(this.step);
        }, 550);
        return;
      }

      this.setValue(this.value + dir * move);
      this.rafId = requestAnimationFrame(this.step);
    }

    bindEvents() {
      this.range.addEventListener('input', (e) => {
        this.interrupt();
        this.setValue(parseFloat(e.target.value));
      });

      this.range.addEventListener('pointerdown', () => {
        this.interrupt();
        this.root.classList.add('is-dragging');
      });

      const stopDrag = () => this.root.classList.remove('is-dragging');
      this.range.addEventListener('pointerup', stopDrag);
      this.range.addEventListener('pointercancel', stopDrag);

      this.frame.addEventListener('pointerdown', (e) => {
        this.interrupt();
        this.isDragging = true;
        this.root.classList.add('is-dragging');
        this.updateFromPointer(e);
        this.frame.setPointerCapture(e.pointerId);
      });

      this.frame.addEventListener('pointermove', (e) => {
        if (!this.isDragging) return;
        this.interrupt(); // keep pushing out the resume timer while actively dragging
        this.updateFromPointer(e);
      });

      const endDrag = () => {
        this.isDragging = false;
        this.root.classList.remove('is-dragging');
      };
      this.frame.addEventListener('pointerup', endDrag);
      this.frame.addEventListener('pointercancel', endDrag);
      this.frame.addEventListener('pointerleave', () => {
        if (this.isDragging) endDrag();
      });
    }

    updateFromPointer(e) {
      const rect = this.frame.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      this.setValue(pct);
    }
  }

  function initSliders() {
    document.querySelectorAll('[data-slider]').forEach((el) => new BeforeAfterSlider(el));
  }

  /* ============================================================
     PROCESS TIMELINE ANIMATION (looping line + glowing dots)
     ============================================================ */
  function initProcessTimeline() {
    const timeline = document.getElementById('processTimeline');
    const fill = document.getElementById('timelineFill');
    if (!timeline || !fill) return;

    const dots = Array.from(timeline.querySelectorAll('[data-dot]'));
    if (!dots.length) return;

    if (prefersReducedMotion) {
      fill.style.transition = 'none';
      fill.style.height = '100%';
      dots.forEach((d) => d.classList.add('is-lit'));
      const finalDot = dots[dots.length - 1];
      if (finalDot) finalDot.classList.add('is-complete');
      return;
    }

    const stepDelay = 900;      // ms between each dot lighting up
    const holdDelay = 1400;     // ms to hold at the end before resetting
    const completeDelay = 350;  // ms after final dot lights before checkmark appears

    let cancelled = false;
    let cycleTimeout = null;

    function reset() {
      fill.style.transition = 'none';
      fill.style.height = '0%';
      dots.forEach((d) => d.classList.remove('is-lit', 'is-complete'));
      void fill.offsetHeight; // force reflow so the next transition applies cleanly
      fill.style.transition = '';
    }

    function runCycle() {
      if (cancelled) return;
      reset();

      dots.forEach((dot, i) => {
        setTimeout(() => {
          if (cancelled) return;
          const pct = (i / (dots.length - 1)) * 100;
          fill.style.height = pct + '%';
          dot.classList.add('is-lit');

          if (i === dots.length - 1) {
            setTimeout(() => {
              if (!cancelled) dot.classList.add('is-complete');
            }, completeDelay);
          }
        }, i * stepDelay);
      });

      const totalTravel = (dots.length - 1) * stepDelay + completeDelay;
      cycleTimeout = setTimeout(() => {
        if (!cancelled) runCycle();
      }, totalTravel + holdDelay);
    }

    // Start once the section actually scrolls into view, then loop indefinitely.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCycle();
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(timeline);
  }

  /* ============================================================
     CASE STUDY MODAL
     ============================================================ */
  const caseStudies = {
    landscaping: {
      eyebrow: '01 — Landscaping · Redesign Concept',
      title: "Smith's Landscaping",
      image: 'landscaping-after.svg',
      problem: [
        'The original site used small, hard-to-read text over a busy background image.',
        'Services were listed as one dense paragraph with no clear structure.',
        'There was no visible way to request a quote — a phone number was buried in the footer.',
        'The layout did not adapt well to mobile screens, where most visitors were likely browsing from.'
      ],
      redesign: [
        'Reorganized services into clear, scannable categories.',
        'Added a prominent "Request a Free Quote" button in the header and throughout the page.',
        'Introduced a dedicated service-area section so customers can quickly confirm coverage.',
        'Rebuilt the layout mobile-first, with large tap targets and readable type at every size.'
      ],
      result: [
        'Clearer navigation between services, service area, and contact information.',
        'A stronger, more obvious call to action for requesting a quote.',
        'A significantly improved experience for visitors on phones.',
        'A visual style that feels current and trustworthy rather than dated.'
      ]
    },
    auto: {
      eyebrow: '02 — Auto Detailing · Redesign Concept',
      title: 'Redline Auto Detail',
      image: 'auto-after.svg',
      problem: [
        'The old site relied on small, low-quality photos that undersold the quality of the work.',
        'Pricing was not listed anywhere, leaving visitors unsure what to expect.',
        'There was no online booking option — customers had to call during business hours.',
        'The overall design looked unfinished, which can undermine trust for a detail-focused business.'
      ],
      redesign: [
        'Built the homepage around large, high-quality imagery of finished work.',
        'Added a clear, simple pricing table broken out by package.',
        'Introduced a straightforward "Book Now" path visible from every section.',
        'Tightened the visual design so the site itself reflects the same care as the service.'
      ],
      result: [
        'A more persuasive first impression built on strong imagery.',
        'Transparent, easy-to-compare pricing.',
        'A simple, obvious path to booking an appointment.',
        'A design that signals professionalism and attention to detail.'
      ]
    },
    restaurant: {
      eyebrow: '03 — Restaurant · Redesign Concept',
      title: 'The Copper Fork',
      image: 'restaurant-after.svg',
      problem: [
        'The menu was only available as a low-resolution scanned PDF, hard to read on mobile.',
        'Hours of operation were inconsistent across different pages of the old site.',
        'The location and directions were difficult to find, with no embedded map.',
        'There was no way to request a reservation online.'
      ],
      redesign: [
        'Rebuilt the menu as clean, readable, categorized sections directly on the page.',
        'Centralized hours, location, and contact details in one always-visible area.',
        'Added a simple reservation request section near the top of the page.',
        'Designed the layout to feel warm and inviting while staying easy to navigate.'
      ],
      result: [
        'A menu that is actually easy to read on a phone.',
        'Hours and location that are consistent and easy to find.',
        'A clear, low-friction way to request a table.',
        'A more inviting first impression for new diners.'
      ]
    }
  };

  function initCaseStudyModal() {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    const closeBtn = document.getElementById('modalClose');
    if (!overlay || !content || !closeBtn) return;

    let lastFocused = null;

    function buildContent(data) {
      const list = (items) => items.map((i) => `<li>${i}</li>`).join('');
      content.innerHTML = `
        <p class="case-eyebrow">${data.eyebrow}</p>
        <h2 class="case-title" id="modalTitle">${data.title}</h2>
        <div class="case-thumb">
          <img src="${data.image}" alt="Redesign concept for ${data.title}" width="800" height="450">
        </div>
        <div class="case-block">
          <h3>The Problem</h3>
          <ul>${list(data.problem)}</ul>
        </div>
        <div class="case-block">
          <h3>The Redesign</h3>
          <ul>${list(data.redesign)}</ul>
        </div>
        <div class="case-block">
          <h3>The Result</h3>
          <ul>${list(data.result)}</ul>
        </div>
        <p class="case-disclaimer">This is a redesign concept created by OK Studios to demonstrate our design approach. It is not a live client project, and no business performance claims are being made.</p>
      `;
    }

    function openModal(key) {
      const data = caseStudies[key];
      if (!data) return;
      lastFocused = document.activeElement;
      buildContent(data);
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeModal() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('[data-open-case]').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn.getAttribute('data-open-case')));
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !overlay.classList.contains('is-open')) return;
      const focusables = overlay.querySelectorAll('button, a, input, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ============================================================
     CONTACT FORM (frontend demo — structured for a real backend)
     ============================================================ */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    if (!form || !status) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const data = {
        name: form.name.value.trim(),
        business: form.business.value.trim(),
        email: form.email.value.trim(),
        website: form.website.value.trim(),
        details: form.details.value.trim()
      };

      if (!data.name || !data.business || !data.email) {
        status.textContent = 'Please fill in your name, business name, and email.';
        status.classList.remove('is-success');
        return;
      }

      // Placeholder for a real submission, e.g.:
      // fetch('/api/contact', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
      console.log('OK Studios — Free Website Review request:', data);

      status.textContent = `Thanks, ${data.name.split(' ')[0]}! We got your request and will be in touch soon.`;
      status.classList.add('is-success');
      form.reset();
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initHeroAnimation();
    initScrollReveal();
    initNavElevation();
    initSliders();
    initProcessTimeline();
    initCaseStudyModal();
    initContactForm();
  });
})();
