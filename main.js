/* ==========================================================================
   BLUE ZONE RESIDENCY — MAIN JAVASCRIPT
   ========================================================================== */
'use strict';

// Web3Forms public access key (safe to expose; restrict it to bzr.co.in in the Web3Forms dashboard)
const WEB3FORMS_ACCESS_KEY = '3eae7367-7a3d-4220-a1f2-fa63970c84bd';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- FOOTER YEAR ---- */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---- SCROLL PROGRESS + BACK-TO-TOP ---- */
const scrollProgress = $('.scroll-progress');
const scrollTopBtn = $('#scrollTopBtn');
let ticking = false;

function onScroll() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
  if (scrollProgress) scrollProgress.style.width = `${progress * 100}%`;
  if (scrollTopBtn) scrollTopBtn.classList.toggle('active-state', window.scrollY > 400);
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(onScroll);
    ticking = true;
  }
}, { passive: true });
onScroll();

if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

/* ---- MOBILE NAV ---- */
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');

function setNav(open) {
  if (!navToggle || !navLinks) return;
  navLinks.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => setNav(!navLinks.classList.contains('open')));
  $$('a', navLinks).forEach(a => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.luxury-navbar')) setNav(false);
  });
}

/* ---- ACTIVE NAV LINK ON SCROLL ---- */
if ('IntersectionObserver' in window) {
  const linkFor = new Map();
  $$('.nav-links a').forEach(a => linkFor.set(a.getAttribute('href').slice(1), a));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      linkFor.forEach(a => a.classList.remove('active'));
      const link = linkFor.get(entry.target.id);
      if (link) link.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  linkFor.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
}

/* ---- SCROLL REVEAL ---- */
const revealEls = $$('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // also reveal blocks the user has already scrolled past (e.g. after an anchor jump)
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in-view'));
}

/* ---- FAQ ACCORDION ---- */
function setAccordion(item, open) {
  const trigger = $('.accordion-trigger', item);
  const panel = $('.accordion-content', item);
  const icon = $('i', trigger);
  item.classList.toggle('open-state', open);
  trigger.setAttribute('aria-expanded', String(open));
  panel.style.maxHeight = open ? `${panel.scrollHeight}px` : '0px';
  if (icon) {
    icon.classList.toggle('fa-minus', open);
    icon.classList.toggle('fa-plus', !open);
  }
}
$$('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.accordion-item');
    const willOpen = !item.classList.contains('open-state');
    $$('.accordion-item').forEach(other => { if (other !== item) setAccordion(other, false); });
    setAccordion(item, willOpen);
  });
});
window.addEventListener('resize', () => {
  $$('.accordion-item.open-state').forEach(item => {
    $('.accordion-content', item).style.maxHeight = `${$('.accordion-content', item).scrollHeight}px`;
  });
});

/* ---- CUSTOM CURSOR (mouse devices only) ---- */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (finePointer && !reduceMotion) {
  const ring = $('.luxury-cursor');
  const dot = $('.luxury-cursor-dot');
  let mx = 0, my = 0, rx = 0, ry = 0, running = false;

  const frame = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    if (ring) ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  };
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    document.documentElement.classList.add('cursor-on');
    if (dot) dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    if (!running) { running = true; requestAnimationFrame(frame); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => document.documentElement.classList.remove('cursor-on'));
}

/* ---- BACKGROUND CANVAS ---- */
(() => {
  const canvas = $('#webgl-blueprint-canvas');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0, h = 0;
  const pointer = { x: 0, y: 0, active: false };
  const maxPoints = window.innerWidth < 700 ? 18 : 35;
  const points = [];

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  for (let i = 0; i < maxPoints; i++) {
    points.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      r: Math.random() * 1.5 + 1
    });
  }
  window.addEventListener('resize', size);
  window.addEventListener('mousemove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; }, { passive: true });

  let raf = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();

      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 * (1 - dist / 180)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(draw);
  }
  draw();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else draw();
  });
})();

/* ---- MODALS ---- */
let lastFocus = null;
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  lastFocus = document.activeElement;
  modal.classList.add('display-state');
  modal.setAttribute('aria-hidden', 'false');
  const btn = $('.modal-close', modal);
  if (btn) btn.focus();
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('display-state');
  modal.setAttribute('aria-hidden', 'true');
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
}
window.closeModal = closeModal; // kept for backwards compatibility

$$('.modal-backdrop').forEach(modal => {
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal.id); });
});
$$('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  $$('.modal-backdrop.display-state').forEach(m => closeModal(m.id));
  setNav(false);
});

/* ---- ENQUIRY FORM ---- */
const form = $('#enquiryForm');
if (form) {
  const dateInput = $('#date');
  const formError = $('#formError');
  const submitBtn = $('.submit-btn', form);

  // No past dates
  if (dateInput) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    dateInput.min = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // "Enquire" buttons on the pricing cards pre-select the configuration
  $$('.flat-enquire-btn[data-property]').forEach(btn => {
    btn.addEventListener('click', () => {
      const select = $('#property');
      if (select) select.value = btn.dataset.property;
    });
  });

  const showError = (msg) => {
    if (!formError) return;
    formError.textContent = msg;
    formError.hidden = !msg;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');

    // Spam trap: bots tick the hidden box. Pretend success, send nothing.
    if ($('#botcheck', form)?.checked) {
      openModal('successModal');
      form.reset();
      return;
    }

    form.classList.add('was-validated');
    if (!form.checkValidity()) {
      const firstBad = form.querySelector(':invalid');
      if (firstBad) {
        showError(firstBad.id === 'phone'
          ? 'Please enter a valid 10-digit mobile number.'
          : 'Please fill in the highlighted fields.');
        firstBad.focus();
      }
      return;
    }

    const val = (id) => ($('#' + id)?.value || '').trim();
    const notGiven = (s) => s || 'Not provided';

    const data = new FormData();
    data.append('access_key', WEB3FORMS_ACCESS_KEY);
    data.append('subject', 'New Site Visit Lead - Blue Zone Residency');
    data.append('from_name', 'BZR Website');
    data.append('Name', val('name'));
    data.append('Phone Number', val('phone'));
    data.append('Email ID', notGiven(val('email')));
    data.append('Selected Configuration', val('property'));
    data.append('Preferred Date', notGiven(val('date')));
    data.append('Preferred Time', notGiven(val('time')));
    data.append('Custom Request Note', notGiven(val('message')));
    if (val('email')) data.append('replyto', val('email'));

    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true;
    form.classList.add('active-sync');
    submitBtn.setAttribute('aria-busy', 'true');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Submission failed');

      form.reset();
      form.classList.remove('was-validated');
      openModal('successModal');
    } catch (err) {
      console.error('Enquiry form error:', err);
      openModal('errorModal');
    } finally {
      clearTimeout(timer);
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      form.classList.remove('active-sync');
      submitBtn.innerHTML = originalLabel;
    }
  });
}
