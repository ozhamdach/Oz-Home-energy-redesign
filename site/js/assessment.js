(function () {
  'use strict';

  var form = document.getElementById('assessmentForm');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.assess-step'));
  var total = steps.length;
  var current = 1;

  var fill = document.getElementById('assessFill');
  var progressBar = document.getElementById('assessProgressBar');
  var stepLabel = document.getElementById('assessStepLabel');
  var stepName = document.getElementById('assessStepName');
  var backBtn = document.getElementById('assessBack');
  var nextBtn = document.getElementById('assessNext');
  var submitBtn = document.getElementById('assessSubmit');

  var stepNames = {
    1: 'What do you need help with?',
    2: 'About you and your property',
    3: 'Your current setup and electricity bill',
    4: 'Your details',
    5: 'How should we reach you?',
  };

  // See docs/analytics-integration.md — a no-op until a real GTM container
  // is installed (site/js/main.js declares the same pushEvent pattern; kept
  // local here since this file already owns all step-change logic).
  function pushEvent(name, data) {
    if (!window.dataLayer) return;
    window.dataLayer.push(Object.assign({ event: name }, data || {}));
  }

  function showStep(n, moveFocus) {
    steps.forEach(function (s) {
      s.classList.toggle('is-active', parseInt(s.getAttribute('data-step'), 10) === n);
    });
    pushEvent('form_step', { form_id: 'assessmentForm', step: n });
    fill.style.width = Math.round((n / total) * 100) + '%';
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(n));
    stepLabel.textContent = 'Step ' + n + ' of ' + total;
    stepName.textContent = stepNames[n] || '';
    backBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
    nextBtn.style.display = n === total ? 'none' : 'inline-flex';
    submitBtn.style.display = n === total ? 'inline-flex' : 'none';
    if (moveFocus) {
      var activeStep = steps[n - 1];
      var heading = activeStep && activeStep.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }
  }

  function currentStepEl() {
    return steps[current - 1];
  }

  function showFieldsetError(fieldset, show) {
    fieldset.classList.toggle('is-invalid', show);
    var msg = fieldset.querySelector('.error-msg');
    if (msg) msg.classList.toggle('is-visible', show);
  }

  function validateStep(stepEl) {
    var valid = true;

    // Plain required inputs/selects/textareas (not radios/checkboxes)
    var fields = stepEl.querySelectorAll('input[required], select[required], textarea[required]');
    var radioGroupNames = {};
    fields.forEach(function (f) {
      if (f.type === 'radio' || f.type === 'checkbox') {
        radioGroupNames[f.name] = true;
        return;
      }
      if (!f.checkValidity()) {
        valid = false;
        f.reportValidity();
      }
    });

    // Required radio/checkbox groups: a native `required` on only one member
    // is enough for the browser, but we must check every member sharing
    // that name for "is anything selected" — see git history for the bug
    // this fixes (only the first-in-group option validated correctly).
    Object.keys(radioGroupNames).forEach(function (name) {
      var group = Array.prototype.slice.call(stepEl.querySelectorAll('input[name="' + name + '"]'));
      var anyChecked = group.some(function (r) {
        return r.checked;
      });
      var fieldset = group[0] && group[0].closest('fieldset');
      if (!anyChecked) {
        valid = false;
        if (fieldset) showFieldsetError(fieldset, true);
      } else if (fieldset) {
        showFieldsetError(fieldset, false);
      }
    });

    return valid;
  }

  // Step 3 asks about existing solar/battery and the electricity bill — a
  // useful sizing input for a solar/battery/EV enquiry, but irrelevant (and
  // a real drop-off risk) for someone who just wants an electrical/
  // switchboard job looked at. Skip it entirely for that goal rather than
  // asking every visitor a solar-bill question regardless of what they
  // came in for.
  function goalSkipsBillingStep() {
    var goalEl = form.querySelector('input[name="goal"]:checked');
    return !!goalEl && goalEl.value === 'Upgrade my electrical system';
  }

  nextBtn.addEventListener('click', function () {
    if (!validateStep(currentStepEl())) return;
    var next = current + 1;
    if (next === 3 && goalSkipsBillingStep()) next = 4;
    if (next <= total) {
      current = next;
      showStep(current, true);
    }
  });

  backBtn.addEventListener('click', function () {
    var prev = current - 1;
    if (prev === 3 && goalSkipsBillingStep()) prev = 2;
    if (prev >= 1) {
      current = prev;
      showStep(current, true);
    }
  });

  // Billing frequency toggles which "approximate bill amount" range select
  // is shown — monthly and quarterly bills need differently-scaled ranges,
  // rather than forcing everyone into quarterly figures.
  var billFrequency = document.getElementById('billFrequency');
  if (billFrequency) {
    billFrequency.addEventListener('change', function () {
      var showMonthly = billFrequency.value === 'monthly';
      var monthlyField = form.querySelector('[data-frequency-group="monthly"]');
      var quarterlyField = form.querySelector('[data-frequency-group="quarterly"]');
      if (monthlyField) monthlyField.hidden = !showMonthly;
      if (quarterlyField) quarterlyField.hidden = showMonthly;
    });
  }

  // Pre-fill attribution hidden fields from sessionStorage (captured sitewide in main.js)
  try {
    var stored = JSON.parse(sessionStorage.getItem('ohe_attribution') || '{}');
    Object.keys(stored).forEach(function (k) {
      var el = document.getElementById(k);
      if (el) el.value = stored[k];
    });
  } catch (err) {
    /* attribution is best-effort */
  }

  // Pre-select goal from ?goal= query param or a homepage pathway-card click
  (function preselectGoal() {
    var goalMap = {
      'lower-bills': 'Lower my electricity bills',
      'new-solar': 'Install new solar — with or without a battery',
      'add-battery': 'Add a battery to existing solar',
      'ev-charging': 'Charge my EV at home',
      'electrical-upgrade': 'Upgrade my electrical system',
      commercial: 'Plan a commercial project',
    };
    var params = new URLSearchParams(window.location.search);
    var key = params.get('goal');
    var stored;
    try {
      stored = sessionStorage.getItem('ohe_pathway');
    } catch (err) {
      stored = null;
    }
    var label = (key && goalMap[key]) || (stored && goalMap[stored]);
    if (label) {
      var radio = form.querySelector('input[name="goal"][value="' + CSS.escape(label) + '"]');
      if (radio) radio.checked = true;
      if (label === 'Plan a commercial project') {
        var commercialRadio = document.getElementById('type2');
        if (commercialRadio) commercialRadio.checked = true;
      }
    }
  })();

  // No live HighLevel connection exists yet — see the data-hl-form-ref
  // attribute on this <form> and docs/owner-inputs-required.md's
  // integration checklist. This deliberately does NOT show any success/
  // "noted" state: a lead was not received, so nothing here may look like
  // confirmation that it was. See docs/04-highlevel-integration.md.
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(currentStepEl())) return;

    var goalEl = form.querySelector('input[name="goal"]:checked');
    var serviceOut = document.getElementById('selected_service');
    if (serviceOut) serviceOut.value = goalEl ? goalEl.value : '';
    // submitted_at is intentionally NOT set here — see main.js's equivalent
    // note; it should reflect a genuine HighLevel submission, not a click
    // on a form with nowhere to send it yet.

    var wrap = document.getElementById('assessSuccess');
    form.style.display = 'none';
    document.querySelector('.assess-progress').style.display = 'none';
    wrap.style.display = 'block';
    wrap.innerHTML =
      '<div class="lead-pending-notice" role="status">' +
      '<div class="icon-circle"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0540C1" stroke-width="1.8"/><path d="M12 8v5m0 3v.01" stroke="#0540C1" stroke-width="2" stroke-linecap="round"/></svg></div>' +
      '<h2>This form isn’t connected yet</h2>' +
      '<p class="lede" style="margin-inline:auto;">This website is still in development — nothing you entered was sent anywhere. Please call us directly and we can help right away.</p>' +
      '<p><a class="btn btn-primary" href="tel:+61435336336">Call 0435 336 336</a></p>' +
      '</div>';
    wrap.setAttribute('tabindex', '-1');
    wrap.focus();
  });

  showStep(current);
})();
