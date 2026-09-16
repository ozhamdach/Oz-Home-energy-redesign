(function () {
  'use strict';

  var form = document.getElementById('csbqForm');
  if (!form) return;

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // -----------------------------------------------------------------------
  // Analytics: dataLayer + Meta pixel, both loaded globally in
  // src/layout.html. Only ever fires named custom events with
  // non-identifying parameters — never name, email, phone, business name,
  // address or bill content.
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
  // Same approach as site/js/commercial-load-review.js, kept per-funnel
  // (separate sessionStorage/localStorage keys below) so the two funnels'
  // attribution never cross-contaminate for a visitor who lands on both.
  // -----------------------------------------------------------------------
  var TRACK_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'fbclid', 'campaign_id', 'adset_id', 'ad_id', 'placement',
  ];
  var SESSION_KEY = 'csbq_session_touch';
  var FT_PREFIX = 'ft_csbq_';

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
      stored = localStorage.getItem(FT_PREFIX + k);
    } catch (e) {
      /* private browsing: first-touch persistence is best-effort */
    }
    if (stored) {
      firstTouch[k] = stored;
    } else if (sessionVals[k]) {
      firstTouch[k] = sessionVals[k];
      try {
        localStorage.setItem(FT_PREFIX + k, sessionVals[k]);
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
  // Progressive reveal — same debounced-on-settle pattern as
  // commercial-load-review.js: a native radio group fires 'change' on
  // every arrow-key step, so revealing immediately on 'change' would yank
  // a keyboard user forward before they've actually settled on an answer.
  // -----------------------------------------------------------------------
  var REVEAL_DELAY = 400;
  var announce = document.getElementById('csbqFormAnnounce');

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

  var q1 = document.getElementById('csbqQ1');
  var q2 = document.getElementById('csbqQ2');
  var q3 = document.getElementById('csbqQ3');
  var contact = document.getElementById('csbqContact');
  var submitBtn = document.getElementById('csbqSubmit');

  wireRadioReveal(q1, 'propertyType', function (value) {
    fireEvent('property_type_selected', { property_type: value });
    reveal(q2);
  });
  wireRadioReveal(q2, 'spendBand', function () {
    reveal(q3);
  });
  wireRadioReveal(q3, 'mainGoal', function () {
    reveal(contact);
  });

  // -----------------------------------------------------------------------
  // Contact-stage validation + submission.
  // -----------------------------------------------------------------------
  var errorSummary = document.getElementById('csbqErrorSummary');
  var errorSummaryList = document.getElementById('csbqErrorSummaryList');
  var contactError = document.getElementById('csbqContactError');
  var submitError = document.getElementById('csbqSubmitError');

  var CONTACT_FIELDS = [
    { id: 'csbqFullName', label: 'Full name' },
    { id: 'csbqBusinessName', label: 'Business name' },
    { id: 'csbqPhone', label: 'Phone' },
    { id: 'csbqWorkEmail', label: 'Work email' },
    { id: 'csbqSuburb', label: 'Suburb' },
    { id: 'csbqPostcode', label: 'Postcode' },
  ];

  function validateContact() {
    var missing = [];
    CONTACT_FIELDS.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (!el.value.trim()) missing.push(f);
    });
    var consent = document.getElementById('csbqConsent');
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
      li2.innerHTML = '<a href="#csbqConsent">Please consent to being contacted</a>';
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
      form: 'commercial_solar_battery_quote',
      propertyType: radioVal('propertyType'),
      spendBand: radioVal('spendBand'),
      mainGoal: radioVal('mainGoal'),
      fullName: val('csbqFullName'),
      businessName: val('csbqBusinessName'),
      phone: val('csbqPhone'),
      workEmail: val('csbqWorkEmail'),
      suburb: val('csbqSuburb'),
      postcode: val('csbqPostcode'),
      consent: document.getElementById('csbqConsent').checked,
      marketingConsent: document.getElementById('csbqMarketing').checked,
      attribution: attribution,
      submitted_at: new Date().toISOString(),
      landing_page: window.location.href,
      referrer: document.referrer || '',
    };
  }

  // Same HighLevel inbound webhook as /commercial-load-review/ (owner
  // confirmed reusing it for this funnel too) — the `form` field above
  // distinguishes which funnel a submission came from downstream.
  var WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/iqh8HIe7GtEKNtnlIaho/webhook-trigger/83a43470-0989-4954-b4cf-55d62d8446c9';
  var submitting = false;
  var confirmPanel = document.getElementById('csbqConfirm');

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
          property_type: payload.propertyType,
          spend_band: payload.spendBand,
          main_goal: payload.mainGoal,
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
})();
