(function () {
  'use strict';

  /* ================================================================
     CONFIGURATION
     ================================================================ */

  /* Optional: paste your YouTube Data API v3 key for faster duration
     fetching (one HTTP request). Leave empty to use the IFrame API
     fallback (no key needed — loads a hidden player per video).
     Get a key at: https://console.cloud.google.com → YouTube Data API v3 */
  var YT_API_KEY = '';

  /* VIDEO LINKS  —  paste the full YouTube URL for each placeholder.
     Supports any YouTube URL format:
       https://youtu.be/wfMoSIuWX_Q?si=...
       https://www.youtube.com/watch?v=wfMoSIuWX_Q             */

  /* index.html ---------------------------------------------------- */
  var V_INDEX_HERO        = 'https://storage.googleapis.com/flipick-videos-gen/84fb0511-326c-47dc-8437-d0b25f01e613-01_Hero Video.mp4'; // Hero section showreel
  var V_INDEX_SCREENPLAY  = 'https://storage.googleapis.com/flipick-videos-gen/722fe6d3-c1ab-46e9-acfe-0bb025c48dd2-Home_the Studio Pipeline.mp4'; // Screenplay → Storyboard
  var V_INDEX_CONSISTENCY = 'https://storage.googleapis.com/flipick-videos-gen/0fc443da-83e4-4645-9382-decc4266e66f-03_THE DIFFERENCE_CONSISTENCY.mp4'; // Consistency
  var V_INDEX_PROMO       = 'https://storage.googleapis.com/flipick-videos-gen/246252c2-2301-4d8b-9ab1-a1c47d1c428f-4_ONE PLATFORM, MANY USES.mp4'; // Festive product promo

  /* pages/solutions.html ----------------------------------------- */
  var V_SOLUTIONS_LD       = 'https://storage.googleapis.com/flipick-videos-gen/246252c2-2301-4d8b-9ab1-a1c47d1c428f-4_ONE PLATFORM, MANY USES.mp4'; // By team – One lesson, five languages
  var V_SOLUTIONS_PROMO    = 'https://storage.googleapis.com/flipick-videos-gen/0cfb4eba-4a52-4436-989e-cb086917f56a-2_TRAINING Â· ADS Â· FILM Â· EXPLAINERS 1.mp4'; // By content type – Festive product promo
  var V_SOLUTIONS_PERSONAL = 'https://storage.googleapis.com/flipick-videos-gen/0bce4242-1d00-43a1-9b58-715d88b637b3-3_MULTILINGUAL Â· ACCURATE Â· AUDIT-READY 1.mp4'; // By industry – One film, personal versions

  /* pages/lp-hr-ld.html ------------------------------------------ */
  var V_LP_INTRO = 'https://flipick.com/assets/Introduction%20to%20Flipick%201.mp4'; // Introduction to Flipick
  var V_LP_POSH  = 'https://flipick.com/assets/Introduction%20to%20Flipick%201.mp4'; // POSH Training sample

  /* ================================================================ */

  var VIDEO_MAP = {
    'index-hero':             V_INDEX_HERO,
    'index-screenplay':       V_INDEX_SCREENPLAY,
    'index-consistency':      V_INDEX_CONSISTENCY,
    'index-promo':            V_INDEX_PROMO,
    'solutions-ld':           V_SOLUTIONS_LD,
    'solutions-promo':        V_SOLUTIONS_PROMO,
    'solutions-personal':     V_SOLUTIONS_PERSONAL,
    'lp-intro':               V_LP_INTRO,
    'lp-posh':                V_LP_POSH
  };

  /* Resolve site root from this script's own URL so paths work whether
     the page is at the root (index.html) or in a sub-folder (pages/). */
  var _scriptSrc  = (document.currentScript || {src: ''}).src;
  var _siteRoot   = _scriptSrc.replace(/assets\/js\/video-player\.js.*$/, '');

  var THUMB_MAP = {
    'index-hero':        _siteRoot + 'assets/images/thumbnail/hero-section-showreel.jpg',
    'index-screenplay':  _siteRoot + 'assets/images/thumbnail/screenplay-storyboard.jpg',
    'index-consistency': _siteRoot + 'assets/images/thumbnail/Consistency.jpg',
    'index-promo':       _siteRoot + 'assets/images/thumbnail/festive-product-promo.jpg',
    'solutions-ld':      _siteRoot + 'assets/images/thumbnail/by-team.jpg',
    'solutions-promo':   _siteRoot + 'assets/images/thumbnail/by-content.jpg',
    'solutions-personal':_siteRoot + 'assets/images/thumbnail/by-industry.jpg',
    'lp-intro':          _siteRoot + 'assets/images/thumbnail/Introduction-to-Flipick.jpg',
    'lp-posh':           _siteRoot + 'assets/images/thumbnail/Preventing-Harassment-POSH-Training.jpg'
  };

  /* --- Helpers --------------------------------------------------- */

  function ytId(url) {
    var m = url.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function ytEmbed(url) {
    var id = ytId(url);
    return id ? 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0' : null;
  }

  function ytThumb(url) {
    var id = ytId(url);
    return id ? 'https://img.youtube.com/vi/' + id + '/maxresdefault.jpg' : null;
  }

  /* --- Stamp thumbnails + share links from VIDEO_MAP ------------- */
  var allVids = document.querySelectorAll('.vid[data-vid]');
  for (var i = 0; i < allVids.length; i++) {
    var vEl  = allVids[i];
    var vUrl = VIDEO_MAP[vEl.getAttribute('data-vid')];
    if (!vUrl) continue;
    var thumb = vEl.querySelector('.vid-thumb');
    var play  = vEl.querySelector('.play');
    var localThumb = THUMB_MAP[vEl.getAttribute('data-vid')];
    if (localThumb) {
      if (thumb) thumb.src = localThumb;
    } else if (ytId(vUrl)) {
      if (thumb) thumb.src = ytThumb(vUrl);
    } else {
      /* Direct video URL — replace broken <img> with a muted <video>
         so the first frame acts as the thumbnail */
      if (thumb) {
        var previewVid = document.createElement('video');
        previewVid.className = thumb.className;
        previewVid.src = vUrl;
        previewVid.muted = true;
        previewVid.preload = 'metadata';
        previewVid.setAttribute('playsinline', '');
        thumb.parentNode.replaceChild(previewVid, thumb);
      }
    }
    if (play) play.href = vUrl;
  }

  /* --- Click to play --------------------------------------------- */
  document.addEventListener('click', function (e) {
    var vid = e.target.closest('.vid');
    if (!vid || vid.classList.contains('playing')) return;
    var anchor = e.target.closest('a');
    if (anchor) e.preventDefault();
    var url = VIDEO_MAP[vid.getAttribute('data-vid')] || '';
    vid.classList.add('playing');
    if (ytId(url)) {
      /* YouTube — embed iframe with autoplay */
      var iframe = document.createElement('iframe');
      iframe.src = ytEmbed(url);
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.setAttribute('allowfullscreen', '');
      vid.innerHTML = '';
      vid.appendChild(iframe);
    } else {
      /* Direct video URL — swap in a native <video> with autoplay */
      var nativeVid = document.createElement('video');
      nativeVid.src = url;
      nativeVid.controls = true;
      nativeVid.autoplay = true;
      nativeVid.setAttribute('playsinline', '');
      vid.innerHTML = '';
      vid.appendChild(nativeVid);
    }
  });
})();
