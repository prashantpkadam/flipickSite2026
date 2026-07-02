/* config.js — Site-wide configuration.
   To change all "Book a demo" links across the site, update demoUrl below. */
var FLIPICK = {
  demoUrl: 'https://calendly.com/rahul-uppal-flipick/30min'
};

(function () {
  'use strict';

  function applyDemoLinks(root) {
    var links = (root || document).querySelectorAll('[data-demo-link]');
    links.forEach(function (el) {
      el.setAttribute('href', FLIPICK.demoUrl);
    });
  }

  /* Apply to links already in the page DOM */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyDemoLinks(); });
  } else {
    applyDemoLinks();
  }

  /* Apply to header/footer links injected asynchronously by includes.js */
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) { applyDemoLinks(node); }
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
