/* navigation.js — Active nav state + mobile hamburger menu + dropdown */
(function () {
  'use strict';

  /* ---- Active nav state ----
     Each page sets data-page on <body>. The header include has data-navlink on each <a>.
     We match them here after the header include resolves. */
  function setActiveNav() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;

    document.querySelectorAll('[data-navlink]').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-navlink') === page);
    });

    /* Mark desktop dropdown trigger active if any child link is active */
    document.querySelectorAll('.nav-dropdown').forEach(function (dd) {
      var trigger = dd.querySelector('.nav-dd-trigger');
      if (trigger) trigger.classList.toggle('active', !!dd.querySelector('[data-navlink].active'));
    });

    document.querySelectorAll('[data-mobilenavlink]').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-mobilenavlink') === page);
    });

    /* Mark mobile dropdown trigger active + auto-expand if a child link is active */
    document.querySelectorAll('.mn-dropdown').forEach(function (dd) {
      var trigger = dd.querySelector('.mn-dd-trigger');
      var sub = dd.querySelector('.mn-dd-sub');
      var hasActive = !!dd.querySelector('[data-mobilenavlink].active');
      if (trigger) trigger.classList.toggle('active', hasActive);
      if (hasActive && sub) {
        sub.classList.add('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* ---- Mobile hamburger menu ---- */
  function initMobileMenu() {
    var toggle = document.getElementById('nav-toggle');
    var mobileNav = document.getElementById('mobile-nav');
    var closeBtn = document.getElementById('mobile-nav-close');

    if (!toggle || !mobileNav) return;

    toggle.addEventListener('click', function () {
      mobileNav.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    function closeMenu() {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    /* Close when clicking the overlay backdrop */
    mobileNav.addEventListener('click', function (e) {
      if (e.target === mobileNav) closeMenu();
    });

    /* Close on ESC */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    /* Close on nav link click (sub-links included; trigger button is excluded — it's a <button>) */
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  /* ---- Mobile dropdown accordion — event delegation ----
     Using document-level delegation means this works regardless of when the header
     is injected, and the _ddReady guard prevents duplicate listeners even if
     initMobileDropdowns() is somehow called more than once. */
  var _ddReady = false;
  function initMobileDropdowns() {
    if (_ddReady) return;
    _ddReady = true;
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('.mn-dd-trigger');
      if (!trigger) return;
      var dd = trigger.closest('.mn-dropdown');
      var sub = dd && dd.querySelector('.mn-dd-sub');
      if (!sub) return;
      var isOpen = sub.classList.contains('open');
      sub.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  }

  /* ---- Header/footer are injected by includes.js via fetch ----
     The done flag ensures cb() fires exactly once, even if the MutationObserver
     emits multiple records for the same outerHTML replacement (remove + add nodes). */
  function waitForHeader(cb) {
    if (document.querySelector('.nav')) { cb(); return; }
    var done = false;
    var tid;
    var observer = new MutationObserver(function (_, obs) {
      if (!done && document.querySelector('.nav')) {
        done = true;
        obs.disconnect();
        clearTimeout(tid);
        cb();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    tid = setTimeout(function () {
      if (!done) { done = true; cb(); }
    }, 2000);
  }

  /* initMobileDropdowns uses event delegation — safe to run immediately before header loads */
  initMobileDropdowns();
  waitForHeader(function () {
    setActiveNav();
    initMobileMenu();
  });
})();
