/* Homepage hero loop — progressive enhancement only.
 *
 * The genuine photograph (the <img> inside .hero-frame) is the poster, the
 * LCP element and the permanent fallback; this script never touches it. The
 * silent, decorative loop is added after the page has loaded and the browser
 * is idle, and only when it will not cost anything that matters:
 *   - viewport at least 900px wide (phones and small tablets keep the still)
 *   - no prefers-reduced-motion, no Data Saver, no 2G-class connection
 *   - the tab is visible and the hero is on screen
 * If any source fails to load, the video is removed and the still remains.
 * The video is aria-hidden: it carries no information the still does not.
 */
(function () {
  'use strict';

  var hero = document.querySelector('.hero--home');
  var tpl = document.getElementById('hero-video-template');
  if (!hero || !tpl || !tpl.content) return;
  var frame = hero.querySelector('.hero-frame');
  if (!frame || typeof window.matchMedia !== 'function') return;

  var wide = window.matchMedia('(min-width: 900px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
  if (!wide.matches || reduce.matches || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')) return;

  var video = null;
  var visible = true;

  function allowed() {
    return wide.matches && !reduce.matches && document.visibilityState === 'visible' && visible;
  }

  function sync() {
    if (!video) return;
    if (!wide.matches || reduce.matches) {
      remove();
      return;
    }
    if (allowed()) {
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () { remove(); });
    } else {
      video.pause();
    }
  }

  function remove() {
    if (!video) return;
    video.pause();
    if (video.parentNode) video.parentNode.removeChild(video);
    video = null;
  }

  function start() {
    if (video || !allowed()) return;
    var node = tpl.content.firstElementChild;
    if (!node) return;
    video = node.cloneNode(true);
    // Set as properties as well as attributes: autoplay policies key off the
    // live muted state, not the markup.
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    video.tabIndex = -1;
    var sources = video.querySelectorAll('source');
    var last = sources[sources.length - 1];
    if (last) last.addEventListener('error', remove);
    video.addEventListener('error', remove);
    video.addEventListener('playing', function () {
      if (video) video.classList.add('is-playing');
    });
    frame.appendChild(video);
    var p = video.play();
    if (p && typeof p.catch === 'function') p.catch(function () { remove(); });
  }

  function whenIdle(fn) {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 2500 });
    else window.setTimeout(fn, 1200);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      sync();
    }, { threshold: 0.05 }).observe(hero);
  }
  document.addEventListener('visibilitychange', sync);
  [wide, reduce].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else if (mq.addListener) mq.addListener(sync);
  });

  if (document.readyState === 'complete') whenIdle(start);
  else window.addEventListener('load', function () { whenIdle(start); }, { once: true });
})();
