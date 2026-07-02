/* main.js — Scroll reveal animation (IntersectionObserver) */
(function () {
  'use strict';
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || !els.length) return;

  document.documentElement.classList.add('reveal-ready');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

  els.forEach(function (el) { io.observe(el); });

  /* Fallback: reveal everything after 3s (covers edge cases) */
  setTimeout(function () {
    els.forEach(function (el) { el.classList.add('in'); });
  }, 3000);
})();
