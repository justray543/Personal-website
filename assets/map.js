/* ===================================================================
   Interactive world map — the EU–APAC corridor, lived.
   Dotted landmass generated at runtime from schematic continent
   outlines (no external geodata, works offline / file://).
   =================================================================== */
(function () {
  'use strict';

  var svg = document.getElementById('worldmap');
  if (!svg) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 1000, H = 693;
  var LON0 = -4, LON1 = 162, LAT0 = 68, LAT1 = -47;
  var px = function (lon) { return (lon - LON0) / (LON1 - LON0) * W; };
  var py = function (lat) { return (LAT0 - lat) / (LAT0 - LAT1) * H; };

  /* Schematic continent outlines [lon, lat]. Coarse by design —
     rendered as a dot matrix, so silhouette is what matters. */
  var LAND = [
    /* Africa */
    [[-17,15],[-16,12],[-13,8],[-8,4],[0,5],[5,4],[9,4],[9,-1],[12,-6],[13,-11],[12,-17],[15,-22],[17,-28],[18,-34],[25,-34],[32,-29],[35,-24],[40,-16],[40,-11],[39,-7],[41,-2],[44,2],[51,12],[44,12],[43,11],[40,15],[39,18],[37,22],[35,24],[34,28],[32,31],[25,32],[20,31],[11,34],[3,37],[-2,36],[-6,36],[-9,32],[-10,27],[-13,23],[-17,21]],
    /* Madagascar */
    [[43,-25],[47,-25],[50,-15],[48,-12],[44,-16]],
    /* Europe */
    [[-10,44],[-9,37],[-6,36],[0,39],[4,42],[8,44],[10,44],[13,45],[16,42],[18,40],[20,40],[23,37],[26,39],[29,41],[30,45],[34,45],[38,47],[40,48],[48,52],[58,58],[60,65],[55,68],[40,68],[32,70],[28,71],[25,71],[20,70],[16,68],[12,65],[8,63],[5,61],[7,58],[11,58],[13,55],[10,54],[7,53],[4,52],[0,49],[-2,48],[-4,48],[-1,46],[-2,44]],
    /* Great Britain, Ireland */
    [[-5,50],[-3,50],[1,51],[2,53],[-1,56],[-3,58],[-5,58],[-6,55],[-5,53]],
    [[-10,52],[-6,52],[-6,55],[-10,55]],
    /* Asia */
    [[30,70],[60,70],[75,73],[95,76],[110,76],[130,72],[145,72],[160,68],[170,66],[180,65],[170,60],[162,58],[155,55],[145,50],[142,45],[135,43],[130,42],[128,38],[126,35],[122,31],[121,25],[117,23],[112,21],[108,16],[109,11],[105,9],[100,8],[100,3],[104,1],[98,8],[95,16],[92,21],[88,21],[80,13],[77,8],[73,18],[68,24],[66,25],[61,25],[57,25],[56,26],[57,22],[55,17],[52,16],[48,14],[43,12],[39,17],[35,23],[34,28],[35,31],[36,36],[36,37],[30,37],[26,40],[28,41],[35,42],[40,43],[48,42],[50,45],[52,47],[48,50],[45,52],[42,50],[40,55],[35,60],[32,65]],
    /* Japan */
    [[130,32],[133,33],[136,35],[140,36],[141,40],[145,43],[143,45],[140,41],[137,37],[132,34]],
    /* Taiwan */
    [[120,22],[122,22],[122,25],[120,25]],
    /* Maritime Southeast Asia */
    [[95,5],[105,-6],[115,-8],[122,-9],[131,-8],[141,-9],[141,-3],[132,-1],[120,0],[110,2],[100,5]],
    /* Philippines */
    [[120,6],[126,7],[126,18],[121,19],[120,12]],
    /* North America */
    [[-168,66],[-160,70],[-150,70],[-140,70],[-125,70],[-110,68],[-95,68],[-85,70],[-80,73],[-70,73],[-64,60],[-60,55],[-55,52],[-60,47],[-66,45],[-70,42],[-74,40],[-76,36],[-80,32],[-80,26],[-82,25],[-84,30],[-90,29],[-94,29],[-97,26],[-97,20],[-91,19],[-87,21],[-88,16],[-84,10],[-79,9],[-77,8],[-84,11],[-92,16],[-96,16],[-105,20],[-110,24],[-113,31],[-117,32],[-122,37],[-124,42],[-124,48],[-130,54],[-135,58],[-145,60],[-155,58],[-163,59]],
    /* Greenland */
    [[-45,60],[-30,68],[-22,70],[-20,76],[-30,82],[-45,83],[-58,82],[-70,78],[-55,68],[-50,62]],
    /* South America */
    [[-81,0],[-79,-5],[-75,-14],[-71,-18],[-71,-30],[-73,-40],[-75,-48],[-70,-54],[-66,-55],[-65,-48],[-62,-40],[-57,-38],[-56,-34],[-48,-25],[-40,-22],[-39,-15],[-35,-8],[-44,-2],[-50,0],[-52,5],[-60,8],[-66,11],[-72,12],[-77,8],[-79,2]],
    /* Australia */
    [[113,-22],[114,-26],[115,-34],[120,-34],[129,-32],[135,-35],[138,-35],[141,-38],[147,-38],[150,-37],[153,-28],[153,-25],[146,-19],[142,-11],[137,-12],[136,-15],[130,-12],[125,-14],[122,-17],[114,-22]],
    /* New Zealand */
    [[166,-46],[171,-44],[174,-41],[178,-38],[174,-36],[172,-40],[168,-44]]
  ];

  function inPoly(lon, lat, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function isLand(lon, lat) {
    for (var i = 0; i < LAND.length; i++) if (inPoly(lon, lat, LAND[i])) return true;
    return false;
  }

  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ── dotted landmass ─────────────────────────────────── */
  var frag = document.createDocumentFragment();
  var STEP = 1.7;
  for (var lat = LAT0; lat >= LAT1; lat -= STEP) {
    for (var lon = LON0; lon <= LON1; lon += STEP) {
      if (!isLand(lon, lat)) continue;
      frag.appendChild(el('circle', { cx: px(lon).toFixed(1), cy: py(lat).toFixed(1), r: 2.1, class: 'dot-land' }));
    }
  }
  document.getElementById('dots').appendChild(frag);

  /* ── the journey ─────────────────────────────────────── */
  var PLACES = [
    { id:'tainan',    city:'Tainan',     country:'Taiwan',    lon:120.20, lat:23.00,  yr:'2021–24', lside:'left', ldy:22, note:'BBA, National Cheng Kung University.' },
    { id:'zagreb',    city:'Zagreb',     country:'Croatia',   lon:16.00,  lat:45.80,  yr:'2022',     note:'Exchange semester, University of Zagreb.' },
    { id:'taipei',    city:'Taipei',     country:'Taiwan',    lon:121.50, lat:25.00,  yr:'2023–24',  note:'Fidelity International — Strategic Planning Intern.' },
    { id:'singapore', city:'Singapore',  country:'Singapore', lon:103.80, lat:1.35,   yr:'2024',     note:'NCKU–SMU joint semester programme at Singapore Management University. Three months, reciprocal campus exchange.' },
    { id:'melbourne', city:'Melbourne',  country:'Australia', lon:144.96, lat:-37.81, yr:'2025',     note:'Moomoo Australia — 100+ clients across 15+ nationalities.' },
    { id:'chiangmai', city:'Chiang Mai', country:'Thailand',  lon:98.98,  lat:18.79,  yr:'2025', lside:'left', ldy:8, note:'Waiwin — 400 to 5,000 registered users in three months.' },
    { id:'berlin',    city:'Berlin',     country:'Germany',   lon:13.40,  lat:52.52,  yr:'2025–now', note:'Finoa, Ultima Markets, ESMT Berlin.', now:true },
    { id:'helsinki',  city:'Helsinki',   country:'Finland',   lon:24.94,  lat:60.17,  yr:'2027',     note:'Aalto University School of Business — exchange semester.', future:true }
  ];

  var arcsG = document.getElementById('arcs');
  var nodesG = document.getElementById('nodes');
  var arcs = [];

  for (var i = 0; i < PLACES.length - 1; i++) {
    var a = PLACES[i], b = PLACES[i + 1];
    var x1 = px(a.lon), y1 = py(a.lat), x2 = px(b.lon), y2 = py(b.lat);
    var dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    var cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 - dist * 0.22;
    var d = 'M' + x1.toFixed(1) + ',' + y1.toFixed(1) +
            ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) +
            ' ' + x2.toFixed(1) + ',' + y2.toFixed(1);

    var base = el('path', { d: d, class: 'arc' });
    var flow = el('path', { d: d, class: 'arc-flow' });
    flow.style.animationDelay = (i * -0.32) + 's';
    arcsG.appendChild(base);
    arcsG.appendChild(flow);
    arcs.push({ base: base, flow: flow, from: a.id, to: b.id });
  }

  /* draw-in on first paint, then hand over to the dash flow */
  if (!reduce) {
    arcs.forEach(function (a, idx) {
      var len = a.base.getTotalLength();
      [a.base, a.flow].forEach(function (p) {
        p.style.opacity = '0';
        p.style.transition = 'opacity .8s ease';
      });
      var draw = a.base;
      draw.style.strokeDasharray = len;
      draw.style.strokeDashoffset = len;
      draw.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1), opacity .8s ease';
      setTimeout(function () {
        draw.style.opacity = '';
        draw.style.strokeDashoffset = '0';
      }, 220 + idx * 190);
      setTimeout(function () { a.flow.style.opacity = ''; }, 220 + idx * 190 + 700);
    });
  }

  var nodeEls = {};
  PLACES.forEach(function (p) {
    var x = px(p.lon), y = py(p.lat);
    var g = el('g', { class: 'node' + (p.now ? ' now' : ''), tabindex: '0', role: 'button' });
    g.setAttribute('aria-label', p.city + ', ' + p.country + ', ' + p.yr);
    g.appendChild(el('circle', { cx: x, cy: y, r: 30, class: 'halo' }));
    if (p.now) g.appendChild(el('circle', { cx: x, cy: y, r: 13, class: 'ring' }));
    g.appendChild(el('circle', { cx: x, cy: y, r: p.now ? 15 : 11, class: 'core' }));
    var right = p.lside === 'left' ? false : x < W - 150;
    var lbl = el('text', { x: right ? x + 23 : x - 23, y: y + 6 + (p.ldy || 0), class: 'node-label', 'text-anchor': right ? 'start' : 'end' });
    lbl.textContent = p.city;
    g.appendChild(lbl);
    g.appendChild(el('circle', { cx: x, cy: y, r: 34, class: 'hit' }));
    nodesG.appendChild(g);
    nodeEls[p.id] = g;
  });

  /* ── side list ───────────────────────────────────────── */
  var list = document.getElementById('placelist');
  var placeEls = {};
  PLACES.forEach(function (p) {
    var b = document.createElement('button');
    b.className = 'place' + (p.now ? ' on' : '');
    b.type = 'button';
    b.innerHTML = '<span class="yr">' + p.yr + '</span>' +
                  '<span class="city">' + p.city + '<small>' + p.country + '</small></span>';
    list.appendChild(b);
    placeEls[p.id] = b;
    ['mouseenter', 'focus', 'click'].forEach(function (ev) {
      b.addEventListener(ev, function () { select(p.id); });
    });
  });

  var readout = document.getElementById('readout');
  var current = 'berlin';

  function select(id) {
    if (id === current) return;
    current = id;
    var p = null;
    for (var k = 0; k < PLACES.length; k++) if (PLACES[k].id === id) p = PLACES[k];
    if (!p) return;

    Object.keys(nodeEls).forEach(function (k) { nodeEls[k].classList.toggle('on', k === id); });
    Object.keys(placeEls).forEach(function (k) { placeEls[k].classList.toggle('on', k === id); });
    arcs.forEach(function (a) {
      var hot = a.from === id || a.to === id;
      a.base.classList.toggle('hot', hot);
      a.base.classList.toggle('dim', !hot);
      a.flow.classList.toggle('dim', !hot);
    });
    readout.innerHTML =
      '<p class="ro-city">' + p.city + ', ' + p.country + '</p>' +
      '<span class="meta">' + p.yr + (p.future ? ' · Upcoming' : '') + '</span>' +
      '<p class="ro-body">' + p.note + '</p>';
  }

  PLACES.forEach(function (p) {
    ['mouseenter', 'focus', 'click'].forEach(function (ev) {
      nodeEls[p.id].addEventListener(ev, function () { select(p.id); });
    });
  });

  document.querySelector('.map-box').addEventListener('mouseleave', function () {
    arcs.forEach(function (a) {
      a.base.classList.remove('hot');
      a.base.classList.remove('dim');
      a.flow.classList.remove('dim');
    });
  });

  /* ── travelling packet along the whole corridor ──────── */
  if (!reduce && arcs.length) {
    var flyer = el('circle', { r: 4.5, class: 'flyer' });
    arcsG.appendChild(flyer);
    var seg = 0, t = 0, live = true;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { live = es[0].isIntersecting; }).observe(svg);
    }

    (function fly() {
      requestAnimationFrame(fly);
      if (!live) return;
      t += 0.0058;
      if (t >= 1) { t = 0; seg = (seg + 1) % arcs.length; }
      var path = arcs[seg].base;
      var pt = path.getPointAtLength(t * path.getTotalLength());
      flyer.setAttribute('cx', pt.x);
      flyer.setAttribute('cy', pt.y);
      flyer.setAttribute('opacity', (Math.sin(t * Math.PI) * 0.95).toFixed(3));
    })();
  }
})();
