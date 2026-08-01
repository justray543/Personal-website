/* ===================================================================
   Ray Jinglong Chen — shared behaviour
   Theme, nav, mobile menu, scroll progress, reveal, scramble,
   counters, panel spotlight, flow-field canvas, page transitions.
   =================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── theme ───────────────────────────────────────────── */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  /* Dark is the site's default. A returning visitor's own choice still wins. */
  root.setAttribute('data-theme', saved || 'dark');

  var themeBtn = $('#themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var cur = root.getAttribute('data-theme') || (sysDark ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      window.dispatchEvent(new CustomEvent('themechange'));
    });
  }

  var yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── page transitions ────────────────────────────────── */
  function boot() {
    document.body.classList.remove('booting');
    document.body.classList.add('ready');
  }
  document.body.classList.add('booting');
  requestAnimationFrame(function () { requestAnimationFrame(boot); });
  /* rAF is paused in background/hidden tabs, so never let the page stay
     invisible waiting for a frame that isn't coming. */
  setTimeout(boot, 400);
  window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });

  function show() { document.body.classList.remove('leaving'); }
  window.addEventListener('hashchange', show);
  window.addEventListener('focus', show);

  if (!reduce) {
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest ? ev.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank') return;
      if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button) return;

      /* Same-document links (only the hash differs) never fire a page load,
         so a fade-out here would never be undone and the page would stay
         invisible. Let the browser handle those natively. */
      var dest;
      try { dest = new URL(href, window.location.href); } catch (e) { return; }
      /* origin is "null" for file: in some engines — protocol+host is reliable */
      if (dest.protocol !== window.location.protocol || dest.host !== window.location.host) return;
      if (dest.pathname === window.location.pathname && dest.search === window.location.search) return;

      ev.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(function () { window.location.href = href; }, 260);
      /* If navigation is blocked or cancelled, don't strand a blank page. */
      setTimeout(show, 2000);
    });
  }

  /* ── nav: hairline + progress ────────────────────────── */
  var nav = $('#nav'), bar = $('#progress'), ticking = false;
  function frame() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('stuck', y > 8);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
    }
    if (pending && pending.length) sweepPassed();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  frame();

  /* ── mobile menu ─────────────────────────────────────── */
  var burger = $('#burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('#menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── active nav link (in-page sections) ──────────────── */
  var navLinks = $$('.nav-links a');
  var sections = $$('section[id]');
  if (sections.length && 'IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = '#' + e.target.id;
        navLinks.forEach(function (a) {
          var href = a.getAttribute('href') || '';
          if (href.charAt(0) === '#') a.classList.toggle('active', href === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { secIO.observe(s); });
  }

  /* ── reveal on scroll ────────────────────────────────── */
  var items = $$('.rv');
  var pending = items.slice();

  function reveal(el, delay) {
    setTimeout(function () { el.classList.add('in'); }, delay || 0);
    var k = pending.indexOf(el);
    if (k > -1) pending.splice(k, 1);
  }

  /* Anything already scrolled past must appear immediately, with no
     animation — otherwise a hash jump (index.html#contact) or a restored
     scroll position leaves whole sections invisible forever. */
  function sweepPassed() {
    for (var i = pending.length - 1; i >= 0; i--) {
      if (pending[i].getBoundingClientRect().bottom < 0) reveal(pending[i], 0);
    }
  }

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    pending.length = 0;
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e, i) {
        var passed = e.boundingClientRect.bottom < 0;
        if (!e.isIntersecting && !passed) return;
        reveal(e.target, passed ? 0 : i * 70);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
    window.addEventListener('load', sweepPassed);
  }

  /* ── text scramble (mono labels only — keeps prose readable) ── */
  var GLYPHS = '#$%&*+-/<>=_|▚▞▘▗01';
  function scramble(el) {
    var target = el.dataset.text || el.textContent;
    if (reduce) { el.textContent = target; return; }
    var dur = 600, t0 = performance.now();
    (function step(t) {
      var p = Math.min((t - t0) / dur, 1);
      var settled = Math.floor(target.length * p);
      var out = '';
      for (var i = 0; i < target.length; i++) {
        if (i < settled || target[i] === ' ') out += target[i];
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    })(t0);
  }
  var scrambles = $$('[data-scramble]');
  if (scrambles.length && 'IntersectionObserver' in window) {
    var sIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        sIO.unobserve(e.target);
        e.target.dataset.text = e.target.textContent;
        scramble(e.target);
      });
    }, { threshold: 0.6 });
    scrambles.forEach(function (el) { sIO.observe(el); });
  }

  /* ── counters ────────────────────────────────────────── */
  var statBlocks = $$('[data-count]');
  if (statBlocks.length && 'IntersectionObserver' in window) {
    var cIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cIO.unobserve(e.target);
        $$('.n', e.target).forEach(function (n) {
          var to = +n.dataset.to;
          var suffix = n.dataset.suffix ? '<span class="plus">' + n.dataset.suffix + '</span>' : '';
          if (reduce) { n.innerHTML = to + suffix; return; }
          var dur = 1100, t0 = performance.now();
          (function step(t) {
            var p = Math.min((t - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            n.innerHTML = Math.round(to * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
          })(t0);
        });
      });
    }, { threshold: 0.4 });
    statBlocks.forEach(function (b) { cIO.observe(b); });
  }

  /* ── panel spotlight ─────────────────────────────────── */
  if (!reduce) {
    $$('.panel, .job, .lrow, .cert, .next').forEach(function (p) {
      p.addEventListener('pointermove', function (e) {
        var r = p.getBoundingClientRect();
        p.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        p.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }


  /* ── copy-to-clipboard ───────────────────────────────── */
  var copyBtn = $('#copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.dataset.copy || '';
      function done() {
        var old = copyBtn.textContent;
        copyBtn.textContent = 'Copied';
        copyBtn.classList.add('done');
        setTimeout(function () { copyBtn.textContent = old; copyBtn.classList.remove('done'); }, 1600);
      }
      /* navigator.clipboard needs a secure context — absent on file:// */
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:absolute;left:-9999px;top:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {
          copyBtn.textContent = 'Select manually';
        }
        document.body.removeChild(ta);
      }
    });
  }


  /* ── company logos ───────────────────────────────────── */
  $$('.logo img').forEach(function (img) {
    var host = img.parentNode;
    img.addEventListener('error', function () {
      host.classList.remove('has-img');
      host.textContent = host.dataset.mark || '';
    });
    img.addEventListener('load', function () { host.classList.add('has-img'); });
    if (img.complete && img.naturalWidth > 0) host.classList.add('has-img');
  });


  /* ── page-wide cursor glow ───────────────────────────── */
  var glow = $('#glow');
  if (glow && !reduce && window.matchMedia('(hover: hover)').matches) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2;
    var tx = gx, ty = gy, running = false, lit = false;

    function glowStep() {
      gx += (tx - gx) * 0.14;
      gy += (ty - gy) * 0.14;
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
      if (Math.abs(tx - gx) > 0.4 || Math.abs(ty - gy) > 0.4) requestAnimationFrame(glowStep);
      else running = false;
    }
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!lit) { lit = true; document.body.classList.add('glow-on'); }
      if (!running) { running = true; requestAnimationFrame(glowStep); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      document.body.classList.remove('glow-on'); lit = false;
    });
  }


  /* ── decrypt-on-touch headings ───────────────────────── */
  /* Walks text nodes rather than replacing innerHTML, so nested markup
     (<em>, <span class="role-t">) keeps its styling while the characters
     resolve left to right. */
  var CIPHER = 'ABCDEF0123456789#%&*+-/<>=_|?!$';

  function decrypt(el, dur) {
    if (el.__decrypting) return;
    var nodes = [];
    (function walk(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { if (c.nodeValue.trim()) nodes.push({ n: c, t: c.nodeValue }); }
        else if (c.nodeType === 1) walk(c);
      }
    })(el);
    if (!nodes.length) return;

    el.__decrypting = true;
    var total = 0, i;
    for (i = 0; i < nodes.length; i++) total += nodes[i].t.length;
    var t0 = performance.now();

    (function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var settled = Math.floor(total * p);
      var idx = 0;
      for (var a = 0; a < nodes.length; a++) {
        var src = nodes[a].t, out = '';
        for (var k = 0; k < src.length; k++, idx++) {
          var ch = src[k];
          out += (idx < settled || ch === ' ' || ch === '\n' || ch === '\t')
               ? ch
               : CIPHER[(Math.random() * CIPHER.length) | 0];
        }
        nodes[a].n.nodeValue = out;
      }
      if (p < 1) requestAnimationFrame(step);
      else {
        for (var b = 0; b < nodes.length; b++) nodes[b].n.nodeValue = nodes[b].t;
        el.__decrypting = false;
      }
    })(t0);
  }

  if (!reduce) {
    $$('h2, h3, .map-title, .contact-lead').forEach(function (el) {
      el.classList.add('decryptable');
      el.addEventListener('pointerenter', function () { decrypt(el, 700); });
      el.addEventListener('click',        function () { decrypt(el, 700); });
    });
  }

  /* ── light bands ────────────────────────────────────── */
  /* Few, very wide, heavily blurred horizontal bands that taper symmetrically
     at both ends, each with a thin hot core. The softness comes from a real
     canvas blur filter on the halo pass — thin hairlines read as hair, wide
     blurred bands read as light. */
  var cv = $('.flowfield');
  if (cv && !reduce) {
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);  /* blur is fill-rate bound */
    var W = 0, H = 0, bands = [], visible = true;
    var mouse = { x: -9999, y: -9999 };
    var HUES = [158, 166, 172, 180, 190];     /* tight band around brand teal */

    function isDark() {
      var t = root.getAttribute('data-theme');
      return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function seed(p, offscreen) {
      p.hue  = HUES[(Math.random() * HUES.length) | 0];
      p.len  = W * (0.45 + Math.random() * 0.85);
      p.sp   = 3.0 + Math.random() * 7.5;           /* fast — light-speed streak */
      p.w    = 11 + Math.random() * 34;            /* wide soft band */
      p.a    = 0.22 + Math.random() * 0.42;
      p.core = Math.random() < 0.55;               /* only some get a hot core */
      p.push = 0;
      /* keep them in the lower band, beneath the text block */
      p.y    = H * (0.70 + Math.random() * 0.26);
      p.x    = offscreen ? -p.len - Math.random() * 200 : Math.random() * (W + p.len) - p.len;
    }

    function resize() {
      var r = cv.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(13, Math.max(6, Math.round(W / 165)));
      bands = [];
      for (var i = 0; i < n; i++) { var p = {}; seed(p); bands.push(p); }
    }
    resize();
    window.addEventListener('resize', resize);

    cv.parentElement.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    cv.parentElement.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; })
        .observe(cv.parentElement);
    }

    function paint(dark, blurred) {
      for (var i = 0; i < bands.length; i++) {
        var p = bands[i];
        var y = p.y + p.push;
        var x0 = p.x, x1 = p.x + p.len;

        var flare = 0;
        if (mouse.x > x0 - 100 && mouse.x < x1 + 100) {
          var vd = p.y - mouse.y, dist = Math.abs(vd), R = 170;
          if (dist < R) flare = (R - dist) / R * 0.4;
        }
        var a = Math.min((p.a + flare) * (dark ? 1 : 0.55), 1);

        var g = ctx.createLinearGradient(x0, y, x1, y);
        var L = dark ? 58 : 46, S = dark ? 90 : 85;
        var col = 'hsla(' + p.hue + ',' + S + '%,' + L + '%,';
        g.addColorStop(0.00, col + '0)');
        g.addColorStop(0.28, col + (a * 0.35).toFixed(3) + ')');
        g.addColorStop(0.55, col + a.toFixed(3) + ')');   /* peak, slightly past centre */
        g.addColorStop(0.80, col + (a * 0.30).toFixed(3) + ')');
        g.addColorStop(1.00, col + '0)');

        ctx.strokeStyle = g;
        ctx.lineWidth = blurred ? p.w : Math.max(p.w * 0.05, 1);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();

        if (!blurred && p.core && dark) {           /* white-hot centre */
          var hg = ctx.createLinearGradient(x0, y, x1, y);
          hg.addColorStop(0.00, 'hsla(' + p.hue + ',40%,96%,0)');
          hg.addColorStop(0.55, 'hsla(' + p.hue + ',40%,96%,' + Math.min(a * 0.85, 0.95).toFixed(3) + ')');
          hg.addColorStop(1.00, 'hsla(' + p.hue + ',40%,96%,0)');
          ctx.strokeStyle = hg;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x0 + p.len * 0.22, y);
          ctx.lineTo(x1 - p.len * 0.12, y);
          ctx.stroke();
        }
      }
    }

    (function loop() {
      requestAnimationFrame(loop);
      if (!visible || !W) return;
      var dark = isDark();

      for (var i = 0; i < bands.length; i++) {
        var p = bands[i];
        p.x += p.sp;

        /* cursor pushes bands aside */
        var target = 0;
        if (mouse.x > p.x - 100 && mouse.x < p.x + p.len + 100) {
          var vd = p.y - mouse.y, dist = Math.abs(vd), R = 170;
          if (dist < R) target = (vd >= 0 ? 1 : -1) * ((R - dist) / R) * 75;
        }
        p.push += (target - p.push) * 0.08;

        if (p.x > W + 60) seed(p, true);
      }

      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = dark ? 'lighter' : 'multiply';

      ctx.filter = 'blur(' + (dark ? 16 : 13) + 'px)';   /* the soft halo */
      paint(dark, true);
      ctx.filter = 'none';                                /* the sharp core */
      paint(dark, false);

      ctx.globalCompositeOperation = 'source-over';
    })();
  }
})();
