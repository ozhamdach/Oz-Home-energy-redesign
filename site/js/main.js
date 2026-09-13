(function () {
  'use strict';

  // Analytics integration points — see docs/analytics-integration.md and the
  // comment on window.dataLayer's declaration in src/layout.html. Pushing to
  // this array is a no-op for anyone's actual analytics until a real GTM
  // container is installed; it exists now so wiring one up later needs no
  // further code changes.
  function pushEvent(name, data) {
    if (!window.dataLayer) return;
    window.dataLayer.push(Object.assign({ event: name }, data || {}));
  }

  // Phone/email click-to-contact events. No "lead received" event is fired
  // anywhere client-side — see the note above the prototype-form handler
  // below for why that has to come from HighLevel/the server side instead.
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      pushEvent('phone_click', { link_url: a.getAttribute('href') });
    });
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      pushEvent('email_click', { link_url: a.getAttribute('href') });
    });
  });
  // One form_start event per form, on first interaction — not on page load,
  // so this reflects genuine engagement rather than every pageview.
  document.querySelectorAll('form[data-prototype-form], #assessmentForm').forEach(function (form) {
    var started = false;
    form.addEventListener(
      'focusin',
      function () {
        if (started) return;
        started = true;
        pushEvent('form_start', { form_id: form.id });
      },
      true
    );
  });

  // Sitewide attribution capture: store first-touch UTM/click params so they
  // survive navigation to the assessment form, even if the visitor lands on
  // a service page first. Never overwrites an existing stored value.
  (function captureAttribution() {
    try {
      var params = new URLSearchParams(window.location.search);
      // campaign_id/adset_id/ad_id/placement added for the Meta paid-social
      // funnel (see docs/08-commercial-battery-assessment-funnel.md §4) —
      // plain ad-attribution identifiers, not PII, safe to capture sitewide.
      // site_source_name/creative_strategy added for the BESS3/BESS4 funnel
      // v2 pass — Meta's own attribution parameter names, non-PII.
      var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'campaign_id', 'adset_id', 'ad_id', 'placement', 'site_source_name', 'creative_strategy'];
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

  // Populate every form's attribution hidden fields from the sessionStorage
  // captured above — generic by field `name`, so it works the same way on
  // all three lead forms (assessment, project enquiry, service request)
  // rather than each page wiring this up separately.
  (function populateAttributionFields() {
    try {
      var stored = JSON.parse(sessionStorage.getItem('ohe_attribution') || '{}');
      Object.keys(stored).forEach(function (k) {
        document.querySelectorAll('input[name="' + k + '"]').forEach(function (el) {
          el.value = stored[k];
        });
      });
    } catch (err) {
      /* attribution is best-effort */
    }
  })();

  // Footer year
  var y = document.getElementById('footerYear');
  if (y) y.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var toggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  function setMobileNavOpen(open) {
    mobileNav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      setMobileNavOpen(!mobileNav.classList.contains('is-open'));
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMobileNavOpen(false);
    });
  }

  // Desktop dropdown menus. Markup is <nav class="primary-nav"><ul><li>…,
  // so items live two levels down, not one — a bare ".primary-nav > li"
  // selector (in JS or CSS) never matches anything in that structure.
  var navItems = document.querySelectorAll('.primary-nav > ul > li');

  function closeDropdown(li) {
    li.classList.remove('is-open');
    var b = li.querySelector(':scope > button');
    if (b) b.setAttribute('aria-expanded', 'false');
  }
  function closeAllDropdowns(except) {
    navItems.forEach(function (li) {
      if (li !== except) closeDropdown(li);
    });
  }

  navItems.forEach(function (li) {
    var btn = li.querySelector(':scope > button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = li.classList.contains('is-open');
      closeAllDropdowns();
      if (!isOpen) {
        li.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    // Close this dropdown once focus moves somewhere outside it entirely
    // (covers Tabbing past the last link, not just a mouse click outside).
    li.addEventListener('focusout', function (e) {
      if (!li.contains(e.relatedTarget)) closeDropdown(li);
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.primary-nav')) closeAllDropdowns();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var openItem = null;
      navItems.forEach(function (li) {
        if (li.classList.contains('is-open')) openItem = li;
      });
      closeAllDropdowns();
      if (openItem) {
        var btn = openItem.querySelector(':scope > button');
        if (btn) btn.focus();
      }
      if (mobileNav && mobileNav.classList.contains('is-open')) {
        setMobileNavOpen(false);
        toggle.focus();
      }
    }
  });

  // No live HighLevel connection exists yet on this form (see the
  // data-hl-form-ref attribute on the <form> itself, and
  // docs/owner-inputs-required.md's integration checklist for exactly what
  // has to be supplied before it can go live). It has no `action`, is
  // always intercepted here, and — critically — never shows any success
  // affordance: a lead was NOT received, so nothing here may look like a
  // confirmation that it was. See docs/04-highlevel-integration.md.
  document.querySelectorAll('form[data-prototype-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var serviceFieldName = form.getAttribute('data-service-field');
      var serviceOut = form.querySelector('input[name="selected_service"]');
      if (serviceFieldName && serviceOut) {
        var vals = [];
        form.querySelectorAll('[name="' + serviceFieldName + '"]').forEach(function (f) {
          if (f.type === 'checkbox' || f.type === 'radio') {
            if (f.checked) vals.push(f.value);
          } else if (f.value) {
            vals.push(f.value);
          }
        });
        serviceOut.value = vals.join(', ');
      }
      // submitted_at is intentionally NOT set here — that timestamp should
      // reflect when a submission genuinely reaches HighLevel, not when a
      // disabled preview form was clicked.

      var wrap = document.createElement('div');
      wrap.className = 'lead-pending-notice';
      wrap.setAttribute('role', 'status');
      wrap.innerHTML =
        '<div class="icon-circle"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0540C1" stroke-width="1.8"/><path d="M12 8v5m0 3v.01" stroke="#0540C1" stroke-width="2" stroke-linecap="round"/></svg></div>' +
        '<h2>This form isn’t connected yet</h2>' +
        '<p class="lede" style="margin-inline:auto;">This website is still in development — nothing you entered was sent anywhere. Please call us directly and we can help right away.</p>' +
        '<p><a class="btn btn-primary" href="tel:+61435336336">Call 0435 336 336</a></p>';
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
