(function () {
  'use strict';

  // Genuine, verified HighLevel review widget URL — never edited, rewritten
  // or used to fabricate review text. #reviewsSection stays visible the
  // whole time, showing the .review-widget-loading spinner (see
  // src/pages/home/content.html / site/css/styles.css) until the widget
  // genuinely loads; if it never does (slow network, widget offline, or a
  // request an ad-blocker/tracker-blocker intercepts — see the
  // reachability pre-check below), the whole section hides itself
  // permanently rather than leaving an empty box on the page.
  var REVIEW_WIDGET_SRC =
    'https://link.ozhomeenergy.com.au/reputation/widgets/review_widget/iqh8HIe7GtEKNtnlIaho?widgetId=6a98ba1ddb444e2cfc4f0d6f';
  var LOAD_TIMEOUT_MS = 8000;
  var PRECHECK_TIMEOUT_MS = 4000;

  var section = document.getElementById('reviewsSection');
  var container = document.getElementById('reviewWidget');
  var loadingEl = document.getElementById('reviewWidgetLoading');
  if (!section || !container) return;

  var started = false;

  function fail() {
    // Clean, silent failure: hide the whole section, never an empty
    // loading spinner or a blocked/blank iframe left visible.
    section.hidden = true;
  }

  function startLoad() {
    if (started) return;
    started = true;

    var iframe = document.createElement('iframe');
    iframe.title = 'Oz Home Energy customer reviews';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';

    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      fail();
    }, LOAD_TIMEOUT_MS);

    iframe.addEventListener('load', function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (loadingEl) loadingEl.remove();
    });
    iframe.addEventListener('error', function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fail();
    });

    container.appendChild(iframe);
    iframe.src = REVIEW_WIDGET_SRC;
  }

  // A blocked-by-client iframe request (ad-blocker/tracker-blocker lists
  // commonly target third-party "reputation widget" embeds by URL path,
  // like this one) still fires a normal `load` event with empty content —
  // there's no reliable way to detect that from the iframe itself after
  // the fact. A lightweight no-cors reachability check against the exact
  // same widget URL first catches the same block (browsers reject a
  // fetch() the same blocklist rule would intercept) before an iframe is
  // ever created, so a blocked widget hides cleanly instead of rendering
  // as an empty box. GET (not HEAD) — some hosts don't support HEAD, and
  // in no-cors mode the response body/status are opaque either way, so
  // there's no cost to requesting the full resource.
  function precheckThenLoad() {
    if (!('fetch' in window)) {
      startLoad();
      return;
    }
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, PRECHECK_TIMEOUT_MS);
    fetch(REVIEW_WIDGET_SRC, {
      mode: 'no-cors',
      method: 'GET',
      signal: controller ? controller.signal : undefined,
    })
      .then(function () {
        clearTimeout(timer);
        startLoad();
      })
      .catch(function () {
        // Network-level failure (blocked by client, DNS/SSL failure, or
        // the abort above) — do not attempt the iframe at all.
        clearTimeout(timer);
        fail();
      });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            precheckThenLoad();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(section);
  } else {
    precheckThenLoad();
  }
})();
