/* ============================================================
   HEGART STUDIO — shared behaviour
   Language toggle, scroll reveal, nav state, 3D tilt on service cards
   ============================================================ */
(function () {
  'use strict';

  var LANG_KEY = 'hegart-lang';
  var html = document.documentElement;

  function getPreferredLang() {
    var saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'de') return saved;
    return (navigator.language || '').toLowerCase().indexOf('de') === 0 ? 'de' : 'de';
  }

  function setLang(lang) {
    html.setAttribute('lang', lang);
    localStorage.setItem(LANG_KEY, lang);
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      var de = btn.querySelector('[data-lang-de]');
      var en = btn.querySelector('[data-lang-en]');
      if (de) de.classList.toggle('is-active', lang === 'de');
      if (en) en.classList.toggle('is-active', lang === 'en');
    });
  }

  setLang(getPreferredLang());

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.lang-toggle');
    if (!btn) return;
    var next = html.getAttribute('lang') === 'de' ? 'en' : 'de';
    setLang(next);
  });

  /* ---------- nav scroll state ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile nav burger ---------- */
  var burger = document.querySelector('.nav-burger');
  if (nav && burger) {
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- hero kinetic title: split into chars ---------- */
  document.querySelectorAll('[data-split-chars]').forEach(function (el) {
    var text = el.textContent;
    el.textContent = '';
    var delay = 0;
    text.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'char';
      if (ch === ' ') {
        span.innerHTML = '&nbsp;';
      } else {
        span.textContent = ch;
      }
      span.style.animationDelay = (0.15 + delay * 0.035) + 's';
      el.appendChild(span);
      delay++;
    });
  });

  /* ---------- scroll reveal ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- parallax fallback for browsers without scroll-driven animations ---------- */
  var supportsScrollTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  if (!reduceMotion && !supportsScrollTimeline) {
    var bgPhoto = document.querySelector('.hero-bg-photo');
    var glow = document.querySelector('.hero-glow');
    var fgPhoto = document.querySelector('.hero-fg-photo');
    var portfolioImgs = Array.prototype.slice.call(document.querySelectorAll('.portfolio-item img'));
    var ticking = false;

    function updateParallax() {
      var heroH = window.innerHeight;
      var y = window.scrollY;
      var heroProgress = Math.min(Math.max(y / heroH, 0), 1);

      if (bgPhoto) bgPhoto.style.transform = 'translateY(' + (heroProgress * 8) + '%)';
      if (glow) glow.style.transform = 'translateY(' + (heroProgress * 18) + '%)';
      if (fgPhoto) fgPhoto.style.transform = 'translateY(' + (heroProgress * -22) + '%) rotate(-2deg)';

      portfolioImgs.forEach(function (img) {
        var rect = img.parentElement.getBoundingClientRect();
        var center = rect.top + rect.height / 2 - window.innerHeight / 2;
        var progress = Math.max(Math.min(-center / window.innerHeight, 1), -1);
        var range = img.parentElement.classList.contains('parallax-fast') ? 11 : 4;
        img.style.transform = 'translateY(' + (progress * range) + '%)';
      });

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  /* ---------- 3D tilt on service cards ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.service-card').forEach(function (card) {
      var rect;
      function onMove(e) {
        rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          'rotateY(' + (x * 10) + 'deg) rotateX(' + (y * -10) + 'deg) translateY(-4px)';
      }
      function onLeave() {
        card.classList.remove('is-tilting');
        card.style.transform = '';
      }
      card.addEventListener('mouseenter', function () { card.classList.add('is-tilting'); });
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }
})();

/* ---------- contact form (AJAX submit via Formspree) ---------- */
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var successBox = document.getElementById('contact-form-success');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function (response) {
      if (response.ok) {
        form.reset();
        form.style.display = 'none';
        if (successBox) successBox.classList.add('is-visible');
      } else {
        submitBtn.disabled = false;
        alert('Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt per WhatsApp.');
      }
    }).catch(function () {
      submitBtn.disabled = false;
      alert('Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt per WhatsApp.');
    });
  });
})();
