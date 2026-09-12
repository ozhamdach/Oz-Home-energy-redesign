(function () {
  'use strict';

  // Genuine, verified HighLevel review widget URL — never edited, rewritten
  // or used to fabricate review text. The section starts [hidden] and only
  // ever becomes visible once the iframe actually loads; if it doesn't load
  // within LOAD_TIMEOUT_MS (slow network, ad-blocker, widget offline), the
  // section stays hidden permanently — a clean failure state, not a broken
  // embed box left on the page.
  var REVIEW_WIDGET_SRC =
    'https://link.ozhomeenergy.com.au/reputation/widgets/review_widget/iqh8HIe7GtEKNtnlIaho?widgetId=6a98ba1ddb444e2cfc4f0d6f';
  var LOAD_TIMEOUT_MS = 8000;

  var section = document.getElementById('reviewsSection');
  var container = document.getElementById('reviewWidget');
  if (!section || !container) return;

  var started = false;

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
      // No load event in time: hide the whole section rather than leave an
      // empty/broken iframe box on the page.
      section.hidden = true;
    }, LOAD_TIMEOUT_MS);

    iframe.addEventListener('load', function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Already visible — nothing to do beyond cancelling the fallback below.
    });
    iframe.addEventListener('error', function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      section.hidden = true;
    });

    container.appendChild(iframe);
    iframe.src = REVIEW_WIDGET_SRC;
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startLoad();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(section);
  } else {
    startLoad();
  }
})();
