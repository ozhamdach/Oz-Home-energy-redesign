(function () {
  'use strict';

  // Design/behaviour contract for this file: see
  // docs/08-commercial-battery-assessment-funnel.md (question matrix,
  // branching table, CRM payload contract, attribution contract,
  // submission-state diagram) and docs/08a-bess3-bess4-facts.md (sourced
  // BESS3/BESS4 facts this classification logic is built against).

  var form = document.getElementById('bessForm');
  if (!form) return;

  function pushEvent(name, data) {
    if (!window.dataLayer) return;
    window.dataLayer.push(Object.assign({ event: name }, data || {}));
  }

  // Same one-per-form form_start convention as site/js/main.js and
  // site/js/assessment.js — not covered by main.js's own listener since
  // this form intentionally carries neither `data-prototype-form` nor the
  // id `assessmentForm` (see the submission-adapter comment below for why).
  (function trackFormStart() {
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
  })();

  // ---------------------------------------------------------------------
  // Branch visibility. Toggling `hidden` alone is not enough: a hidden
  // fieldset's `required` radios would still block native constraint
  // validation from the OTHER branch's fields firing correctly, and (more
  // importantly for the payload contract) leaving them enabled means a
  // stray, disconnected old answer in an inactive branch could still be
  // read by naive code. Disabling every control in a hidden section
  // removes it from both constraint validation and FormData/DOM reads.
  // ---------------------------------------------------------------------
  function setBranchVisible(el, visible) {
    if (!el) return;
    el.hidden = !visible;
    el.querySelectorAll('input, select, textarea, button').forEach(function (ctrl) {
      ctrl.disabled = !visible;
    });
  }

  var singleHomeBlock = document.getElementById('singleHomeBlock');
  var apartmentBlock = document.getElementById('apartmentBlock');
  var businessBlock = document.getElementById('businessBlock');
  var commonBlock = document.getElementById('commonBlock');

  function updateBranches() {
    var siteType = form.querySelector('input[name="siteType"]:checked');
    var val = siteType ? siteType.value : '';
    setBranchVisible(singleHomeBlock, val === 'single_home');
    setBranchVisible(apartmentBlock, val === 'apartment_4plus');
    setBranchVisible(businessBlock, val === 'commercial_business');
    // The common contact/consent block only applies to the two in-campaign
    // branches — a single-home visitor is routed to /battery-storage/
    // instead of filling in the rest of this form (see content.html).
    setBranchVisible(commonBlock, val === 'apartment_4plus' || val === 'commercial_business');
  }

  form.querySelectorAll('input[name="siteType"]').forEach(function (r) {
    r.addEventListener('change', updateBranches);
  });
  updateBranches();

  // ---------------------------------------------------------------------
  // Consent timestamp — captured at the moment the box is actually ticked,
  // not fabricated at submit time. Cleared if unticked, since consent is
  // only evidenced while the box is checked.
  // ---------------------------------------------------------------------
  var consentBox = document.getElementById('bessConsent');
  var consentGivenAt = null;
  if (consentBox) {
    consentBox.addEventListener('change', function () {
      consentGivenAt = consentBox.checked ? new Date().toISOString() : null;
    });
  }

  // ---------------------------------------------------------------------
  // Validation — mirrors the pattern already used on /assessment/
  // (site/js/assessment.js: fieldset.is-invalid + .error-msg.is-visible),
  // but scoped to whichever fields are currently enabled rather than a
  // wizard step, since this form is single-page with conditional reveal.
  // ---------------------------------------------------------------------
  function showFieldsetError(fieldset, show) {
    if (!fieldset) return;
    fieldset.classList.toggle('is-invalid', show);
    var msg = fieldset.querySelector('.error-msg') || fieldset.parentElement && fieldset.parentElement.querySelector('.error-msg');
    if (msg) msg.classList.toggle('is-visible', show);
  }

  function validateForm() {
    var valid = true;
    var firstInvalid = null;

    // Plain required inputs (text/email/tel/checkbox), enabled only.
    var plainFields = form.querySelectorAll('input[required]:not([type="radio"]):not(:disabled)');
    plainFields.forEach(function (f) {
      var ok = f.checkValidity();
      var container = f.closest('.form-field');
      if (container) container.classList.toggle('error', !ok);
      if (!ok) {
        valid = false;
        if (!firstInvalid) firstInvalid = f;
      }
    });

    // Required radio groups, enabled only — check every member sharing a
    // name, not just whichever one happens to carry the `required`
    // attribute (a single unchecked required radio in a group still
    // blocks native validation, but we want our own visible error too).
    var seenGroups = {};
    form.querySelectorAll('input[type="radio"]:not(:disabled)').forEach(function (r) {
      if (seenGroups[r.name]) return;
      seenGroups[r.name] = true;
      var group = Array.prototype.slice.call(form.querySelectorAll('input[name="' + r.name + '"]:not(:disabled)'));
      var anyChecked = group.some(function (g) { return g.checked; });
      var fieldset = r.closest('fieldset');
      showFieldsetError(fieldset, !anyChecked);
      if (!anyChecked) {
        valid = false;
        if (!firstInvalid) firstInvalid = r;
      }
    });

    return { valid: valid, firstInvalid: firstInvalid };
  }

  // ---------------------------------------------------------------------
  // Approximate NSW postcode check. This is a preliminary lead-qualifier,
  // not an address-validation service — no geocoding API is available or
  // appropriate here. Deliberately conservative: an unparseable postcode
  // is treated as unknown (routes to manual review), never silently
  // reclassified as in- or out-of-scope.
  // ---------------------------------------------------------------------
  function isLikelyNSW(postcode) {
    var n = parseInt(postcode, 10);
    if (!n || String(n).length !== 4) return null;
    if (n >= 2600 && n <= 2618) return false; // ACT
    if (n >= 2900 && n <= 2920) return false; // ACT
    if (n >= 2000 && n <= 2999) return true;
    return false;
  }

  var DECISION_MAKER_ROLES = ['strata-committee', 'strata-manager', 'owner-director', 'facilities-manager'];
  var URGENT_TIMEFRAMES = ['asap', '3-6-months'];

  function classify(answers) {
    var nsw = isLikelyNSW(answers.projectPostcode);
    if (nsw === false) return 'outside_campaign_scope';
    if (answers.siteType === 'apartment_4plus') {
      return answers.dwellingBand === 'under-4' ? 'manual_eligibility_review' : 'bess3_review_required';
    }
    if (answers.siteType === 'commercial_business') {
      return answers.billBand === 'over-50k' ? 'bess5_or_manual_review' : 'bess4_review_required';
    }
    return 'manual_eligibility_review';
  }

  function priorityTag(role, timeframe) {
    var isDecisionMaker = DECISION_MAKER_ROLES.indexOf(role) !== -1;
    var isUrgent = URGENT_TIMEFRAMES.indexOf(timeframe) !== -1;
    return isDecisionMaker && isUrgent ? 'high' : 'medium';
  }

  function radioValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function fieldValue(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value : '';
  }

  // ---------------------------------------------------------------------
  // Payload construction — built explicitly, field by field, gated by the
  // active branch. This is deliberate, not incidental: it's the mechanism
  // that guarantees an inactive branch's answers (e.g. a BESS3 dwelling
  // band on a BESS4 submission) can never end up in the payload, rather
  // than relying only on the DOM disabled/hidden state above.
  // ---------------------------------------------------------------------
  function buildPayload() {
    var siteType = radioValue('siteType');
    var role = siteType === 'apartment_4plus' ? radioValue('apartmentRole') : siteType === 'commercial_business' ? radioValue('businessRole') : null;
    var dwellingBand = siteType === 'apartment_4plus' ? radioValue('dwellingBand') : null;
    var billBand = siteType === 'commercial_business' ? radioValue('billBand') : null;

    var hasBattery = radioValue('hasBattery');
    var solarStatus = radioValue('solarStatus');
    var timeframe = radioValue('timeframe');
    var projectSuburb = fieldValue('projectSuburb');
    var projectPostcode = fieldValue('projectPostcode');

    var classification = classify({ siteType: siteType, dwellingBand: dwellingBand, billBand: billBand, projectPostcode: projectPostcode });

    var attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'campaign_id', 'adset_id', 'ad_id', 'placement', 'landing_page', 'referrer'];
    var attribution = {};
    attributionKeys.forEach(function (k) {
      var v = fieldValue(k);
      attribution[k] = v || null;
    });

    var fullName = fieldValue('fullName');
    var nameParts = fullName.trim().split(/\s+/);
    var firstName = nameParts.shift() || '';
    var lastName = nameParts.join(' ');

    return {
      contact: {
        firstName: firstName,
        lastName: lastName,
        phone: fieldValue('phone'),
        email: fieldValue('email'),
      },
      customFields: {
        campaign: 'bess3_bess4_launch',
        site_type: siteType,
        dwelling_band: dwellingBand,
        decision_maker_role: role,
        bill_band: billBand,
        has_existing_battery: hasBattery,
        solar_status: solarStatus,
        project_timeframe: timeframe,
        project_suburb: projectSuburb,
        project_postcode: projectPostcode,
        bess_classification: classification,
        consent_given_at: consentGivenAt,
      },
      tags: [
        'source:commercial-battery-assessment',
        'campaign:bess3_bess4_launch',
        'classification:' + classification,
        'priority:' + priorityTag(role, timeframe),
      ],
      attribution: attribution,
      meta: {
        submitted_at: new Date().toISOString(),
        form_version: 'commercial-battery-assessment-v1',
      },
    };
  }

  // Non-PII subset only — see docs/08-commercial-battery-assessment-funnel.md
  // §3's note on why no free-text/name/phone/email/address field is ever
  // included here. Suburb/postcode are deliberately excluded too (coarse
  // address is still address).
  function analyticsEventData(payload) {
    return {
      bess_classification: payload.customFields.bess_classification,
      site_type: payload.customFields.site_type,
      has_existing_battery: payload.customFields.has_existing_battery,
      solar_status: payload.customFields.solar_status,
      project_timeframe: payload.customFields.project_timeframe,
      utm_source: payload.attribution.utm_source,
      utm_medium: payload.attribution.utm_medium,
      utm_campaign: payload.attribution.utm_campaign,
      utm_content: payload.attribution.utm_content,
      campaign_id: payload.attribution.campaign_id,
      adset_id: payload.attribution.adset_id,
      ad_id: payload.attribution.ad_id,
      placement: payload.attribution.placement,
    };
  }

  var submitBtn = document.getElementById('bessSubmit');
  var statusEl = document.getElementById('bessFormStatus');
  var submitting = false;

  function setStatus(html) {
    if (statusEl) statusEl.innerHTML = html;
  }

  // ---------------------------------------------------------------------
  // Submission adapter. Production ships with NO adapter configured — see
  // docs/08-commercial-battery-assessment-funnel.md §8: no real HighLevel
  // endpoint or credentials exist for this funnel yet, matching every
  // other form on this site (docs/04-highlevel-integration.md). In that
  // default state this form behaves exactly like the site's other three
  // forms: an honest "not connected yet" notice, never a fake success.
  //
  // For the required end-to-end acceptance test, a test harness defines
  // `window.OHE_BESS_SUBMIT_ADAPTER = async function (payload) { ... }`
  // (e.g. via Playwright's addInitScript, pointed at a local/intercepted
  // test server) BEFORE this script runs. Nothing in this file ever
  // hardcodes a real or fake endpoint URL.
  // ---------------------------------------------------------------------
  function showNotConnectedNotice() {
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
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return; // in-flight guard: a second click is a no-op, not a second request

    var validation = validateForm();
    if (!validation.valid) {
      if (validation.firstInvalid) {
        validation.firstInvalid.focus();
        validation.firstInvalid.reportValidity();
      }
      setStatus('');
      return;
    }

    var adapter = window.OHE_BESS_SUBMIT_ADAPTER;
    if (typeof adapter !== 'function') {
      showNotConnectedNotice();
      return;
    }

    var payload = buildPayload();
    submitting = true;
    if (submitBtn) submitBtn.disabled = true;
    setStatus('<p>Submitting…</p>');

    Promise.resolve()
      .then(function () { return adapter(payload); })
      .then(function (result) {
        submitting = false;
        if (submitBtn) submitBtn.disabled = false;
        if (result && result.ok) {
          // Exactly one conversion event, fired BEFORE navigation — the
          // thank-you page itself fires nothing (see its content.html and
          // docs/08-commercial-battery-assessment-funnel.md §5), so this
          // is the one and only place a real conversion is ever recorded.
          pushEvent('bess_lead_submitted', analyticsEventData(payload));
          window.location.href = '/commercial-battery-assessment/thanks/';
        } else {
          setStatus('<p class="error-msg is-visible" role="alert">Something went wrong sending your details — your answers are still here. Please try again, or call 0435 336 336.</p>');
        }
      })
      .catch(function () {
        submitting = false;
        if (submitBtn) submitBtn.disabled = false;
        setStatus('<p class="error-msg is-visible" role="alert">Something went wrong sending your details — your answers are still here. Please try again, or call 0435 336 336.</p>');
      });
  });
})();
