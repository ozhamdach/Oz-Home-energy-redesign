(function () {
  'use strict';

  var form = document.getElementById('assessmentForm');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.assess-step'));
  var total = steps.length;
  var current = 1;

  var fill = document.getElementById('assessFill');
  var stepLabel = document.getElementById('assessStepLabel');
  var stepName = document.getElementById('assessStepName');
  var backBtn = document.getElementById('assessBack');
  var nextBtn = document.getElementById('assessNext');
  var submitBtn = document.getElementById('assessSubmit');

  var stepNames = {
    1: 'What do you need help with?',
    2: 'Residential or commercial?',
    3: 'About your property',
    4: "What's already on your property?",
    5: 'Your electricity bill',
    6: 'Your details',
    7: 'How should we reach you?',
  };

  function showStep(n, moveFocus) {
    steps.forEach(function (s) {
      s.classList.toggle('is-active', parseInt(s.getAttribute('data-step'), 10) === n);
    });
    fill.style.width = Math.round((n / total) * 100) + '%';
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

  function validateStep(stepEl) {
    var fields = stepEl.querySelectorAll('input[required], select[required], textarea[required]');
    var valid = true;
    var radioGroupNames = {};
    fields.forEach(function (f) {
      if (f.type === 'radio') {
        // HTML only needs `required` on one radio per group for native
        // validation, so this only tells us the group's NAME is required —
        // the actual "is anything checked" check below must look at every
        // radio sharing that name, not just the one(s) carrying the attribute.
        radioGroupNames[f.name] = true;
        return;
      }
      if (!f.checkValidity()) {
        valid = false;
        f.reportValidity();
      }
    });
    Object.keys(radioGroupNames).forEach(function (name) {
      var group = Array.prototype.slice.call(stepEl.querySelectorAll('input[name="' + name + '"]'));
      var anyChecked = group.some(function (r) {
        return r.checked;
      });
      if (!anyChecked) {
        valid = false;
        group[0].closest('.radio-cards').style.outline = '2px solid #c0322b';
        group[0].closest('.radio-cards').style.outlineOffset = '4px';
        group[0].closest('.radio-cards').style.borderRadius = '12px';
      } else {
        var box = group[0].closest('.radio-cards');
        if (box) box.style.outline = 'none';
      }
    });
    return valid;
  }

  nextBtn.addEventListener('click', function () {
    if (!validateStep(currentStepEl())) return;
    if (current < total) {
      current += 1;
      showStep(current, true);
    }
  });

  backBtn.addEventListener('click', function () {
    if (current > 1) {
      current -= 1;
      showStep(current, true);
    }
  });

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
      'add-battery': 'Add a battery to existing solar',
      'new-solar-battery': 'Install new solar and battery',
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

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(currentStepEl())) return;

    var goalEl = form.querySelector('input[name="goal"]:checked');
    var typeEl = form.querySelector('input[name="propertyOwner"]:checked');
    var suburb = document.getElementById('suburb').value;
    var name = document.getElementById('fullName').value;

    var wrap = document.getElementById('assessSuccess');
    form.style.display = 'none';
    document.querySelector('.assess-progress').style.display = 'none';
    wrap.style.display = 'block';
    wrap.innerHTML =
      '<div class="assess-success">' +
      '<div class="icon-circle"><svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="#0540C1" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<h2>Thanks' + (name ? ', ' + escapeHtml(name.split(' ')[0]) : '') + ' — that\'s been noted.</h2>' +
      '<p class="lede" style="margin-inline:auto;">This is a design prototype: your answers were not sent anywhere. Once connected to Oz Home Energy\'s CRM, a submission like this — ' +
      (goalEl ? '"' + escapeHtml(goalEl.value) + '"' : 'your enquiry') +
      (typeEl ? ' (' + escapeHtml(typeEl.value) + (suburb ? ', ' + escapeHtml(suburb) : '') + ')' : '') +
      ' — will reach the right pipeline and the right team member automatically.</p>' +
      '<p><a class="btn btn-secondary" href="tel:0420113216">Call 0420 113 216 instead</a></p>' +
      '</div>';
    wrap.setAttribute('tabindex', '-1');
    wrap.focus();
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  showStep(current);
})();
