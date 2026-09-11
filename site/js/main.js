(function () {
  'use strict';

  // Sitewide attribution capture: store first-touch UTM/click params so they
  // survive navigation to the assessment form, even if the visitor lands on
  // a service page first. Never overwrites an existing stored value.
  (function captureAttribution() {
    try {
      var params = new URLSearchParams(window.location.search);
      var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
      var stored = JSON.parse(sessionStorage.getItem('ohe_attribution') || '{}');
      var changed = false;
      keys.forEach(function (k) {
        if (params.get(k) && !stored[k]) {
          stored[k] = params.get(k);
          changed = true;
        }
      });
      if (!stored.landing_page) {
        stored.landing_page = window.location.href;
        changed = true;
      }
      if (!stored.referrer) {
        stored.referrer = document.referrer || '';
        changed = true;
      }
      if (changed) sessionStorage.setItem('ohe_attribution', JSON.stringify(stored));
    } catch (err) {
      /* private browsing or storage disabled: attribution capture is best-effort */
    }
  })();

  // Footer year
  var y = document.getElementById('footerYear');
  if (y) y.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var toggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mobileNav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Desktop dropdown click support (keeps hover/focus for pointer + keyboard users)
  var navItems = document.querySelectorAll('.primary-nav > li');
  navItems.forEach(function (li) {
    var btn = li.querySelector(':scope > button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = li.classList.contains('is-open');
      navItems.forEach(function (other) {
        other.classList.remove('is-open');
        var b = other.querySelector(':scope > button');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        li.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.primary-nav')) {
      navItems.forEach(function (li) {
        li.classList.remove('is-open');
        var b = li.querySelector(':scope > button');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      navItems.forEach(function (li) {
        li.classList.remove('is-open');
      });
      if (mobileNav && mobileNav.classList.contains('is-open')) {
        mobileNav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }
  });

  // Prototype form handling: no live backend is connected yet, so submissions
  // are validated client-side and replaced with a clear placeholder confirmation
  // rather than posting anywhere. Wire to HighLevel before launch.
  document.querySelectorAll('form[data-prototype-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var wrap = document.createElement('div');
      wrap.className = 'assess-success';
      wrap.innerHTML =
        '<div class="icon-circle"><svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="#0540C1" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
        '<h2>Thanks — that\'s been noted.</h2>' +
        '<p class="lede" style="margin-inline:auto;">This is a design prototype: your details were not sent anywhere. Once this form is connected to Oz Home Energy\'s CRM, submissions here will reach the team directly.</p>' +
        '<p><a class="btn btn-secondary" href="tel:0420113216">Call 0420 113 216 instead</a></p>';
      form.replaceWith(wrap);
      wrap.setAttribute('tabindex', '-1');
      wrap.focus();
    });
  });

  // Pathway selector -> preselect assessment step 1 via query string
  document.querySelectorAll('[data-pathway]').forEach(function (el) {
    el.addEventListener('click', function () {
      var val = el.getAttribute('data-pathway');
      try {
        sessionStorage.setItem('ohe_pathway', val);
      } catch (err) {
        /* private browsing: ignore, assessment page falls back to step 1 */
      }
    });
  });
})();
