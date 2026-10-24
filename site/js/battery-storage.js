(function () {
  'use strict';
  // Federal discount calculator. Rules come from data attributes on #discount,
  // which mirror src/data/rebates.json: factor per usable kWh, 100% to t1,
  // p2 to t2, p3 to cap.
  var sec = document.getElementById('discount');
  if (!sec) return;
  var d = sec.dataset;
  var factor = +d.factor, cap = +d.cap, t1 = +d.t1, t2 = +d.t2, p2 = +d.p2, p3 = +d.p3;
  var input = document.getElementById('bx-kwh');
  var out = document.getElementById('bx-kwh-out');
  var total = document.getElementById('bx-stc');
  var cells = {
    a: document.getElementById('bx-a'), b: document.getElementById('bx-b'), c: document.getElementById('bx-c'),
    sa: document.getElementById('bx-sa'), sb: document.getElementById('bx-sb'), sc: document.getElementById('bx-sc')
  };
  var sizes = sec.querySelectorAll('.bx-size');
  var round1 = function (n) { return String(Math.round(n * 100) / 100); };

  var update = function (kwh) {
    var a = Math.min(kwh, t1);
    var b = Math.max(0, Math.min(kwh, t2) - t1);
    var c = Math.max(0, Math.min(kwh, cap) - t2);
    var sa = factor * a, sb = factor * b * p2, sc = factor * c * p3;
    total.textContent = Math.floor(sa + sb + sc + 1e-9);
    out.textContent = kwh + ' kWh';
    cells.a.textContent = a; cells.b.textContent = b; cells.c.textContent = c;
    cells.sa.textContent = round1(sa); cells.sb.textContent = round1(sb); cells.sc.textContent = round1(sc);
    sizes.forEach(function (btn) {
      btn.setAttribute('aria-pressed', +btn.dataset.kwh === kwh ? 'true' : 'false');
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
})();
