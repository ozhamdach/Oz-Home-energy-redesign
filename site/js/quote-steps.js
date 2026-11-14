/* Stepped quote flow on /assessment/ and the ad landing page
   /request-a-quote/ (14 Nov 2026).

   Steps 1 and 2 collect three answers as taps. Step 3 opens the existing
   HighLevel form with those answers already filled in, by adding them to the
   form's address. The form, its fields and where it sends leads are all
   unchanged; a visitor who skips every question gets the same form as before.

   Keys the HighLevel form reads from its address (confirmed 14 Nov 2026 by
   loading the form with them; nothing was submitted):
     primary_goal          Primary Goal dropdown
     multi_dropdown_3ea2   Average quarterly energy bill dropdown
     timeframe             Timeframe dropdown
   The values come from the buttons and radios in the page's own HTML, which
   hold the form's option text exactly. */
(function () {
  'use strict';
  var root = document.getElementById('quoteSteps');
  if (!root) return;

  var steps = root.querySelectorAll('.qstep');
  var bar = document.getElementById('qstepsBar');
  var count = document.getElementById('qstepsCount');
  var summary = document.getElementById('qstepsSummary');
  var frame = root.querySelector('iframe');
  var formSrc = root.getAttribute('data-form-src');
  // Which page's flow this is, for the form_step analytics event.
  var formLabel = root.getAttribute('data-form-label') || 'assessment';
  var answers = { goal: '', bill: '', time: '' };
  var loadedQuery = null;
  var current = 1;

  function pushEvent(name, data) {
    if (!window.dataLayer) return;
    var payload = { event: name };
    for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) payload[k] = data[k];
    window.dataLayer.push(payload);
  }

  function checked(name) {
    var el = root.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function labelOf(name) {
    var el = root.querySelector('input[name="' + name + '"]:checked');
    return el ? el.nextElementSibling.textContent : '';
  }

  function query() {
    var parts = [];
    if (answers.goal) parts.push('primary_goal=' + encodeURIComponent(answers.goal));
    if (answers.bill) parts.push('multi_dropdown_3ea2=' + encodeURIComponent(answers.bill));
    if (answers.time) parts.push('timeframe=' + encodeURIComponent(answers.time));
    return parts.join('&');
  }

  // Step 3: point the form at its address plus the answers. Only reloads the
  // form when the answers have changed, so going Back and forward again
  // without changing anything does not wipe what the visitor has typed.
  function loadForm() {
    var q = query();
    if (loadedQuery === q && frame.getAttribute('src')) return;
    loadedQuery = q;
    var url = formSrc + (q ? '?' + q : '');
    frame.setAttribute('data-ohe-src', url);
    frame.setAttribute('src', url);
    try { frame.dispatchEvent(new Event('ohe:embedstart')); } catch (e) { /* older browsers: the spinner clears on load */ }
  }

  function showSummary() {
    var bits = [];
    var goalBtn = root.querySelector('.qopt[aria-pressed="true"] strong');
    if (goalBtn) bits.push(goalBtn.textContent);
    if (answers.bill) bits.push(labelOf('qbill') + ' a quarter');
    if (answers.time) bits.push(labelOf('qtime'));
    if (!bits.length) { summary.hidden = true; return; }
    summary.textContent = '';
    var span = document.createElement('span');
    span.textContent = bits.join(' · ');
    var back = document.createElement('button');
    back.type = 'button'; back.className = 'qback'; back.setAttribute('data-back', '1'); back.textContent = 'Change';
    summary.appendChild(span); summary.appendChild(back);
    summary.hidden = false;
  }

  function go(n, focus) {
    current = n;
    for (var i = 0; i < steps.length; i++) steps[i].hidden = Number(steps[i].getAttribute('data-step')) !== n;
    bar.setAttribute('aria-valuenow', String(n));
    bar.setAttribute('aria-valuetext', 'Step ' + n + ' of 3');
    count.textContent = 'Step ' + n + ' of 3';
    if (n === 3) { showSummary(); loadForm(); }
    if (focus !== false) {
      var title = root.querySelector('.qstep[data-step="' + n + '"] .qstep-title');
      // Keep the new step's heading in view under the sticky header, and move
      // keyboard and screen-reader focus to it.
      if (title) { title.focus({ preventScroll: true }); var top = root.getBoundingClientRect().top; if (top < 0 || top > window.innerHeight * 0.5) root.scrollIntoView({ block: 'start' }); }
    }
    pushEvent('form_step', { form_id: formLabel, step: n });
  }

  root.addEventListener('click', function (e) {
    var opt = e.target.closest ? e.target.closest('.qopt') : null;
    if (opt) {
      var all = root.querySelectorAll('.qopt');
      for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-pressed', all[i] === opt ? 'true' : 'false');
      answers.goal = opt.getAttribute('data-goal') || '';
      go(2);
      return;
    }
    var back = e.target.closest ? e.target.closest('.qback') : null;
    if (back) { go(Math.max(1, current - 1)); return; }
    if (e.target.id === 'qstepsNext') {
      answers.bill = checked('qbill');
      answers.time = checked('qtime');
      go(3);
    }
  });

  // A link such as /assessment/?for=battery (from a service page) or
  // /request-a-quote/?for=battery (from a battery ad) arrives with step 1
  // already answered.
  var map = { solar: 'Solar', 'solar-battery': 'Solar and battery', battery: 'Battery', ev: 'EV Charger' };
  var m = /[?&]for=([a-z-]+)/.exec(window.location.search);
  if (m && map[m[1]]) {
    var pre = root.querySelector('.qopt[data-goal="' + map[m[1]] + '"]');
    if (pre) { pre.setAttribute('aria-pressed', 'true'); answers.goal = map[m[1]]; go(2, false); return; }
  }
  pushEvent('form_step', { form_id: formLabel, step: 1 });
})();
