/* includes.js — Fetch-based header/footer injection with [[ROOT]] replacement */
(function () {
  'use strict';

  /* Compute the relative root path from the current page location.
     index.html is at root, pages/*.html are one level deep. */
  function getRootPath() {
    var depth = location.pathname.replace(/\\/g, '/').split('/').length - 1;
    // Count how many segments after the hostname represent directories
    // e.g. /flipick-website/pages/pricing.html → depth=2 → root=../../
    // But for IIS virtual directory at /flipick-website/ depth may vary.
    // We use a reliable method: count the path segments minus the filename.
    var parts = location.pathname.replace(/\\/g, '/').split('/');
    // Remove empty strings and filename
    parts = parts.filter(function (p) { return p !== ''; });
    parts.pop(); // remove the filename
    // If parts represent virtual directory + subdirs, we need to go up 'parts.length' levels
    // Actually we want the path to the root of our deployed folder.
    // The simplest approach: detect if 'pages' is in the path
    var inSubdir = location.pathname.indexOf('/pages/') !== -1;
    return inSubdir ? '../' : './';
  }

  function injectInclude(selector, url, root) {
    var placeholder = document.querySelector(selector);
    if (!placeholder) return;
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        /* Replace [[ROOT]] placeholder with computed relative root path */
        html = html.split('[[ROOT]]').join(root);
        var temp = document.createElement('div');
        temp.innerHTML = html;
        while (temp.firstChild) {
          placeholder.parentNode.insertBefore(temp.firstChild, placeholder);
        }
        placeholder.remove();
      })
      .catch(function (err) {
        console.warn('Could not load include:', url, err);
      });
  }

  var root = getRootPath();
  injectInclude('#header-placeholder', root + 'includes/header.html', root);
  injectInclude('#footer-placeholder', root + 'includes/footer.html', root);
})();
