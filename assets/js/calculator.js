/* calculator.js — Pricing credit calculator (pricing page only) */
(function () {
  'use strict';

  var tierRates = { none: 3300, light: 4250, moderate: 5500, heavy: 6250, creative: 8000 };
  var CREDIT_USD = 0.01;

  function distRate(n) {
    if (n <= 0)     return 0;
    if (n <= 100)   return 50;
    if (n <= 500)   return 37.5;
    if (n <= 2500)  return 30;
    if (n <= 10000) return 25;
    return 20;
  }

  function geo() { return window.FLIPICK_CURRENCY || { code: 'INR', symbol: '₹' }; }

  function fmt(n) {
    var rounded = Math.round(n);
    return geo().code === 'INR'
      ? rounded.toLocaleString('en-IN')
      : rounded.toLocaleString('en-US');
  }

  function fmtMoney(credits) {
    var g = geo();
    if (g.code === 'INR') return '→ ₹' + fmt(credits);
    var dollars = credits * CREDIT_USD;
    return '→ $' + dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function creditNote() {
    var g = geo();
    return g.code === 'INR'
      ? 'Estimate only · 1 credit = ₹1 · creation figures are tier midpoints/ceilings.'
      : 'Estimate only · 1 credit = $0.01 (1¢) · creation figures are tier midpoints/ceilings.';
  }

  function activeTier() {
    var btn = document.querySelector('#tierSeg button.on') ||
              document.querySelector('#tierSeg button.active');
    return btn ? btn.getAttribute('data-tier') : 'moderate';
  }

  function recalc() {
    var minsEl  = document.getElementById('mins');
    var rcptEl  = document.getElementById('rcpt');
    if (!minsEl || !rcptEl) return;

    var mins  = parseFloat(minsEl.value)  || 1;
    var rcpts = parseInt(rcptEl.value, 10) || 0;
    var tier  = activeTier();

    var create = mins  * (tierRates[tier] || tierRates.moderate);
    var rate   = distRate(rcpts);
    var dist   = rcpts * rate;
    var total  = create + dist;

    setText('vMins', mins.toFixed(1) + ' min');
    setText('vRcpt', rcpts >= 10000 ? '10,000+' : fmt(rcpts));
    setText('cCreate', fmt(create));
    setText('cDist', fmt(dist));
    setText('cTotal', fmt(total));
    setText('cRupee', fmtMoney(total));
    setText('cMinsLab', '· ' + mins.toFixed(1) + ' min, ' + tier);
    setText('cRateLab', rcpts > 0 ? '· ' + fmt(rcpts) + ' × ' + rate : '');

    var noteEl = document.getElementById('cRupee');
    if (noteEl) {
      var rnote = noteEl.nextElementSibling;
      if (rnote && rnote.classList.contains('rnote')) rnote.textContent = creditNote();
    }
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function init() {
    if (!document.getElementById('mins')) return;

    document.getElementById('mins').addEventListener('input', recalc);
    document.getElementById('rcpt').addEventListener('input', recalc);

    document.querySelectorAll('#tierSeg button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#tierSeg button').forEach(function (b) {
          b.classList.remove('on', 'active');
        });
        btn.classList.add('on');
        recalc();
      });
    });

    recalc();

    document.addEventListener('geo:resolved', function () { recalc(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
