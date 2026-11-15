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

  function openDropdown(li, btn) {
    closeAllDropdowns(li);
    li.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  }

  // Hover-to-open is only wired up for input that can actually hover
  // (a real mouse) — on touch/coarse-pointer devices (including a tablet
  // at a desktop-width breakpoint) it would leave a dropdown stuck open
  // after a tap, with no mouse ever available to move away and close it.
  // Click and keyboard (Enter/Space via the button, Escape below) keep
  // working exactly as before regardless of this check's result.
  var canHover = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  navItems.forEach(function (li) {
    var btn = li.querySelector(':scope > button');
    if (!btn) return;
    // A real mouse click always hovers its target immediately before the
    // click fires (true in browsers generally, and specifically confirmed
    // against Playwright's .click(), which simulates the same sequence) —
    // so on a hover-capable device, mouseenter has usually already opened
    // this dropdown by the time the click handler below runs. Without this
    // flag, the click's own toggle logic would immediately close what
    // hover just opened. Keyboard activation (Enter/Space, no prior mouse
    // hover) never sets it, so toggle-open/close on repeated keypresses
    // still works exactly as before.
    var openedByHover = false;
    btn.addEventListener('click', function () {
      if (openedByHover) {
        openedByHover = false;
        return;
      }
      var isOpen = li.classList.contains('is-open');
      closeAllDropdowns();
      if (!isOpen) openDropdown(li, btn);
    });
    // Close this dropdown once focus moves somewhere outside it entirely
    // (covers Tabbing past the last link, not just a mouse click outside).
    li.addEventListener('focusout', function (e) {
      if (!li.contains(e.relatedTarget)) closeDropdown(li);
    });

    if (canHover) {
      var closeTimer = null;
      li.addEventListener('mouseenter', function () {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        openedByHover = true;
        openDropdown(li, btn);
      });
      // A short delay (not an instant close) tolerates the mouse briefly
      // leaving the hit area while moving from the button down into the
      // panel below it, and lets a keyboard user's focus-driven state win
      // if the two ever race.
      li.addEventListener('mouseleave', function () {
        closeTimer = setTimeout(function () {
          openedByHover = false;
          closeDropdown(li);
        }, 150);
      });
    }
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
        '<div class="icon-circle"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0560C1" stroke-width="1.8"/><path d="M12 8v5m0 3v.01" stroke="#0560C1" stroke-width="2" stroke-linecap="round"/></svg></div>' +
        '<h2>This form isn’t connected yet</h2>' +
        '<p class="lede" style="margin-inline:auto;">This website is still in development — nothing you entered was sent anywhere. Please call us directly and we can help right away.</p>' +
        '<p><a class="btn btn-primary" href="tel:+61435336336">Call 0435 336 336</a></p>';
      form.replaceWith(wrap);
      wrap.setAttribute('tabindex', '-1');
      wrap.focus();
    });
  });

  // Scroll-reveal: animate .reveal elements into view as they enter the viewport.
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // The embedded-form loading state used to live here. It now lives in the
  // "HighLevel form guard" block below, which knows whether the form really
  // arrived instead of trusting the iframe's load event.
})();

// =====================================================================
// HighLevel form guard (15 Nov 2026, quote-to-lead journey audit)
//
// Every lead form on the site is a HighLevel iframe served from
// https://link.ozhomeenergy.com.au. This block does four things for all of
// them (any <iframe> inside a .form-embed-wrap):
//
// 1. DEFERRED LOADING (unchanged from 6 Nov 2026). <iframe data-ohe-src>
//    only gets its src once its wrapper is within ~1000px of the screen.
//    Native loading="lazy" does not work: HighLevel's form_embed.js hides
//    the iframe until it loads, so the browser never starts loading it.
//
// 2. DID THE FORM REALLY LOAD? An iframe's load event fires for an error
//    page too ("refused to connect"), and this page cannot look inside a
//    cross-origin frame. What it can see is the form talking: HighLevel's
//    form posts messages to this page as soon as it runs ("iframeLoaded",
//    its size, "fetch-query-params"). A message whose origin is the form
//    domain AND whose source is that iframe's own window is proof the form
//    is running. The spinner stays until then. If nothing is heard within
//    FORM_TIMEOUT_MS, a notice appears above the form with "Try again" and
//    the phone number. The phone link does not depend on the form domain.
//    The notice is not destructive: the iframe stays in place, and if the
//    form turns up late the notice removes itself.
//
// 3. WAS AN ENQUIRY REALLY SENT? After HighLevel's server accepts a
//    submission (and only then), the form posts ["set-sticky-contacts", ...]
//    to this page and then sends the browser to /quote-received/. That
//    message is the confirmed-submit signal. Only its first element (the
//    message name) is read. ITS OTHER ELEMENTS HOLD THE VISITOR'S NAME,
//    EMAIL AND PHONE AND ARE NEVER READ, STORED OR SENT ANYWHERE BY THIS
//    SITE. All that is kept is a small marker in sessionStorage (form id,
//    page path, time) that /quote-received/ uses to count the lead once.
//    The same origin + source checks apply, so another site, an ad script
//    or the page itself cannot fake it.
//
// 4. AD SOURCE. HighLevel's script passes the current page's address tags
//    (utm_*, gclid, fbclid) into the form. It is only loaded on pages that
//    have a form, so a visitor who lands on a service page from an ad and
//    then clicks through to a form arrives with nothing for it to read.
//    This site already keeps the first-touch tags for the session
//    (captureAttribution above); for forms whose address this script sets,
//    they are added to the form's address when the current page's address
//    does not carry them. Only those seven standard tag names, never
//    contact details.
// =====================================================================
(function () {
  'use strict';
  var FORM_ORIGIN = 'https://link.ozhomeenergy.com.au';
  // Tests shorten the wait; real visitors get 12 seconds.
  var FORM_TIMEOUT_MS = typeof window.OHE_FORM_TIMEOUT_MS === 'number' ? window.OHE_FORM_TIMEOUT_MS : 12000;
  var AD_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
  var PHONE_HREF = 'tel:+61435336336';
  var PHONE_TEXT = '0435 336 336';

  function pushEvent(name, data) {
    if (!window.dataLayer) return;
    var payload = { event: name };
    for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) payload[k] = data[k];
    window.dataLayer.push(payload);
  }
  function store(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage off: best effort */ }
  }
  function isFormUrl(url) {
    return typeof url === 'string' && url.indexOf(FORM_ORIGIN + '/') === 0;
  }

  // Adds the session's first-touch ad tags to a form address, unless the
  // current page's own address already has that tag (HighLevel's script
  // passes those itself).
  function withAttribution(url) {
    if (!isFormUrl(url)) return url;
    try {
      var stored = JSON.parse(sessionStorage.getItem('ohe_attribution') || '{}');
      var here = new URLSearchParams(window.location.search);
      var extra = [];
      AD_KEYS.forEach(function (k) {
        var v = stored[k];
        if (typeof v !== 'string' || !v || v.length > 200) return;
        if (here.get(k)) return;
        if (new RegExp('[?&]' + k + '=').test(url)) return;
        extra.push(k + '=' + encodeURIComponent(v));
      });
      if (!extra.length) return url;
      return url + (url.indexOf('?') === -1 ? '?' : '&') + extra.join('&');
    } catch (e) {
      return url;
    }
  }

  var guards = [];

  function Guard(wrap, iframe) {
    this.wrap = wrap;
    this.iframe = iframe;
    this.loadingEl = wrap.querySelector('.form-embed-loading');
    this.formId = iframe.getAttribute('data-form-id') || '';
    this.alive = false;
    this.timer = null;
    this.notice = null;
    this.failedReported = false;
  }
  Guard.prototype.start = function () {
    var self = this;
    if (self.timer) clearTimeout(self.timer);
    self.alive = false;
    if (self.loadingEl) self.loadingEl.style.display = '';
    self.timer = setTimeout(function () { if (!self.alive) self.showNotice(); }, FORM_TIMEOUT_MS);
  };
  Guard.prototype.markAlive = function () {
    if (this.alive) return;
    this.alive = true;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.loadingEl) this.loadingEl.style.display = 'none';
    this.hideNotice();
    this.wrap.setAttribute('data-form-state', 'ready');
    store('ohe_form_seen', { form: this.formId, page: window.location.pathname, ts: Date.now() });
    pushEvent('form_ready', { form_id: this.formId });
  };
  Guard.prototype.hideNotice = function () {
    if (this.notice && this.notice.parentNode) this.notice.parentNode.removeChild(this.notice);
    this.notice = null;
  };
  Guard.prototype.showNotice = function () {
    var self = this;
    if (self.notice) return;
    if (self.loadingEl) self.loadingEl.style.display = 'none';
    self.wrap.setAttribute('data-form-state', 'failed');
    var box = document.createElement('div');
    box.className = 'form-embed-notice';
    box.setAttribute('role', 'alert');
    var h = document.createElement('p');
    h.className = 'form-embed-notice-title';
    h.textContent = 'The form is taking too long to load.';
    var p = document.createElement('p');
    p.textContent = 'Some networks and content blockers stop it. Nothing has been sent yet, and your answers on this page are still here. Try again, or call us and we will take your details over the phone.';
    var row = document.createElement('div');
    row.className = 'form-embed-notice-actions';
    var retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn btn-primary';
    retry.textContent = 'Try again';
    retry.addEventListener('click', function () { self.retry(); });
    var call = document.createElement('a');
    call.className = 'btn btn-secondary';
    call.href = PHONE_HREF;
    call.textContent = 'Call ' + PHONE_TEXT;
    call.addEventListener('click', function () { pushEvent('phone_click', { link_url: PHONE_HREF }); });
    row.appendChild(retry); row.appendChild(call);
    box.appendChild(h); box.appendChild(p); box.appendChild(row);
    self.wrap.insertBefore(box, self.wrap.firstChild);
    self.notice = box;
    if (!self.failedReported) {
      self.failedReported = true;
      pushEvent('form_load_failed', { form_id: self.formId });
    }
  };
  Guard.prototype.retry = function () {
    var src = this.iframe.getAttribute('src');
    if (!src) return;
    this.hideNotice();
    this.wrap.setAttribute('data-form-state', 'loading');
    // Re-setting src reloads the iframe. Answers chosen in the steps live on
    // this page, not in the iframe, so they are kept.
    this.iframe.setAttribute('src', src);
    this.start();
  };

  document.querySelectorAll('.form-embed-wrap').forEach(function (wrap) {
    var iframe = wrap.querySelector('iframe');
    if (!iframe) return;
    var g = new Guard(wrap, iframe);
    guards.push(g);
    // Deferred embeds start their clock when they actually begin loading.
    iframe.addEventListener('ohe:embedstart', function () { g.start(); });
    if (iframe.getAttribute('src')) g.start();
  });

  window.addEventListener('message', function (e) {
    if (e.origin !== FORM_ORIGIN) return;
    var g = null;
    for (var i = 0; i < guards.length; i++) {
      if (guards[i].iframe.contentWindow === e.source) { g = guards[i]; break; }
    }
    if (!g) return;
    g.markAlive();
    // Only the message name is read. See note 3 at the top of this block.
    if (Array.isArray(e.data) && e.data[0] === 'set-sticky-contacts') {
      store('ohe_lead_pending', { form: g.formId, page: window.location.pathname, ts: Date.now() });
      try { sessionStorage.removeItem('ohe_quote_steps'); } catch (err) { /* best effort */ }
    }
  });

  // Deferred loading.
  function load(f) {
    if (f.getAttribute('src')) return;
    f.setAttribute('src', withAttribution(f.getAttribute('data-ohe-src')));
    try { f.dispatchEvent(new Event('ohe:embedstart')); } catch (e) { /* old browsers: the notice timer simply never starts */ }
  }
  // Used by /js/quote-steps.js, which sets the form address itself.
  window.OHE = window.OHE || {};
  window.OHE.formUrl = withAttribution;

  var frames = document.querySelectorAll('iframe[data-ohe-src]');
  if (!frames.length) return;
  if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(frames, load); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      load(e.target.__oheFrame);
      io.unobserve(e.target);
    });
  }, { rootMargin: '1000px 0px' });
  Array.prototype.forEach.call(frames, function (f) {
    var wrap = (f.closest && f.closest('.form-embed-wrap')) || f.parentElement;
    wrap.__oheFrame = f;
    io.observe(wrap);
  });
})();

/* Swipeable photo rows (.photo-gallery--swipe, phones only). A region that
   scrolls sideways must be reachable from the keyboard, so while a row
   actually overflows it gets a tab stop and a name. On wider screens it is
   an ordinary grid and gets neither, so there is no empty tab stop. */
(function () {
  'use strict';
  var rows = document.querySelectorAll('.photo-gallery--swipe');
  if (!rows.length) return;
  function sync() {
    Array.prototype.forEach.call(rows, function (row) {
      if (row.scrollWidth > row.clientWidth + 1) {
        row.setAttribute('tabindex', '0');
        row.setAttribute('role', 'region');
        row.setAttribute('aria-label', 'Recent installs. Swipe or use the arrow keys for more photos.');
      } else {
        row.removeAttribute('tabindex');
        row.removeAttribute('role');
        row.removeAttribute('aria-label');
      }
    });
  }
  sync();
  window.addEventListener('resize', sync);
  window.addEventListener('load', sync);
})();

