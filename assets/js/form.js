/* form.js — Contact form: validation, submission, and button states */
(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────────────
  var API_URL = '../api/send-mail.php';

  // Validation rules for each field
  var RULES = {
    cName:    { min: 2,  msg: 'Please enter your name (min 2 characters).' },
    cEmail:   { email: true, msg: 'Please enter a valid work email address.' },
    cCompany: { min: 2,  msg: 'Please enter your company name (min 2 characters).' },
    cTopic:   { select: true, msg: 'Please select a topic.' },
    cMsg:     { min: 10, msg: 'Please enter a message (min 10 characters).' }
  };

  // Track which fields have been "touched" (blurred or typed in at least once)
  var touched = {};
  // Track validity of each field
  var validity = { cName: false, cEmail: false, cCompany: false, cTopic: false, cMsg: false };

  // ── DOM refs ─────────────────────────────────────────────────────────────
  var formWrap, formOk, btn, btnText, serverErr;

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    formWrap  = document.getElementById('formWrap');
    if (!formWrap) return;

    formOk    = document.getElementById('formOk');
    btn       = document.getElementById('cSend');
    btnText   = document.getElementById('cSendText');
    serverErr = document.getElementById('formServerErr');

    Object.keys(RULES).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;

      // Validate live while typing — only after the field has been touched
      el.addEventListener('input', function () {
        touched[id] = true;
        validateField(id);
        updateButton();
      });

      // Validate immediately on blur (tab away)
      el.addEventListener('blur', function () {
        touched[id] = true;
        validateField(id);
        updateButton();
      });
    });

    btn.addEventListener('click', handleSubmit);
  }

  // ── Validate a single field ───────────────────────────────────────────────
  function validateField(id) {
    var el   = document.getElementById(id);
    var err  = document.getElementById(id + 'Err');
    var rule = RULES[id];
    if (!el || !err || !rule) return;

    var val   = el.value.trim();
    var valid = false;

    if (rule.email) {
      valid = val.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    } else if (rule.select) {
      valid = val !== '' && val !== '— select a topic —';
    } else {
      valid = val.length >= rule.min;
    }

    validity[id] = valid;

    // Only show visual feedback if the field has been touched
    if (!touched[id]) return;

    el.classList.toggle('f-invalid', !valid);
    el.classList.toggle('f-valid',    valid);
    err.textContent = valid ? '' : rule.msg;
    err.classList.toggle('show', !valid);
  }

  // ── Enable / disable submit button ───────────────────────────────────────
  function updateButton() {
    var allValid = Object.keys(validity).every(function (k) { return validity[k]; });
    btn.disabled = !allValid;
  }

  // ── Submit handler ────────────────────────────────────────────────────────
  function handleSubmit() {
    // Force-touch all fields and validate before submitting
    Object.keys(RULES).forEach(function (id) {
      touched[id] = true;
      validateField(id);
    });
    updateButton();

    if (btn.disabled) return;

    var payload = {
      name:    document.getElementById('cName').value.trim(),
      email:   document.getElementById('cEmail').value.trim(),
      company: document.getElementById('cCompany').value.trim(),
      topic:   document.getElementById('cTopic').value.trim(),
      message: document.getElementById('cMsg').value.trim()
    };

    setLoading(true);
    hideServerError();

    fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (res) {
      var status = res.status;
      // Read raw text first — if IIS returns an HTML error page res.json() would throw
      return res.text().then(function (text) {
        try {
          var data = JSON.parse(text);
          return { ok: res.ok, status: status, data: data };
        } catch (e) {
          console.error('[Web3Forms] HTTP ' + status + ' — non-JSON response:\n' + text);
          throw new Error('HTTP_' + status);
        }
      });
    })
    .then(function (result) {
      setLoading(false);
      if (result.ok && result.data.success) {
        onSuccess();
      } else {
        var msg = (result.data && result.data.message)
          ? result.data.message
          : 'Something went wrong. Please try again.';
        showServerError(msg);
      }
    })
    .catch(function (err) {
      setLoading(false);
      var code = err && err.message ? err.message : '';
      var msg  = 'Something went wrong. Please try again.';
      if (code === 'Failed to fetch' || code.indexOf('NetworkError') !== -1) {
        msg = 'Network error — please check your connection and try again.';
      }
      console.error('[Web3Forms] fetch failed:', code || err);
      showServerError(msg);
    });
  }

  // ── Button state helpers ──────────────────────────────────────────────────
  function setLoading(on) {
    btn.classList.toggle('btn-loading', on);
    btn.disabled = on;
    if (on) btnText.textContent = 'Sending…';
  }

  function onSuccess() {
    btn.disabled = true;
    btn.classList.add('btn-success');
    btnText.textContent = '✓ Sent!';

    setTimeout(function () {
      if (formWrap) formWrap.style.display = 'none';
      if (formOk) {
        formOk.style.display = 'flex';
        formOk.style.animation = 'ok-fadein 0.5s ease forwards';
      }
      setTimeout(resetForm, 7000);
    }, 1500);
  }

  function resetForm() {
    if (formOk) {
      // Must clear the animation first — its `forwards` fill locks opacity:1
      // and silently overrides any direct opacity assignment.
      formOk.style.animation  = 'none';
      formOk.style.transition = 'opacity 0.3s ease';
      formOk.style.opacity    = '0';
    }

    setTimeout(function () {
      // cssText='' wipes all inline styles: CSS `.cform .ok { display:none }` then hides it.
      if (formOk)   formOk.style.cssText  = '';
      // display='' removes the inline display:none, letting the div default to block.
      if (formWrap) formWrap.style.display = '';

      Object.keys(RULES).forEach(function (id) {
        var el  = document.getElementById(id);
        var err = document.getElementById(id + 'Err');
        if (el) {
          if (el.tagName === 'SELECT') { el.selectedIndex = 0; } else { el.value = ''; }
          el.classList.remove('f-valid', 'f-invalid');
        }
        if (err) { err.textContent = ''; err.classList.remove('show'); }
      });

      touched  = {};
      validity = { cName: false, cEmail: false, cCompany: false, cTopic: false, cMsg: false };

      btn.classList.remove('btn-success', 'btn-loading');
      btnText.textContent = 'Send message';
      btn.disabled = true;
      hideServerError();
    }, 300);
  }

  function showServerError(msg) {
    if (!serverErr) return;
    serverErr.textContent = msg;
    serverErr.classList.add('show');
    // Re-enable button so user can retry
    btn.disabled  = false;
    btnText.textContent = 'Send message';
  }

  function hideServerError() {
    if (!serverErr) return;
    serverErr.textContent = '';
    serverErr.classList.remove('show');
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
