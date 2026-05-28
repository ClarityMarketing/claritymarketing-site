// Marquee: hydrate from data-words attr (duplicate enough for seamless loop)
document.querySelectorAll('.marquee').forEach((m) => {
  let words = [];
  try { words = JSON.parse(m.dataset.words || '[]'); } catch (e) {}
  if (!words.length) return;
  const sep = m.dataset.sep || '•';
  const track = document.createElement('div');
  track.className = 'marquee__track';
  const repeats = 8;
  for (let r = 0; r < repeats; r++) {
    for (const w of words) {
      const s = document.createElement('span');
      s.textContent = w;
      track.appendChild(s);
      const sp = document.createElement('span');
      sp.className = 'marquee__sep';
      sp.textContent = sep;
      track.appendChild(sp);
    }
  }
  m.appendChild(track);
});

// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Stat counters
const countObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + '%';
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countObs.unobserve(el);
  });
}, { threshold: 0.6 });

// Reset to 0% before observing so the counter animation is visible when scrolled into view.
// (Template renders the final value as the no-JS fallback.)
document.querySelectorAll('.stats__num[data-count]').forEach((c) => {
  c.textContent = '0%';
  countObs.observe(c);
});

// ----- Cookie banner -----
(function cookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  const KEY = 'cm_cookie_consent';
  if (localStorage.getItem(KEY)) return;
  banner.hidden = false;
  requestAnimationFrame(() => banner.classList.add('is-in'));
  banner.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cookie]');
    if (!btn) return;
    localStorage.setItem(KEY, btn.dataset.cookie);
    banner.classList.remove('is-in');
    setTimeout(() => { banner.hidden = true; }, 450);
  });
})();

// ----- Calendly CTA popup (9s timer, once per browser) -----
(function ctaPopup() {
  const popup = document.getElementById('ctaPopup');
  if (!popup) return;
  const KEY = 'cm_popup_seen';
  if (localStorage.getItem(KEY)) return;

  // Skip on contact pages — Calendly already lives there
  const p = location.pathname;
  if (/kontakt-os|contact-us/i.test(p)) return;

  let shown = false;
  const open = () => {
    if (shown) return;
    shown = true;
    localStorage.setItem(KEY, '1');
    popup.hidden = false;
    requestAnimationFrame(() => popup.classList.add('is-in'));
    document.documentElement.style.overflow = 'hidden';
  };
  const close = () => {
    popup.classList.remove('is-in');
    document.documentElement.style.overflow = '';
    setTimeout(() => { popup.hidden = true; }, 350);
  };

  // Timer trigger (9s after page load)
  setTimeout(open, 9000);

  // Close handlers
  popup.addEventListener('click', (e) => {
    if (e.target.closest('[data-popup-close]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shown) close();
  });

  // Contact form: AJAX submit to Formspree, show success inline
  const form = popup.querySelector('#ctaPopupForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const success = form.querySelector('.cta-popup__success');
      const submit = form.querySelector('.cta-popup__submit');
      if (submit) { submit.disabled = true; submit.style.opacity = '0.6'; }
      try {
        const data = new FormData(form);
        const res = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          form.querySelectorAll('input, textarea, button').forEach((el) => el.style.display = 'none');
          if (success) success.hidden = false;
        } else {
          if (submit) { submit.disabled = false; submit.style.opacity = ''; }
          alert('Noget gik galt. Prøv venligst igen, eller skriv direkte til ella@claritymarketing.dk');
        }
      } catch (err) {
        if (submit) { submit.disabled = false; submit.style.opacity = ''; }
        alert('Noget gik galt. Prøv venligst igen, eller skriv direkte til ella@claritymarketing.dk');
      }
    });
  }
})();
