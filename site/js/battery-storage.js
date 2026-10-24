(function () {
  'use strict';
  clearTimeout(window.bpFallback);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Federal discount calculator. Rules come from data attributes that mirror
  // src/data/rebates.json: factor per usable kWh, 100% to t1, p2 to t2, p3 to cap.
  var calc = document.querySelector('.bp-calc');
  if (calc) {
    var d = calc.dataset;
    var factor = +d.factor, cap = +d.cap, t1 = +d.t1, t2 = +d.t2, p2 = +d.p2, p3 = +d.p3;
    var input = document.getElementById('bp-kwh');
    var stcOut = document.getElementById('bp-stc');
    var kwhOut = document.getElementById('bp-kwh-out');
    var split = document.getElementById('bp-split');
    var cellsBox = document.getElementById('bp-cells');
    var sizes = calc.querySelectorAll('.bp-size');
    var cells = [];
    for (var i = 0; i < cap; i++) {
      var s = document.createElement('span');
      cellsBox.appendChild(s);
      cells.push(s);
    }

    var fmt = function (n) { return (Math.round(n * 10) / 10).toString(); };

    var update = function (kwh) {
      var a = Math.min(kwh, t1);
      var b = Math.max(0, Math.min(kwh, t2) - t1);
      var c = Math.max(0, Math.min(kwh, cap) - t2);
      var stc = Math.floor(factor * (a + b * p2 + c * p3) + 1e-9);
      stcOut.textContent = stc;
      kwhOut.textContent = kwh;
      var parts = [fmt(a) + ' kWh counted in full'];
      if (b) parts.push(fmt(b) + ' kWh at 60%');
      if (c) parts.push(fmt(c) + ' kWh at 15%');
      split.textContent = parts.join(', ') + ', at 6.8 certificates per kWh, rounded down to whole certificates, for a battery installed by 31 December 2026.';
      cells.forEach(function (el, idx) {
        var n = idx + 1;
        el.className = n > kwh ? '' : n <= t1 ? 'b1' : n <= t2 ? 'b2' : 'b3';
      });
      sizes.forEach(function (btn) {
        var on = Math.abs(+btn.dataset.kwh - kwh) < 0.01;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };

    input.addEventListener('input', function () { update(+input.value); });
    sizes.forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.dataset.kwh;
        update(+btn.dataset.kwh);
      });
    });
    update(+input.value);
  }

  // Entrances: each section's parts rise in turn, once.
  var groups = document.querySelectorAll('#main > section');
  groups.forEach(function (sec) {
    sec.querySelectorAll('[data-rise]').forEach(function (el, idx) {
      el.style.setProperty('--bp-i', Math.min(idx, 8));
    });
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    groups.forEach(function (g) { io.observe(g); });
  } else {
    document.documentElement.classList.add('bp-all-in');
  }

  // Recent work: one frame, contents change.
  var frame = document.querySelector('.bp-reel-frame');
  if (frame) {
    var imgs = frame.querySelectorAll('img');
    var reelCap = document.getElementById('bp-reel-cap');
    var at = 0, timer = null;
    var show = function (n) {
      imgs[at].classList.remove('is-on');
      at = (n + imgs.length) % imgs.length;
      imgs[at].classList.add('is-on');
      reelCap.textContent = imgs[at].dataset.cap;
    };
    var start = function () {
      if (reduce || timer) return;
      timer = setInterval(function () { show(at + 1); }, 3000);
    };
    frame.addEventListener('click', function () {
      clearInterval(timer); timer = null;
      show(at + 1);
      start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) start(); else { clearInterval(timer); timer = null; }
        });
      }).observe(frame);
    } else {
      start();
    }
  }
})();
