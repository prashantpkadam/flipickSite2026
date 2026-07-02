/* calculator.js — Pricing credit calculator (pricing page only) */
(function () {
  'use strict';

  var tierRates = { none: 3300, light: 4250, moderate: 5500, heavy: 6250, creative: 8000 };

  function distRate(n) {
    if (n <= 0)     return 0;
    if (n <= 100)   return 50;
    if (n <= 500)   return 37.5;
    if (n <= 2500)  return 30;
    if (n <= 10000) return 25;
    return 20;
  }

  function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }

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
    setText('cRupee', '→ ₹' + fmt(total));
    setText('cMinsLab', '· ' + mins.toFixed(1) + ' min, ' + tier);
    setText('cRateLab', rcpts > 0 ? '· ' + fmt(rcpts) + ' × ' + rate : '');
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
