(function () {
  'use strict';

  // Design/behaviour contract: docs/08-commercial-battery-assessment-funnel.md
  // (v2 addendum), docs/08a-bess3-bess4-facts.md, docs/08c-v2-deliverables.md.

  var form = document.getElementById('bessForm');
  if (!form) return;

  function pushEvent(name, data) {
    if (!window.dataLayer) return;
    window.dataLayer.push(Object.assign({ event: name }, data || {}));
  }

  // Meta Pixel interface — deliberately inert unless a real Pixel ID is
  // configured elsewhere (window.OHE_META_PIXEL_ID + the actual base code
  // snippet, neither of which exists in this build — no ID is invented).
  // fbq is only ever called if something else has already defined it; this
  // never loads or injects the Pixel itself. Non-PII payload only.
  function firePixelEvent(name, data) {
    if (typeof window.fbq !== 'function') return;
    window.fbq('trackCustom', name, data || {});
  }

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
  // Stage navigation (3 stages, progress bar, Back/Continue, retained
  // answers — nothing is cleared when moving between stages).
  // ---------------------------------------------------------------------
  var steps = Array.prototype.slice.call(form.querySelectorAll('.assess-step'));
  var total = steps.length; // 3
  var current = 1;
  var fill = document.getElementById('bessFill');
  var progressBar = document.getElementById('bessProgressBar');
  var stageLabel = document.getElementById('bessStageLabel');
  var stageName = document.getElementById('bessStageName');
  var stageAnnounce = document.getElementById('bessStageAnnounce');
  var stageNames = { 1: 'Site fit', 2: 'Commercial need', 3: 'Contact and consent' };

  function showStage(n, moveFocus) {
    steps.forEach(function (s) {
      s.classList.toggle('is-active', parseInt(s.getAttribute('data-stage'), 10) === n);
    });
    pushEvent('form_step', { form_id: 'bessForm', step: n });
    if (fill) fill.style.width = Math.round((n / total) * 100) + '%';
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(n));
    if (stageLabel) stageLabel.textContent = 'Stage ' + n + ' of ' + total;
    if (stageName) stageName.textContent = stageNames[n] || '';
    if (stageAnnounce) stageAnnounce.textContent = 'Stage ' + n + ' of ' + total + ': ' + (stageNames[n] || '');
    if (moveFocus) {
      var activeStep = steps[n - 1];
      var heading = activeStep && activeStep.querySelector('h3');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }
  }

  // ---------------------------------------------------------------------
  // Branch visibility — apartment-only sub-questions. Disabling (not just
  // hiding) removes them from validation AND guarantees they can never
  // appear in the payload for a non-apartment submission.
  // ---------------------------------------------------------------------
  var apartmentBlock = document.getElementById('apartmentBlock');
  function setApartmentVisible(visible) {
    if (!apartmentBlock) return;
    apartmentBlock.hidden = !visible;
    apartmentBlock.querySelectorAll('input, select, textarea').forEach(function (ctrl) {
      ctrl.disabled = !visible;
    });
  }
  form.querySelectorAll('input[name="siteType"]').forEach(function (r) {
    r.addEventListener('change', function () {
      setApartmentVisible(r.value === 'apartment_building' && r.checked);
    });
  });

  // ---------------------------------------------------------------------
  // Consent timestamps — captured the moment each box is actually ticked,
  // not fabricated at submit time. Cleared if unticked.
  // ---------------------------------------------------------------------
  var requiredConsentGivenAt = null;
  var marketingConsentGivenAt = null;
  var requiredConsentBox = document.getElementById('requiredConsent');
  var marketingConsentBox = document.getElementById('marketingConsent');
  if (requiredConsentBox) {
    requiredConsentBox.addEventListener('change', function () {
      requiredConsentGivenAt = requiredConsentBox.checked ? new Date().toISOString() : null;
    });
  }
  if (marketingConsentBox) {
    marketingConsentBox.addEventListener('change', function () {
      marketingConsentGivenAt = marketingConsentBox.checked ? new Date().toISOString() : null;
    });
  }

  // ---------------------------------------------------------------------
  // Validation — per-stage, with an error summary (jump links + focus
  // management) in addition to inline fieldset/field errors. Server-side
  // validation is a separate, documented requirement (see deliverables
  // doc §"Do not depend exclusively on novalidate") — this is the
  // client-side half, not a substitute for it.
  // ---------------------------------------------------------------------
  var errorSummary = document.getElementById('bessErrorSummary');
  var errorSummaryList = document.getElementById('bessErrorSummaryList');

  function showFieldsetError(fieldset, show) {
    if (!fieldset) return;
    fieldset.classList.toggle('is-invalid', show);
    var msg = fieldset.querySelector('.error-msg');
    if (msg) msg.classList.toggle('is-visible', show);
  }

  function fieldLabel(el) {
    var container = el.closest('.form-field') || el.closest('fieldset');
    var legend = container && container.querySelector('legend');
    var label = container && container.querySelector('label');
    return (legend && legend.textContent) || (label && label.textContent) || el.name || 'This field';
  }

  function validateStage(stageEl) {
    var invalidEntries = []; // { el, message }

    var plainFields = stageEl.querySelectorAll('input[required]:not([type="radio"]):not([type="checkbox"]):not(:disabled), select[required]:not(:disabled)');
    plainFields.forEach(function (f) {
      var ok = f.checkValidity();
      var container = f.closest('.form-field');
      if (container) container.classList.toggle('error', !ok);
      var msg = container && container.querySelector('.error-msg');
      if (msg) msg.style.display = ok ? '' : 'block';
      if (!ok) invalidEntries.push({ el: f, message: fieldLabel(f) + ' — please complete this field correctly.' });
    });

    var requiredCheckboxes = stageEl.querySelectorAll('input[type="checkbox"][required]:not(:disabled)');
    requiredCheckboxes.forEach(function (c) {
      var container = c.closest('.form-field');
      if (container) container.classList.toggle('error', !c.checked);
      var msg = container && container.querySelector('.error-msg');
      if (msg) msg.style.display = c.checked ? '' : 'block';
      if (!c.checked) invalidEntries.push({ el: c, message: fieldLabel(c) + ' — this consent is required to continue.' });
    });

    var seenGroups = {};
    stageEl.querySelectorAll('input[type="radio"]:not(:disabled)').forEach(function (r) {
      if (seenGroups[r.name]) return;
      seenGroups[r.name] = true;
      var group = Array.prototype.slice.call(stageEl.querySelectorAll('input[name="' + r.name + '"]:not(:disabled)'));
      var required = group.some(function (g) { return g.required; });
      if (!required) return;
      var anyChecked = group.some(function (g) { return g.checked; });
      var fieldset = r.closest('fieldset');
      showFieldsetError(fieldset, !anyChecked);
      if (!anyChecked) invalidEntries.push({ el: group[0], message: fieldLabel(r) + ' — please choose an option.' });
    });

    renderErrorSummary(invalidEntries);
    return invalidEntries.length === 0;
  }

  var errorIdCounter = 0;
  function renderErrorSummary(invalidEntries) {
    if (!errorSummary || !errorSummaryList) return;
    errorSummaryList.innerHTML = '';
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (el) { el.removeAttribute('aria-invalid'); });

    if (!invalidEntries.length) {
      errorSummary.hidden = true;
      return;
    }
    invalidEntries.forEach(function (entry) {
      errorIdCounter += 1;
      if (!entry.el.id) entry.el.id = 'bessField' + errorIdCounter;
      entry.el.setAttribute('aria-invalid', 'true');
      var describedBy = entry.el.getAttribute('aria-describedby');
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + entry.el.id;
      a.textContent = entry.message;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        entry.el.focus();
      });
      li.appendChild(a);
      errorSummaryList.appendChild(li);
    });
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  form.querySelectorAll('[data-continue]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var stageEl = steps[current - 1];
      if (!validateStage(stageEl)) return;
      current = Math.min(current + 1, total);
      showStage(current, true);
    });
  });
  form.querySelectorAll('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      current = Math.max(current - 1, 1);
      showStage(current, true);
    });
  });

  // ---------------------------------------------------------------------
  // Attribution: first-touch (from main.js's sitewide sessionStorage
  // capture, never overwritten) AND latest-touch (this exact page load's
  // own query string — a returning visitor who clicks a second, different
  // ad still has that click's values available here, even though
  // first-touch attribution deliberately never changes).
  // ---------------------------------------------------------------------
  var ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'campaign_id', 'adset_id', 'ad_id', 'placement', 'site_source_name', 'creative_strategy'];

  function firstTouchAttribution() {
    try {
      var stored = JSON.parse(sessionStorage.getItem('ohe_attribution') || '{}');
      var out = {};
      ATTRIBUTION_KEYS.forEach(function (k) { out[k] = stored[k] || null; });
      out.landing_page = stored.landing_page || null;
      out.referrer = stored.referrer || null;
      return out;
    } catch (err) {
      return {};
    }
  }

  function latestTouchAttribution() {
    var params = new URLSearchParams(window.location.search);
    var out = {};
    ATTRIBUTION_KEYS.forEach(function (k) { out[k] = params.get(k) || null; });
    out.landing_page = window.location.href;
    out.referrer = document.referrer || null;
    return out;
  }

  // ---------------------------------------------------------------------
  // Approximate NSW postcode check — same caveat as v1: a preliminary
  // qualifier, not an address-validation service.
  // ---------------------------------------------------------------------
  function isLikelyNSW(postcode) {
    var n = parseInt(postcode, 10);
    if (!n || String(n).length !== 4) return null;
    if (n >= 2600 && n <= 2618) return false; // ACT
    if (n >= 2900 && n <= 2920) return false; // ACT
    if (n >= 2000 && n <= 2999) return true;
    return false;
  }

  // ---------------------------------------------------------------------
  // Routing — see docs/08c-v2-deliverables.md for the full table and the
  // reasoning behind this precedence order. Never returns "eligible".
  // ---------------------------------------------------------------------
  function classify(a) {
    var nswPostcode = isLikelyNSW(a.sitePostcode);
    if (a.nswConfirm === 'no' || nswPostcode === false) return 'outside_campaign_area';
    if (a.siteType === 'individual_home') return 'not_bess_residential_route';
    if (a.siteType === 'data_centre') return 'not_bess4_data_centre';
    if (a.siteType === 'apartment_building') {
      var count = parseInt(a.dwellingCount, 10);
      if (count && count < 4) return 'not_bess3_under_4_dwellings';
      if (a.bcaClass2 === 'no') return 'manual_eligibility_review_non_class_2';
    }
    if (a.gridConnected === 'no') return 'manual_eligibility_review_offgrid';
    if (a.role === 'tenant' || a.authority === 'no') return 'influencer_authority_required';
    if (a.capacityBand === 'over_200') return 'potential_bess5_manual_review';
    if (a.existingBattery === 'yes') return 'manual_eligibility_review_existing_battery';
    if (a.priorActivity === 'yes' || a.priorActivity === 'unsure') return 'manual_eligibility_review_prior_activity';
    if (a.siteType === 'apartment_building') return 'bess3_review_required';
    if (a.siteType === 'commercial_business') return 'bess4_review_required';
    return 'manual_eligibility_review_site_type_unsure';
  }

  var DECISION_MAKER_ROLES = ['owner_director', 'strata_manager', 'owners_corp_committee', 'building_facilities_manager', 'finance_ops_manager'];
  var URGENT_TIMEFRAMES = ['asap', '3-6-months'];
  function priorityTag(a) {
    var isDecisionMaker = DECISION_MAKER_ROLES.indexOf(a.role) !== -1 && (a.authority === 'yes' || a.authority === 'shared_committee');
    var isUrgent = URGENT_TIMEFRAMES.indexOf(a.timeframe) !== -1;
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
  // Payload construction — explicit, gated by branch, so an apartment
  // question can never appear on a business submission and vice versa.
  // ---------------------------------------------------------------------
  function buildPayload() {
    var siteType = radioValue('siteType');
    var isApartment = siteType === 'apartment_building';

    var answers = {
      sitePostcode: fieldValue('sitePostcode'),
      nswConfirm: radioValue('nswConfirm'),
      siteType: siteType,
      dwellingCount: isApartment ? fieldValue('dwellingCount') : null,
      bcaClass2: isApartment ? radioValue('bcaClass2') : null,
      gridConnected: radioValue('gridConnected'),
      role: radioValue('role'),
      authority: radioValue('authority'),
      existingBattery: radioValue('existingBattery'),
      priorActivity: radioValue('priorActivity'),
      capacityBand: radioValue('capacityBand'),
      timeframe: radioValue('timeframe'),
    };
    var classification = classify(answers);

    var first = firstTouchAttribution();
    var latest = latestTouchAttribution();

    var nameParts = fieldValue('contactName').trim().split(/\s+/);
    var firstName = nameParts.shift() || '';
    var lastName = nameParts.join(' ');

    return {
      contact: {
        firstName: firstName,
        lastName: lastName,
        email: fieldValue('workEmail'),
        phone: fieldValue('phone'),
        businessName: fieldValue('businessName'),
      },
      customFields: {
        campaign: 'bess3_bess4_launch',
        site_address: fieldValue('siteAddress'),
        site_suburb: fieldValue('siteSuburb'),
        site_postcode: answers.sitePostcode,
        nsw_confirm: answers.nswConfirm,
        site_type: answers.siteType,
        dwelling_count: answers.dwellingCount,
        bca_class_2: answers.bcaClass2,
        common_property_space: isApartment ? radioValue('commonPropertySpace') : null,
        grid_connected: answers.gridConnected,
        role: answers.role,
        authority: answers.authority,
        existing_battery: answers.existingBattery,
        prior_pdrs_activity: answers.priorActivity,
        solar_status: radioValue('solarStatus'),
        main_objective: radioValue('mainObjective'),
        demand_charges: radioValue('demandCharges'),
        approx_quarterly_spend: radioValue('approxSpend'),
        operating_hours: fieldValue('operatingHours') || null,
        capacity_band: answers.capacityBand,
        project_timeframe: answers.timeframe,
        bill_request_ok: !!document.getElementById('billRequestOk').checked,
        preferred_contact_method: fieldValue('preferredContact'),
        bess_classification: classification,
        required_consent_given_at: requiredConsentGivenAt,
        marketing_consent_given_at: marketingConsentGivenAt,
      },
      tags: [
        'source:commercial-battery-assessment',
        'campaign:bess3_bess4_launch',
        'classification:' + classification,
        'priority:' + priorityTag(answers),
      ].concat(marketingConsentGivenAt ? ['consent:marketing-opt-in'] : []),
      attribution: {
        first_touch: first,
        latest_touch: latest,
      },
      meta: {
        submitted_at: new Date().toISOString(),
        form_version: 'commercial-battery-assessment-v2',
      },
    };
  }

  // Non-PII subset only for analytics/Pixel — no name/email/phone/business
  // name/address/suburb/postcode/operating-hours free text ever included.
  function analyticsEventData(payload) {
    return {
      bess_classification: payload.customFields.bess_classification,
      site_type: payload.customFields.site_type,
      grid_connected: payload.customFields.grid_connected,
      existing_battery: payload.customFields.existing_battery,
      solar_status: payload.customFields.solar_status,
      capacity_band: payload.customFields.capacity_band,
      project_timeframe: payload.customFields.project_timeframe,
      utm_source: payload.attribution.latest_touch.utm_source,
      utm_medium: payload.attribution.latest_touch.utm_medium,
      utm_campaign: payload.attribution.latest_touch.utm_campaign,
      utm_content: payload.attribution.latest_touch.utm_content,
      campaign_id: payload.attribution.latest_touch.campaign_id,
      adset_id: payload.attribution.latest_touch.adset_id,
      ad_id: payload.attribution.latest_touch.ad_id,
      placement: payload.attribution.latest_touch.placement,
    };
  }

  var submitBtn = document.getElementById('bessSubmit');
  var statusEl = document.getElementById('bessFormStatus');
  var submitting = false;
  function setStatus(html) {
    if (statusEl) statusEl.innerHTML = html;
  }

  // ---------------------------------------------------------------------
  // Submission adapter — see docs/08c-v2-deliverables.md §"Exact steps to
  // activate the real CRM endpoint". Production ships with NO adapter
  // configured: no HighLevel endpoint/credentials exist for this funnel.
  // window.OHE_BESS_SUBMIT_ADAPTER is the documented injection point for
  // a test harness (local/intercepted server only) or, eventually, the
  // real secure server-side endpoint's client.
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
    if (submitting) return; // in-flight guard

    if (!validateStage(steps[total - 1])) return;

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
      .then(function (adapterResult) {
        submitting = false;
        if (submitBtn) submitBtn.disabled = false;
        if (adapterResult && adapterResult.ok) {
          var eventData = analyticsEventData(payload);
          pushEvent('bess_lead_submitted', eventData);
          firePixelEvent('OHE_BESS_Lead', eventData);
          window.location.href = '/commercial-battery-assessment/thanks/';
        } else if (adapterResult && adapterResult.duplicate) {
          setStatus('<p role="status">We already have a recent site check from you — Oz Home Energy will follow up on your existing request rather than creating a new one. Call 0435 336 336 if it\'s urgent.</p>');
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
