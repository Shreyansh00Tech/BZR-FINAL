/* Blue Zone Residency: phone-first interactions (no dependencies) */
(() => {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const html = document.documentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Web3Forms public key (safe in the browser). Restrict it to bzr.co.in in the Web3Forms dashboard.
    const ACCESS_KEY = '3eae7367-7a3d-4220-a1f2-fa63970c84bd';
    const PHONE_RE = /^(?:\+?91)?[6-9]\d{9}$/;
    const SHARE = { title: 'Blue Zone Residency, Noida', text: 'Luxury 2 & 3 BHK homes in Noida from ₹60 Lakh*', url: 'https://www.bzr.co.in/' };

    /* ---------- helpers ---------- */
    let locks = 0;
    const lock = () => { locks++; html.classList.add('is-locked'); };
    const unlock = () => { locks = Math.max(0, locks - 1); if (!locks) html.classList.remove('is-locked'); };

    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not(.hp),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
    const trapTab = (e, root) => {
        if (e.key !== 'Tab') return;
        const items = $$(FOCUSABLE, root).filter(el => el.getClientRects().length);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- top bar ---------- */
    const topbar = $('#topbar');
    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            topbar.classList.toggle('is-stuck', window.scrollY > 24);
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- thumb bar appears once the hero buttons scroll away ---------- */
    const dock = $('#dock');
    const heroCta = $('.hero-cta');
    if (dock && heroCta && 'IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => {
            dock.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0);
        }).observe(heroCta);
    } else if (dock) {
        dock.classList.add('is-on');
    }

    /* ---------- menu ---------- */
    const menu = $('#menu');
    const menuBtn = $('#menuBtn');
    const menuClose = $('#menuClose');
    const openMenu = () => {
        menu.hidden = false;
        menuBtn.setAttribute('aria-expanded', 'true');
        lock();
        menuClose.focus();
    };
    const closeMenu = (restore = true) => {
        if (menu.hidden) return;
        menu.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
        unlock();
        if (restore) menuBtn.focus({ preventScroll: true });
    };
    menuBtn.addEventListener('click', openMenu);
    menuClose.addEventListener('click', () => closeMenu());
    $$('.menu-links a', menu).forEach(a => a.addEventListener('click', () => closeMenu(false)));
    menu.addEventListener('keydown', e => trapTab(e, menu));

    const shareBtn = $('#shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            try {
                if (navigator.share) {
                    await navigator.share(SHARE);
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(SHARE.url);
                    shareBtn.lastChild.textContent = ' Link copied';
                    setTimeout(() => { shareBtn.lastChild.textContent = ' Share this page'; }, 2200);
                }
            } catch (_) { /* user cancelled */ }
        });
    }

    /* ---------- count-up numbers ---------- */
    const counters = $$('[data-count]');
    const run = el => {
        const end = Number(el.dataset.count);
        const t0 = performance.now();
        const dur = 1500;
        const tick = t => {
            const p = Math.min(1, (t - t0) / dur);
            el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };
    if (!reduce && 'IntersectionObserver' in window) {
        counters.forEach(el => { el.textContent = '0'; });
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
        }, { threshold: 0.6 });
        counters.forEach(el => io.observe(el));
    }

    /* ---------- gallery rail ---------- */
    const rail = $('#rail');
    const thumb = $('#railThumb');
    const shots = $$('.shot', rail);
    const syncRail = () => {
        const max = rail.scrollWidth - rail.clientWidth;
        if (max <= 0) { thumb.style.width = '100%'; thumb.style.transform = 'none'; return; }
        const ratio = rail.clientWidth / rail.scrollWidth;
        const p = rail.scrollLeft / max;
        thumb.style.width = (ratio * 100) + '%';
        thumb.style.transform = 'translateX(' + (p * (1 / ratio - 1) * 100) + '%)';
    };
    rail.addEventListener('scroll', syncRail, { passive: true });
    window.addEventListener('resize', syncRail);
    syncRail();
    $$('[data-rail]').forEach(b => b.addEventListener('click', () => {
        const step = (shots[0].offsetWidth + 14) * 1.5 * Number(b.dataset.rail);
        rail.scrollBy({ left: step, behavior: reduce ? 'auto' : 'smooth' });
    }));
    rail.addEventListener('keydown', e => {
        if (e.target !== rail) return;
        if (e.key === 'ArrowRight') rail.scrollBy({ left: 300, behavior: 'smooth' });
        if (e.key === 'ArrowLeft') rail.scrollBy({ left: -300, behavior: 'smooth' });
    });

    /* ---------- lightbox ---------- */
    const lb = $('#lb');
    const lbImg = $('#lbImg');
    const lbTitle = $('#lbTitle');
    const lbSpec = $('#lbSpec');
    const lbClose = $('#lbClose');
    let idx = 0;

    const preload = i => { const s = shots[(i + shots.length) % shots.length]; if (s) new Image().src = s.dataset.full; };
    const showShot = (i, first) => {
        idx = (i + shots.length) % shots.length;
        const s = shots[idx];
        const tile = $('img', s);
        lbTitle.textContent = s.dataset.title;
        lbSpec.textContent = s.dataset.spec;
        lbImg.alt = tile.alt;
        // show the already-loaded tile straight away, then swap in the large version
        if (first) lbImg.src = tile.currentSrc || tile.src;
        else lbImg.classList.add('is-swap');
        const big = new Image();
        const done = () => { lbImg.src = s.dataset.full; requestAnimationFrame(() => lbImg.classList.remove('is-swap')); };
        big.onload = done; big.onerror = done;
        big.src = s.dataset.full;
        preload(idx + 1); preload(idx - 1);
    };
    const openLb = i => {
        lb.hidden = false;
        lock();
        showShot(i, true);
        lbClose.focus();
    };
    const closeLb = () => {
        if (lb.hidden) return;
        lb.hidden = true;
        unlock();
        shots[idx].scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
        shots[idx].focus({ preventScroll: true });
    };
    shots.forEach((s, i) => s.addEventListener('click', () => openLb(i)));
    lbClose.addEventListener('click', closeLb);
    $('#lbPrev').addEventListener('click', () => showShot(idx - 1));
    $('#lbNext').addEventListener('click', () => showShot(idx + 1));
    lb.addEventListener('keydown', e => trapTab(e, lb));
    let sx = 0, sy = 0;
    const stage = $('.lb-stage', lb);
    stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) showShot(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
    stage.addEventListener('click', e => { if (e.target === stage) closeLb(); });

    /* ---------- 2 BHK / 3 BHK tabs ---------- */
    const tabs = $$('.seg-btn');
    const selectTab = t => {
        tabs.forEach(b => {
            const on = b === t;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-selected', String(on));
            b.tabIndex = on ? 0 : -1;
            document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
        });
    };
    tabs.forEach((b, i) => {
        b.addEventListener('click', () => selectTab(b));
        b.addEventListener('keydown', e => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
            selectTab(next); next.focus();
        });
    });

    /* ---------- FAQ ---------- */
    $$('.acc-q').forEach(q => q.addEventListener('click', () => {
        const item = q.closest('.acc-item');
        const open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        q.setAttribute('aria-expanded', String(open));
    }));

    /* ---------- lead forms (inline + bottom sheet) ---------- */
    const tpl = $('#leadTpl');
    const sheet = $('#sheet');
    const sheetSlot = $('[data-form-slot]', sheet);

    const wireForm = slot => {
        slot.appendChild(tpl.content.cloneNode(true));
        const form = $('.lead-form', slot);
        const thanks = $('.thanks', slot);
        const msg = $('.form-msg', form);
        const btn = $('button[type="submit"]', form);
        const f = form.elements;

        const fail = (text, input) => {
            msg.textContent = text;
            msg.hidden = false;
            if (input) { input.closest('.field').classList.add('is-bad'); input.focus(); }
        };
        $$('.field input', form).forEach(i => i.addEventListener('input', () => {
            i.closest('.field').classList.remove('is-bad');
            msg.hidden = true;
        }));

        const success = () => {
            form.reset();
            form.hidden = true;
            thanks.hidden = false;
            thanks.setAttribute('tabindex', '-1');
            thanks.focus({ preventScroll: true });
            thanks.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
        };

        form.addEventListener('submit', async e => {
            e.preventDefault();
            msg.hidden = true;
            $$('.field', form).forEach(x => x.classList.remove('is-bad'));

            const name = f['name'].value.trim();
            const phone = f['phone'].value.replace(/[\s-]/g, '');
            if (name.length < 2) return fail('Please enter your name.', f['name']);
            if (!PHONE_RE.test(phone)) return fail('Please enter a valid 10-digit Indian mobile number.', f['phone']);
            if (f['botcheck'].checked) return success(); // honeypot: pretend it worked

            const payload = {
                access_key: ACCESS_KEY,
                subject: 'New site-visit enquiry: Blue Zone Residency',
                from_name: 'bzr.co.in website',
                name,
                phone,
                property: (form.querySelector('input[name="property"]:checked') || {}).value || '',
                date: f['date'].value,
                time: f['time'].value,
                message: f['message'].value.trim()
            };
            Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });

            btn.disabled = true;
            btn.classList.add('is-loading');
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 15000);
            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(payload),
                    signal: ctrl.signal
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.success === false) throw new Error(data.message || 'Request failed');
                success();
            } catch (_) {
                fail('We could not send your request. Please try again, or call +91 96504 04888.');
            } finally {
                clearTimeout(timer);
                btn.disabled = false;
                btn.classList.remove('is-loading');
            }
        });
    };
    $$('[data-form-slot]').forEach(wireForm);

    /* ---------- bottom sheet ---------- */
    let sheetTrigger = null;
    let sheetTimer = 0;
    let autoMsg = '';
    const openSheet = (property, trigger, message) => {
        clearTimeout(sheetTimer);
        closeMenu(false);
        sheetTrigger = trigger || document.activeElement;
        const form = $('.lead-form', sheetSlot);
        const thanks = $('.thanks', sheetSlot);
        form.hidden = false; thanks.hidden = true;
        if (property) {
            const radio = $$('input[name="property"]', form).find(r => r.value === property);
            if (radio) radio.checked = true;
        }
        const msgBox = form.elements['message'];
        if (message) { msgBox.value = message; autoMsg = message; }
        else if (autoMsg && msgBox.value === autoMsg) { msgBox.value = ''; autoMsg = ''; }
        sheet.hidden = false;
        lock();
        void sheet.offsetWidth; // let the browser paint the closed state first
        sheet.classList.add('is-open');
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        (coarse ? $('.sheet-x', sheet) : form.elements['name']).focus({ preventScroll: true });
    };
    const closeSheet = () => {
        if (sheet.hidden) return;
        sheet.classList.remove('is-open');
        unlock();
        const done = () => { sheet.hidden = true; };
        if (reduce) done(); else sheetTimer = setTimeout(done, 380);
        if (sheetTrigger && sheetTrigger.focus) sheetTrigger.focus({ preventScroll: true });
    };
    document.addEventListener('click', e => {
        const open = e.target.closest('[data-open-sheet]');
        if (open) { e.preventDefault(); openSheet(open.dataset.property, open, open.dataset.message); return; }
        if (e.target.closest('[data-close-sheet]')) closeSheet();
    });
    sheet.addEventListener('keydown', e => trapTab(e, sheet));

    /* ---------- Escape closes whatever is open ---------- */
    document.addEventListener('keydown', e => {
        if (!lb.hidden) {
            if (e.key === 'Escape') closeLb();
            else if (e.key === 'ArrowRight') showShot(idx + 1);
            else if (e.key === 'ArrowLeft') showShot(idx - 1);
            return;
        }
        if (e.key === 'Escape') {
            if (!sheet.hidden) closeSheet();
            else closeMenu();
        }
    });
})();
