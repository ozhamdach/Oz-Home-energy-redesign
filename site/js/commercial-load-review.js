(function () {
  'use strict';

  var form = document.getElementById('clrForm');
  if (!form) return;

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // -----------------------------------------------------------------------
  // Analytics: dataLayer + Meta pixel. Both loaded globally in src/layout.html
  // (GTM-KTGM7X5H / pixel 1375668011396700) — this only ever fires named
  // custom events with non-identifying parameters. Never pass name, email,
  // phone, business name, address or bill content here — see the hard rule
  // in the brief this page was built against.
  // -----------------------------------------------------------------------
  function fireEvent(name, params) {
    params = params || {};
    if (window.dataLayer) window.dataLayer.push(Object.assign({ event: name }, params));
    if (window.fbq) window.fbq('trackCustom', name, params);
  }

  fireEvent('lp_view');

  var startedForm = false;
  form.addEventListener(
    'focusin',
    function () {
      if (startedForm) return;
      startedForm = true;
      fireEvent('form_start');
    },
    true
  );

  // -----------------------------------------------------------------------
  // Attribution: first-touch (ft_, localStorage, never overwritten) and
  // latest-touch (lt_, this session's current values) — both submitted.
  // -----------------------------------------------------------------------
  var TRACK_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'fbclid', 'campaign_id', 'adset_id', 'ad_id', 'placement',
  ];
  var SESSION_KEY = 'clr_session_touch';

  function readQueryParams() {
    var params = new URLSearchParams(window.location.search);
    var out = {};
    TRACK_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) out[k] = v;
    });
    return out;
  }

  function loadSessionValues() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  // Merge this load's query params over whatever the session already has —
  // persisted so a reload (which may drop the query string) still carries
  // the values captured on first landing.
  var sessionVals = loadSessionValues();
  var queryVals = readQueryParams();
  TRACK_KEYS.forEach(function (k) {
    if (queryVals[k]) sessionVals[k] = queryVals[k];
  });
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionVals));
  } catch (e) {
    /* private browsing: attribution capture is best-effort */
  }

  var firstTouch = {};
  TRACK_KEYS.forEach(function (k) {
    var stored = null;
    try {
      stored = localStorage.getItem('ft_' + k);
    } catch (e) {
      /* private browsing: first-touch persistence is best-effort */
    }
    if (stored) {
      firstTouch[k] = stored;
    } else if (sessionVals[k]) {
      firstTouch[k] = sessionVals[k];
      try {
        localStorage.setItem('ft_' + k, sessionVals[k]);
      } catch (e) {
        /* private browsing: ignore */
      }
    }
  });
  var latestTouch = sessionVals;

  TRACK_KEYS.forEach(function (k) {
    var ftField = document.getElementById('ft_' + k);
    if (ftField) ftField.value = firstTouch[k] || '';
    var ltField = document.getElementById('lt_' + k);
    if (ltField) ltField.value = latestTouch[k] || '';
  });

  // -----------------------------------------------------------------------
  // Progressive reveal. Radio groups reveal the next question after the
  // selection settles (debounced) rather than on every 'change' — a native
  // radio group fires 'change' on every arrow-key step as keyboard focus
  // moves through it, so revealing immediately would yank a keyboard user
  // forward mid-navigation, before they've actually chosen an answer.
  // -----------------------------------------------------------------------
  var REVEAL_DELAY = 400;
  var announce = document.getElementById('clrFormAnnounce');

  function say(text) {
    if (announce) announce.textContent = text;
  }

  function reveal(el) {
    if (!el || !el.hidden) return;
    el.hidden = false;
    el.setAttribute('data-revealed', 'true');
    var focusTarget = el.querySelector('input, select, textarea');
    var behavior = reduceMotion ? 'auto' : 'smooth';
    el.scrollIntoView({ behavior: behavior, block: 'start' });
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    var legend = el.querySelector('legend');
    say(legend ? 'Next question: ' + legend.textContent : 'Next question revealed.');
  }

  function wireRadioReveal(fieldsetEl, radioName, onSettled) {
    var timer = null;
    fieldsetEl.addEventListener('change', function (e) {
      if (e.target.name !== radioName) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        onSettled(e.target.value);
      }, REVEAL_DELAY);
    });
  }

  var q1 = document.getElementById('clrQ1');
  var q2 = document.getElementById('clrQ2');
  var q3 = document.getElementById('clrQ3');
  var q4 = document.getElementById('clrQ4');
  var q5 = document.getElementById('clrQ5');
  var contact = document.getElementById('clrContact');
  var exitSiteType = document.getElementById('clrExitSiteType');
  var exitPostcode = document.getElementById('clrExitPostcode');
  var submitBtn = document.getElementById('clrSubmit');

  function goOutOfScope(exitPanel, reason) {
    fireEvent('out_of_scope', { reason: reason });
    q1.hidden = true;
    [q2, q3, q4, q5, contact].forEach(function (el) {
      el.hidden = true;
    });
    exitPanel.hidden = false;
    exitPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    exitPanel.focus({ preventScroll: true });
  }

  wireRadioReveal(q1, 'siteType', function (value) {
    fireEvent('site_type_selected', { site_type: value });
    if (value === 'home') {
      goOutOfScope(exitSiteType, 'individual_home');
      return;
    }
    if (value === 'datacentre') {
      goOutOfScope(exitSiteType, 'data_centre');
      return;
    }
    reveal(q2);
  });

  // NSW postcode range check. Approximates the well-known NSW range
  // (2000-2999) while excluding the ACT enclaves that also fall in that
  // band (2600-2618, 2900-2920) — not an exhaustive Australia Post lookup,
  // but a reasonable silent gate for this purpose.
  function isNswPostcode(pc) {
    if (!/^\d{4}$/.test(pc)) return false;
    var n = parseInt(pc, 10);
    if (n >= 2600 && n <= 2618) return false;
    if (n >= 2900 && n <= 2920) return false;
    return n >= 2000 && n <= 2999;
  }

  var suburbInput = document.getElementById('clrSuburb');
  var postcodeInput = document.getElementById('clrPostcode');
  (function wireQ2() {
    var timer = null;
    function check() {
      var suburb = suburbInput.value.trim();
      var postcode = postcodeInput.value.trim();
      if (!suburb || postcode.length !== 4) return;
      if (!isNswPostcode(postcode)) {
        goOutOfScope(exitPostcode, 'non_nsw');
        return;
      }
      reveal(q3);
    }
    [suburbInput, postcodeInput].forEach(function (input) {
      input.addEventListener('input', function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(check, 500);
      });
    });
  })();

  wireRadioReveal(q3, 'loadPattern', function () {
    reveal(q4);
  });
  wireRadioReveal(q4, 'spendBand', function () {
    reveal(q5);
  });
  wireRadioReveal(q5, 'decisionRole', function () {
    // "I'd need to ask someone else" must not block submission — it's just
    // another value here, no special-casing needed to let it through.
    reveal(contact);
  });

  // -----------------------------------------------------------------------
  // Contact-stage validation + submission.
  // -----------------------------------------------------------------------
  var errorSummary = document.getElementById('clrErrorSummary');
  var errorSummaryList = document.getElementById('clrErrorSummaryList');
  var contactError = document.getElementById('clrContactError');
  var submitError = document.getElementById('clrSubmitError');

  var CONTACT_FIELDS = [
    { id: 'clrFullName', label: 'Full name' },
    { id: 'clrBusinessName', label: 'Business name' },
    { id: 'clrWorkEmail', label: 'Work email' },
    { id: 'clrPhone', label: 'Phone' },
  ];

  function validateContact() {
    var missing = [];
    CONTACT_FIELDS.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (!el.value.trim()) missing.push(f);
    });
    var consent = document.getElementById('clrConsent');
    var consentMissing = !consent.checked;

    if (!missing.length && !consentMissing) {
      errorSummary.hidden = true;
      contactError.classList.remove('is-visible');
      return true;
    }

    errorSummaryList.innerHTML = '';
    missing.forEach(function (f) {
      var li = document.createElement('li');
      li.innerHTML = '<a href="#' + f.id + '">' + f.label + ' is required</a>';
      errorSummaryList.appendChild(li);
    });
    if (consentMissing) {
      var li2 = document.createElement('li');
      li2.innerHTML = '<a href="#clrConsent">Please consent to being contacted</a>';
      errorSummaryList.appendChild(li2);
    }
    errorSummary.hidden = false;
    errorSummary.focus();
    contactError.classList.add('is-visible');
    return false;
  }

  function buildPayload() {
    function val(id) {
      var el = document.getElementById(id);
      return el ? el.value : '';
    }
    function radioVal(name) {
      var checked = form.querySelector('input[name="' + name + '"]:checked');
      return checked ? checked.value : '';
    }
    var attribution = { first_touch: {}, latest_touch: {} };
    TRACK_KEYS.forEach(function (k) {
      attribution.first_touch[k] = firstTouch[k] || '';
      attribution.latest_touch[k] = latestTouch[k] || '';
    });
    return {
      form: 'commercial_load_review',
      siteType: radioVal('siteType'),
      suburb: val('clrSuburb'),
      postcode: val('clrPostcode'),
      loadPattern: radioVal('loadPattern'),
      spendBand: radioVal('spendBand'),
      decisionRole: radioVal('decisionRole'),
      fullName: val('clrFullName'),
      businessName: val('clrBusinessName'),
      workEmail: val('clrWorkEmail'),
      phone: val('clrPhone'),
      consent: document.getElementById('clrConsent').checked,
      marketingConsent: document.getElementById('clrMarketing').checked,
      attribution: attribution,
      submitted_at: new Date().toISOString(),
      landing_page: window.location.href,
      referrer: document.referrer || '',
    };
  }

  var WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/iqh8HIe7GtEKNtnlIaho/webhook-trigger/83a43470-0989-4954-b4cf-55d62d8446c9';
  var submitting = false;
  var confirmPanel = document.getElementById('clrConfirm');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return;
    if (!validateContact()) return;

    submitting = true;
    submitBtn.disabled = true;
    submitError.hidden = true;

    var payload = buildPayload();

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Webhook responded ' + res.status);
        fireEvent('form_complete', {
          site_type: payload.siteType,
          load_pattern: payload.loadPattern,
          spend_band: payload.spendBand,
          decision_role: payload.decisionRole,
          utm_content: latestTouch.utm_content || '',
        });
        form.hidden = true;
        confirmPanel.hidden = false;
        confirmPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        confirmPanel.focus({ preventScroll: true });
      })
      .catch(function () {
        // Never lose the user's entries — the form stays exactly as they
        // left it, just re-enabled with a visible error, so they can retry
        // without re-answering anything.
        submitError.hidden = false;
        submitting = false;
        submitBtn.disabled = false;
      });
  });

  // -----------------------------------------------------------------------
  // Bill upload — appears only on the post-submit confirmation screen, and
  // is always optional/best-effort: the confirmation copy already tells the
  // visitor we'll email a link if they don't have the bill handy, so a
  // failed upload here is never a dead end.
  // -----------------------------------------------------------------------
  var billInput = document.getElementById('clrBillUpload');
  var billStatus = document.getElementById('clrBillStatus');
  if (billInput) {
    billInput.addEventListener('change', function () {
      var file = billInput.files && billInput.files[0];
      if (!file) return;
      fireEvent('bill_uploaded');
      billStatus.textContent = 'Attaching “' + file.name + '”…';

      var body = new FormData();
      body.append('bill', file, file.name);
      body.append('landing_page', window.location.href);

      fetch(WEBHOOK_URL, { method: 'POST', body: body })
        .then(function (res) {
          billStatus.textContent = res.ok
            ? 'Thanks — we’ve received that.'
            : 'We couldn’t attach that automatically, but no problem — we’ll email you a link to send it separately.';
        })
        .catch(function () {
          billStatus.textContent = 'We couldn’t attach that automatically, but no problem — we’ll email you a link to send it separately.';
        });
    });
  }
})();
