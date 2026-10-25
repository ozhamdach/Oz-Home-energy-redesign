(function () {
  'use strict';
  clearTimeout(window.tbFallback);

  // Plan your system: switch circuits on, see what gets checked.
  var checks = {
    solar: 'roof space and orientation, daytime use and your export limit',
    battery: 'your inverter, DC or AC coupling and the federal battery discount',
    ev: 'where the charger goes and what it needs from your switchboard',
    backup: 'which circuits stay on in a blackout and the changeover equipment',
    board: 'switchboard capacity, age and safety'
  };
  var plan = document.querySelector('.tb-plan');
  if (plan) {
    var rows = plan.querySelectorAll('.tb-circuits li');
    var photos = plan.querySelectorAll('.tb-plan-photo img');
    var sum = document.getElementById('tb-plan-sum');
    var show = function (key) {
      photos.forEach(function (img) { img.classList.toggle('is-on', img.dataset.for === key); });
    };
    var render = function () {
      var on = [];
      rows.forEach(function (li) { if (li.classList.contains('is-on')) on.push(li); });
      if (!on.length) { sum.textContent = 'Switch on one or more circuits to build your plan.'; return; }
      var names = on.map(function (li) { return li.querySelector('.tb-cname').textContent; });
      var items = on.map(function (li) { return checks[li.dataset.key]; });
      var needsBoard = on.some(function (li) { return li.dataset.key !== 'board'; }) && !on.some(function (li) { return li.dataset.key === 'board'; });
      if (needsBoard) items.push('and, first of all, your switchboard');
      sum.textContent = 'Your plan: ' + names.join(', ') + '. Your assessment checks ' + items.join('; ') + '.';
    };
    rows.forEach(function (li) {
      var btn = li.querySelector('button');
      btn.addEventListener('click', function () {
        var on = !li.classList.contains('is-on');
        li.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) show(li.dataset.key);
        render();
      });
      btn.addEventListener('mouseenter', function () { show(li.dataset.key); });
      btn.addEventListener('focus', function () { show(li.dataset.key); });
    });
  }

  // Process accordion: one stage open at a time.
  var acc = document.querySelector('.tb-acc');
  if (acc) {
    acc.querySelectorAll('li').forEach(function (li) {
      li.querySelector('button').addEventListener('click', function () {
        acc.querySelectorAll('li').forEach(function (o) {
          var open = o === li;
          o.classList.toggle('is-open', open);
          o.querySelector('button').setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      });
    });
  }

  // Entrances: each section's parts rise in turn, once.
  var groups = document.querySelectorAll('#main > section');
  groups.forEach(function (sec) {
    sec.querySelectorAll('.tb-rise').forEach(function (el, i) { el.style.setProperty('--tb-i', Math.min(i, 8)); });
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.04 });
    groups.forEach(function (g) { io.observe(g); });
  } else {
    document.documentElement.classList.add('tb-all-in');
  }
})();
