/* ===== Big Jobs Consultancy — shared behaviour =====
 * Loaded with `defer` on every page. Three independent features; each one
 * bails out quietly if the elements it needs aren't on the page.
 */
(function () {
  'use strict';

  // Tells the inline <head> snippet that this file actually ran, so it leaves
  // the `js` class (and therefore the scroll-reveal styles) in place.
  window.__bjc = true;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    // Tapping a link navigates; close first so the menu isn't left open
    // if the target is the current page.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (isOpen() && !nav.contains(e.target) && !toggle.contains(e.target)) {
        setOpen(false);
      }
    });

    // Leaving mobile width with the menu open would strand the open class
    // on a desktop nav, so reset it.
    var desktop = window.matchMedia('(min-width: 769px)');
    function onWidthChange(e) { if (e.matches) setOpen(false); }
    if (desktop.addEventListener) {
      desktop.addEventListener('change', onWidthChange);
    } else if (desktop.addListener) {
      desktop.addListener(onWidthChange); // Safari < 14
    }
  }

  /* ---------- Count-up on the hero stats ---------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      if (isNaN(target)) return;

      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }

      var duration = 1400;
      var start = null;

      function frame(now) {
        if (start === null) start = now;
        var progress = Math.min((now - start) / duration, 1);
        // easeOutCubic: fast start, gentle settle
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) {
      var suffix = el.dataset.suffix || '';
      // Reduced-motion users get the final number immediately; everyone else
      // starts at zero and counts up once the strip scrolls into view.
      el.textContent = reduceMotion ? el.dataset.count + suffix : '0' + suffix;
      observer.observe(el);
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings so a grid cascades instead of popping at once.
        var siblings = Array.prototype.filter.call(
          el.parentElement.children,
          function (n) { return n.classList.contains('reveal'); }
        );
        var index = siblings.indexOf(el);
        el.style.transitionDelay = Math.min(index, 5) * 80 + 'ms';
        el.classList.add('is-visible');
        observer.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  initNav();
  initCounters();
  initReveal();
})();
