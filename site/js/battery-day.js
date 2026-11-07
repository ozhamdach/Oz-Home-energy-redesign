/* Battery day — drives the "day on your home" scene on /battery-storage/.
   REAL DATA (7 Nov 2026): 6 November 2026 on an Oz Home Energy install with
   13.3 kW of solar, a FoxESS H3-10.0-Smart 9.9 kW hybrid inverter and
   41.94 kWh of battery (9 x FoxESS EQ4800). Solar ("Gen Load"), home use
   and battery % were read off the home's FoxESS app chart into 15-minute
   steps (calibrated to the chart's own gridlines). Battery % is shown exactly
   as the app recorded it. Battery and grid flows follow from solar and home
   use the way this system runs: solar to the house first, then the battery,
   export only once the battery is full. Flow direction agrees with the real
   battery % at 95 of 96 steps (the other is the 7:45 am turning point).
   Day totals: solar 63 kWh, home 33 kWh, export 26 kWh, grid import 0.
   No money or percentage-saved figure is produced. */
(function () {
  'use strict';
  var root = document.querySelector('[data-bxd-root]');
  if (!root) return;

  // [solar, home, battery %, solar-to-home, battery charge, battery discharge,
  //  grid import, grid export] in kW (battery in %), one row per 15 minutes.
  var N = 96, STEP = 0.25;
  var DATA = [
    [0,0.37,76.2,0,0,0.37,0,0],
    [0,0.39,76.2,0,0,0.39,0,0],
    [0,0.49,75.8,0,0,0.49,0,0],
    [0,0.38,75.4,0,0,0.38,0,0],
    [0,0.31,75.4,0,0,0.31,0,0],
    [0,0.33,75.2,0,0,0.33,0,0],
    [0,0.36,74.2,0,0,0.36,0,0],
    [0,0.42,74.2,0,0,0.42,0,0],
    [0,0.41,74.1,0,0,0.41,0,0],
    [0,0.3,73.4,0,0,0.3,0,0],
    [0,0.4,73.4,0,0,0.4,0,0],
    [0,0.38,73.4,0,0,0.38,0,0],
    [0,0.37,72.5,0,0,0.37,0,0],
    [0,0.32,72.3,0,0,0.32,0,0],
    [0,0.34,72.3,0,0,0.34,0,0],
    [0,0.5,71.9,0,0,0.5,0,0],
    [0,0.99,71.2,0,0,0.99,0,0],
    [0,1.04,70.3,0,0,1.04,0,0],
    [0,1.12,69.5,0,0,1.12,0,0],
    [0,0.54,69.2,0,0,0.54,0,0],
    [0,0.32,68.3,0,0,0.32,0,0],
    [0,0.3,68.3,0,0,0.3,0,0],
    [0,0.3,68.3,0,0,0.3,0,0],
    [0,1.2,67.5,0,0,1.2,0,0],
    [0.1,1.9,66.6,0.1,0,1.8,0,0],
    [0.21,6.96,63.9,0.21,0,6.75,0,0],
    [0.46,3.88,60.1,0.46,0,3.42,0,0],
    [0.57,1.53,58.3,0.57,0,0.96,0,0],
    [0.94,4.98,57.1,0.94,0,4.04,0,0],
    [1.24,5.71,54.1,1.24,0,4.47,0,0],
    [0.94,3.03,51.2,0.94,0,2.09,0,0],
    [3.22,1.36,50.3,1.36,1.86,0,0,0],
    [2.93,1.06,50.6,1.06,1.87,0,0,0],
    [3.67,1.29,52,1.29,2.38,0,0,0],
    [4.35,1.09,53.6,1.09,3.26,0,0,0],
    [1.7,1.21,55.2,1.21,0.49,0,0,0],
    [4.84,0.39,56.4,0.39,4.45,0,0,0],
    [4.87,0.31,59.3,0.31,4.56,0,0,0],
    [2.71,0.39,61.6,0.39,2.32,0,0,0],
    [4.74,0.4,64.2,0.4,4.34,0,0,0],
    [6.56,0.58,67.5,0.58,5.98,0,0,0],
    [5.25,0.44,71.3,0.44,4.81,0,0,0],
    [7.57,0.54,75,0.54,7.03,0,0,0],
    [6.43,0.32,79.5,0.32,6.11,0,0,0],
    [4.07,0.93,84.1,0.93,3.14,0,0,0],
    [8.7,1.76,89.9,1.76,6.94,0,0,0],
    [7.11,1.69,94.5,1.69,5.42,0,0,0],
    [8.45,4.61,97.5,4.61,3.84,0,0,0],
    [8.23,7.03,99.9,7.03,0,0,0,1.2],
    [8.03,8.11,100,8.03,0,0.08,0,0],
    [8.25,6.04,100,6.04,0,0,0,2.21],
    [8.06,2.51,100,2.51,0,0,0,5.55],
    [8.06,1.7,100,1.7,0,0,0,6.36],
    [7.99,6,100,6,0,0,0,1.99],
    [7.93,4.96,100,4.96,0,0,0,2.97],
    [7.86,3.73,100,3.73,0,0,0,4.13],
    [7.49,1.08,100,1.08,0,0,0,6.41],
    [7.71,1.08,100,1.08,0,0,0,6.63],
    [7.32,0.83,100,0.83,0,0,0,6.49],
    [7.03,0.19,100,0.19,0,0,0,6.84],
    [6.77,0.36,100,0.36,0,0,0,6.41],
    [6.44,0.41,100,0.41,0,0,0,6.03],
    [6.07,0.66,100,0.66,0,0,0,5.41],
    [6.25,0.58,100,0.58,0,0,0,5.67],
    [5.48,0.5,100,0.5,0,0,0,4.98],
    [5.07,0.48,100,0.48,0,0,0,4.59],
    [4.7,0.41,100,0.41,0,0,0,4.29],
    [4.39,0.53,100,0.53,0,0,0,3.86],
    [3.95,0.46,100,0.46,0,0,0,3.49],
    [3.6,0.53,100,0.53,0,0,0,3.07],
    [3.25,0.45,100,0.45,0,0,0,2.8],
    [2.92,0.55,100,0.55,0,0,0,2.37],
    [2.57,1.06,100,1.06,0,0,0,1.51],
    [2.16,2.15,100,2.15,0,0,0,0.01],
    [1.42,3.02,100,1.42,0,1.6,0,0],
    [0.84,1.73,99.5,0.84,0,0.89,0,0],
    [0.54,1.4,99.3,0.54,0,0.86,0,0],
    [0.11,1.3,98.5,0.11,0,1.19,0,0],
    [0,1.26,97.5,0,0,1.26,0,0],
    [0,1.26,96.6,0,0,1.26,0,0],
    [0,1.32,95.9,0,0,1.32,0,0],
    [0,1.35,94.9,0,0,1.35,0,0],
    [0,1.29,93.9,0,0,1.29,0,0],
    [0,0.56,93.4,0,0,0.56,0,0],
    [0,0.54,93.3,0,0,0.54,0,0],
    [0,0.52,92.3,0,0,0.52,0,0],
    [0,0.49,92.3,0,0,0.49,0,0],
    [0,0.64,91.6,0,0,0.64,0,0],
    [0,0.73,91.4,0,0,0.73,0,0],
    [0,0.48,90.9,0,0,0.48,0,0],
    [0,0.57,90.3,0,0,0.57,0,0],
    [0,0.51,90.2,0,0,0.51,0,0],
    [0,0.54,89.3,0,0,0.54,0,0],
    [0,0.53,89.3,0,0,0.53,0,0],
    [0,0.47,88.9,0,0,0.47,0,0],
    [0,0.6,88.3,0,0,0.6,0,0]
  ];
  var KEYS = ['solar', 'home', 'socPct', 's2h', 'ch', 'dis', 'imp', 'exp'];

  function sample(t) { // t: fractional step index, interpolated between rows
    t = ((t % N) + N) % N;
    var i = Math.floor(t), j = (i + 1) % N, f = t - i, o = {};
    for (var k = 0; k < KEYS.length; k++) o[KEYS[k]] = DATA[i][k] + (DATA[j][k] - DATA[i][k]) * f;
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
    var pct = Math.min(100, Math.round(d.socPct)), hgt = 49 * Math.min(100, d.socPct) / 100;
    level.setAttribute('y', (280 - hgt).toFixed(1)); level.setAttribute('height', hgt.toFixed(1));
    var ledColor = d.ch > 0.05 ? '#22a061' : (d.dis > 0.05 ? '#f2a516' : '#9aa6b8');
    led.setAttribute('fill', ledColor);
    // flows
    setFlow('solarHome', d.s2h); setFlow('solarBatt', d.ch); setFlow('battHome', d.dis);
    setFlow('gridIn', d.imp); setFlow('gridOut', d.exp);
    // readouts
    var time = clock(h), phase = phaseOf(h);
    var batt = d.ch > 0.05 ? 'Charging ' + kw(d.ch) : (d.dis > 0.05 ? 'Powering the home ' + kw(d.dis) : (pct >= 100 ? 'Full' : 'Idle'));
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
