/* Battery day (6 Nov 2026) — drives the "day on your home" scene on
   /battery-storage/. One illustrative energy model, clearly captioned on the
   page as an example: 6.6 kW solar on a clear spring day, a 10 kWh battery
   (5 kW, 95% charge efficiency, 5% reserve) and a home using ~20 kWh a day.
   Every number shown comes from this model, so the scene, readouts and
   cards always agree. No money or percentage-saved figure is produced.
   TODO-OZ: replace the profiles with one real install's data when supplied. */
(function () {
  'use strict';
  var root = document.querySelector('[data-bxd-root]');
  if (!root) return;

  // ---- model (15-minute steps) ------------------------------------------
  var N = 96, STEP = 0.25, CAP = 10, RES = 0.5, PMAX = 5, EFF = 0.95;
  function solar(h) {
    if (h <= 6.5 || h >= 18.5) return 0;
    return 4.6 * Math.pow(Math.sin(Math.PI * (h - 6.5) / 12), 1.5);
  }
  function load(h) {
    function g(c, s) { return Math.exp(-0.5 * Math.pow((h - c) / s, 2)); }
    return 0.35 + (h >= 9 && h <= 16 ? 0.25 : 0) + 1.1 * g(7.3, 0.55) + 2.3 * g(19.2, 1.35) + 0.4 * g(13, 0.8);
  }
  function simulate(soc0) {
    var soc = soc0, rows = [];
    for (var i = 0; i < N; i++) {
      var h = i * STEP, s = solar(h), l = load(h);
      var s2h = Math.min(s, l), surplus = s - s2h, deficit = l - s2h;
      var ch = Math.max(0, Math.min(surplus, PMAX, (CAP - soc) / (STEP * EFF)));
      var dis = Math.max(0, Math.min(deficit, PMAX, (soc - RES) / STEP));
      rows.push({ h: h, solar: s, home: l, soc: soc, s2h: s2h, ch: ch, dis: dis, imp: deficit - dis, exp: surplus - ch });
      soc = soc + ch * STEP * EFF - dis * STEP;
    }
    return { rows: rows, end: soc };
  }
  var run = { end: 3 };
  for (var k = 0; k < 5; k++) run = simulate(run.end); // settle to a repeating day
  var rows = run.rows;

  function sample(t) { // t: fractional step index, interpolated
    t = ((t % N) + N) % N;
    var i = Math.floor(t), j = (i + 1) % N, f = t - i, a = rows[i], b = rows[j], o = {};
    for (var key in a) o[key] = a[key] + (b[key] - a[key]) * f;
    o.h = t * STEP;
    return o;
  }

  // ---- DOM ----------------------------------------------------------------
  var $ = function (sel) { return root.querySelector(sel); };
  var out = {};
  Array.prototype.forEach.call(root.querySelectorAll('[data-bxd]'), function (el) { out[el.getAttribute('data-bxd')] = el; });
  var slider = document.getElementById('bxdTime');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.bxd-card'));
  var flows = {};
  Array.prototype.forEach.call(root.querySelectorAll('[data-flow]'), function (el) { flows[el.getAttribute('data-flow')] = el; });
  var sun = $('#bxdSun'), moon = $('#bxdMoon'), stars = $('#bxdStars'), night = $('#bxdNight'), dusk = $('#bxdDusk');
  var level = $('#bxdLevel'), led = $('#bxdLed'), glows = root.querySelectorAll('.bxd-glow');

  function kw(v) { return (Math.round(v * 10) / 10).toFixed(1) + ' kW'; }
  function clock(h) {
    var m = Math.round(h * 4) * 15, hh = Math.floor(m / 60) % 24, mm = m % 60;
    var ap = hh < 12 ? 'am' : 'pm', h12 = hh % 12 === 0 ? 12 : hh % 12;
    return h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap;
  }
  function phaseOf(h) {
    if (h >= 5 && h < 10) return 'Morning';
    if (h >= 10 && h < 16) return 'Midday';
    if (h >= 16 && h < 22) return 'Evening';
    return 'Overnight';
  }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function setFlow(name, power) {
    var el = flows[name]; if (!el) return;
    var on = power > 0.05;
    el.style.opacity = on ? '1' : '0';
    el.style.strokeWidth = on ? Math.min(7, 2.5 + power * 1.1).toFixed(2) : '2';
  }

  var lastPhase = '';
  function render(t) {
    var d = sample(t), h = d.h;
    // sky
    var day = smooth(5.6, 7.2, h) * (1 - smooth(17.6, 19.2, h));
    var duskAmt = Math.max(1 - Math.abs(h - 6.6) / 1.2, 1 - Math.abs(h - 18.4) / 1.2, 0);
    night.setAttribute('opacity', ((1 - day) * 0.6).toFixed(3));
    dusk.setAttribute('opacity', (duskAmt * 0.55).toFixed(3));
    stars.setAttribute('opacity', (1 - day).toFixed(3));
    moon.setAttribute('opacity', (1 - day).toFixed(3));
    var p = Math.min(1, Math.max(0, (h - 5.8) / 13)), sx = 40 + p * 560, sy = 262 - Math.sin(Math.PI * p) * 214;
    sun.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ')');
    sun.setAttribute('opacity', (h > 5.5 && h < 19.3 ? 1 : 0));
    var glow = ((1 - day) * Math.min(1, 0.25 + d.home / 2.4)).toFixed(3);
    Array.prototype.forEach.call(glows, function (g) { g.setAttribute('opacity', glow); });
    // battery
    var pct = Math.round((d.soc / CAP) * 100), hgt = 49 * d.soc / CAP;
    level.setAttribute('y', (280 - hgt).toFixed(1)); level.setAttribute('height', hgt.toFixed(1));
    var ledColor = d.ch > 0.05 ? '#22a061' : (d.dis > 0.05 ? '#f2a516' : '#9aa6b8');
    led.setAttribute('fill', ledColor);
    // flows
    setFlow('solarHome', d.s2h); setFlow('solarBatt', d.ch); setFlow('battHome', d.dis);
    setFlow('gridIn', d.imp); setFlow('gridOut', d.exp);
    // readouts
    var time = clock(h), phase = phaseOf(h);
    var batt = d.ch > 0.05 ? 'Charging ' + kw(d.ch) : (d.dis > 0.05 ? 'Powering the home ' + kw(d.dis) : 'Idle');
    var grid = d.imp > 0.05 ? 'Importing ' + kw(d.imp) : (d.exp > 0.05 ? 'Exporting ' + kw(d.exp) : 'Not needed');
    out.time.textContent = time; out.phase.textContent = phase;
    out.solar.textContent = kw(d.solar); out.home.textContent = kw(d.home);
    out.soc.textContent = pct + '%'; out.battState.textContent = batt; out.grid.textContent = grid;
    out.socBar.style.width = pct + '%';
    out.chipSolar.textContent = kw(d.solar); out.chipHome.textContent = kw(d.home);
    out.chipBatt.textContent = pct + '%'; out.chipGrid.textContent = d.imp > 0.05 ? 'Importing' : (d.exp > 0.05 ? 'Exporting' : 'Idle');
    slider.setAttribute('aria-valuetext', time + ': solar ' + kw(d.solar) + ', home using ' + kw(d.home) + ', battery ' + pct + '%, grid ' + grid.toLowerCase());
    if (phase !== lastPhase) {
      lastPhase = phase;
      cards.forEach(function (c) { c.setAttribute('aria-pressed', String(c.querySelector('.bxd-card-name').textContent === phase)); });
    }
  }

  // ---- interaction --------------------------------------------------------
  var t = Number(slider.value), playing = false, raf = 0, last = 0, DAY_MS = 16000;
  function setPlaying(on) {
    playing = on;
    out.play.setAttribute('aria-pressed', String(on));
    out.play.setAttribute('aria-label', on ? 'Pause' : 'Play through the day');
    if (on) { last = 0; raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf);
  }
  function tick(now) {
    if (!playing) return;
    if (last) t = (t + (now - last) / DAY_MS * N) % N;
    last = now;
    slider.value = String(Math.round(t) % N);
    render(t);
    raf = requestAnimationFrame(tick);
  }
  slider.addEventListener('input', function () { if (playing) setPlaying(false); t = Number(slider.value); render(t); });
  out.play.addEventListener('click', function () { setPlaying(!playing); });
  cards.forEach(function (c) {
    c.addEventListener('click', function () {
      if (playing) setPlaying(false);
      t = Number(c.getAttribute('data-time')); slider.value = String(t); render(t);
    });
  });
  // Pause the flow animation (and any play-through) while off screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        root.classList.toggle('bxd-offscreen', !e.isIntersecting);
        if (!e.isIntersecting && playing) setPlaying(false);
      });
    }).observe(root);
  }
  // Phones: crop in on the house, battery and pole so they read at 390px.
  var svg = root.querySelector('.bxd-scene svg');
  if (svg && window.matchMedia) {
    var mq = window.matchMedia('(max-width: 560px)');
    var frame = function () { svg.setAttribute('viewBox', mq.matches ? '120 18 470 352.5' : '0 0 640 360'); };
    frame();
    if (mq.addEventListener) mq.addEventListener('change', frame); else if (mq.addListener) mq.addListener(frame);
  }
  render(t);
})();
