/* geo-pricing.js — Show INR for India, USD for everyone else.
   Detects visitor country via free geo-IP, then swaps every element
   carrying data-inr / data-usd attributes. Also patches the live
   JSON-LD and exposes window.FLIPICK_CURRENCY for calculator.js. */
(function () {
  'use strict';

  var USD_PER_INR = 0.012;          // 1 INR ≈ $0.012 (used only as label context)
  var CREDIT_USD  = 0.01;           // 1 credit = $0.01
  var STORAGE_KEY = 'flipick_geo';
  var CACHE_MS    = 86400000;       // 24 h

  /* --- state ------------------------------------------------------------ */
  var currency = 'INR';             // default until geo resolves
  var resolved = false;

  /* Expose for calculator.js */
  window.FLIPICK_CURRENCY = { code: 'INR', symbol: '₹', creditLabel: '₹1' };

  /* --- helpers ----------------------------------------------------------- */
  function applyPrices() {
    document.querySelectorAll('[data-inr]').forEach(function (el) {
      var val = currency === 'INR' ? el.getAttribute('data-inr') : el.getAttribute('data-usd');
      if (val !== null) el.textContent = val;
    });
    /* un-hide any element waiting on geo */
    document.querySelectorAll('.geo-cloak').forEach(function (el) {
      el.classList.remove('geo-cloak');
    });
  }

  function patchJsonLd() {
    if (currency === 'INR') return;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (tag) {
      try {
        var data = JSON.parse(tag.textContent);
        var changed = walkSchema(data);
        if (changed) tag.textContent = JSON.stringify(data, null, 2);
      } catch (e) { /* ignore malformed */ }
    });
  }

  function walkSchema(obj) {
    if (!obj || typeof obj !== 'object') return false;
    var changed = false;
    if (Array.isArray(obj)) {
      obj.forEach(function (item) { if (walkSchema(item)) changed = true; });
      return changed;
    }
    if (obj.priceCurrency === 'INR' && obj.price !== undefined) {
      obj.priceCurrency = 'USD';
      obj.price = String(Math.round(parseFloat(obj.price) * USD_PER_INR * 100) / 100);
      changed = true;
    }
    if (obj.minPrice !== undefined && obj.priceCurrency === 'USD') {
      obj.minPrice = String(Math.round(parseFloat(obj.minPrice) * USD_PER_INR * 100) / 100);
      obj.maxPrice = String(Math.round(parseFloat(obj.maxPrice) * USD_PER_INR * 100) / 100);
    }
    Object.keys(obj).forEach(function (k) {
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        if (walkSchema(obj[k])) changed = true;
      }
      if (typeof obj[k] === 'string') {
        var orig = obj[k];
        var replaced = orig
          .replace(/1 credit = ₹1/g, '1 credit = $0.01')
          .replace(/₹/g, '$');
        if (replaced !== orig) { obj[k] = replaced; changed = true; }
      }
    });
    return changed;
  }

  function setCurrency(code) {
    currency = code;
    resolved = true;
    var sym   = code === 'INR' ? '₹' : '$';
    var label = code === 'INR' ? '₹1' : '$0.01 (1¢)';
    window.FLIPICK_CURRENCY = { code: code, symbol: sym, creditLabel: label };
    applyPrices();
    patchJsonLd();
    /* fire custom event so calculator can re-render */
    document.dispatchEvent(new CustomEvent('geo:resolved', { detail: { currency: code } }));
  }

  /* --- detection --------------------------------------------------------- */
  function cached() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.ts < CACHE_MS) return obj.country;
    } catch (e) { /* private browsing etc. */ }
    return null;
  }

  function cache(country) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ country: country, ts: Date.now() })); }
    catch (e) { /* ignore */ }
  }

  function detect() {
    var country = cached();
    if (country) { setCurrency(country === 'IN' ? 'INR' : 'USD'); return; }

    var done = false;
    var timer = setTimeout(function () {
      if (!done) { done = true; setCurrency('INR'); }
    }, 2500);

    fetch('https://ipapi.co/json/', { mode: 'cors' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!done) {
          done = true;
          clearTimeout(timer);
          var cc = (data && data.country_code) || 'IN';
          cache(cc);
          setCurrency(cc === 'IN' ? 'INR' : 'USD');
        }
      })
      .catch(function () {
        if (!done) { done = true; clearTimeout(timer); setCurrency('INR'); }
      });
  }

  /* --- boot -------------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detect);
  } else {
    detect();
  }
})();
