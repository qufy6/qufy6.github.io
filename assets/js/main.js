/* Feiyu Qu · homepage interactions. Plain JS, no dependencies.
   Every feature checks for its elements, so the 404 page can load this file too. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reduceTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches; // phones/tablets: cheaper effects
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function rafThrottle(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }

  /* ------------------------------------------------------------------ theme */
  var themeListeners = [];
  function currentTheme() { return root.dataset.theme || (darkQuery.matches ? "dark" : "light"); }
  function themeChanged() { themeListeners.forEach(function (fn) { fn(); }); }
  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    themeChanged();
    toast(next + " mode");
  }
  darkQuery.addEventListener("change", function () { if (!root.dataset.theme) themeChanged(); });
  $$(".theme-toggle").forEach(function (b) { b.addEventListener("click", toggleTheme); });

  /* ------------------------------------------------------------------ toast + clipboard */
  var toastEl = $(".toast");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1700);
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }
  function copy(text, label) {
    var done = function () { toast("copied " + label + " ✓"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { if (fallbackCopy(text)) done(); });
    } else if (fallbackCopy(text)) {
      done();
    }
  }

  /* ------------------------------------------------------------------ email (stored reversed, "#" for "@") */
  var email = "";
  $$("[data-email]").forEach(function (el) {
    email = el.dataset.email.split("").reverse().join("").replace("#", "@");
    el.href = "mailto:" + email;
    el.title = email;
    if (el.hasAttribute("data-email-text")) el.textContent = email;
  });
  $$("[data-copy-email]").forEach(function (b) {
    b.addEventListener("click", function () { copy(email, "email"); });
  });

  /* ------------------------------------------------------------------ publication count */
  var pubCount = $$(".pub").length;
  if (pubCount) $$("[data-pub-count]").forEach(function (el) { el.textContent = pubCount; });

  /* ------------------------------------------------------------------ BibTeX: highlight, toggle, copy */
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function highlightBib(src) {
    return src.split("\n").map(function (line) {
      var m = line.match(/^(@\w+)\{([^,]+),\s*$/);
      if (m) return '<span class="bib-type">' + esc(m[1]) + '</span>{<span class="bib-key">' + esc(m[2]) + "</span>,";
      m = line.match(/^(\s*)(\w+)(\s*=\s*)\{(.*)\}(,?)\s*$/);
      if (m) {
        return esc(m[1]) + '<span class="bib-field">' + esc(m[2]) + "</span>" + esc(m[3]) +
          '{<span class="bib-val">' + esc(m[4]) + "</span>}" + m[5];
      }
      return esc(line);
    }).join("\n");
  }
  $$(".bibtex code").forEach(function (code) { code.innerHTML = highlightBib(code.textContent); });
  $$(".bib-toggle").forEach(function (btn) {
    var box = document.getElementById(btn.getAttribute("aria-controls"));
    if (!box) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      box.hidden = open;
    });
  });
  $$(".bibtex .copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () { copy(btn.parentElement.querySelector("code").textContent, "bibtex"); });
  });

  /* ------------------------------------------------------------------ name scramble */
  var nameEl = $("[data-scramble]");
  if (nameEl && !reduceMotion) {
    (function () {
      var target = nameEl.textContent;
      var glyphs = "!<>-_\\/[]{}=+*^?#01";
      var settle = target.split("").map(function (c, i) { return 4 + i * 2 + Math.floor(Math.random() * 10); });
      var last = Math.max.apply(null, settle);
      var frame = 0;
      (function tick() {
        var out = "";
        for (var i = 0; i < target.length; i++) {
          out += (target[i] === " " || frame >= settle[i]) ? target[i] : glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        nameEl.textContent = out;
        if (frame++ < last) setTimeout(tick, 42);
      })();
    })();
  }

  /* ------------------------------------------------------------------ terminal typing */
  var term = $(".term-body");
  if (term && !reduceMotion && $(".cursor", term)) {
    (function () {
      var lines = $$(".ln", term);
      var cursor = $(".cursor", term);
      lines.forEach(function (ln) { ln.hidden = true; });
      var i = 0;
      function next() {
        if (i >= lines.length) return;
        var ln = lines[i++];
        ln.hidden = false;
        var typed = $(".typed", ln);
        if (!typed) { setTimeout(next, 110); return; }
        var text = typed.textContent;
        typed.textContent = "";
        typed.after(cursor);
        var k = 0;
        (function type() {
          if (k < text.length) {
            typed.textContent = text.slice(0, ++k);
            setTimeout(type, 34 + Math.random() * 60);
          } else {
            setTimeout(next, text ? 380 : 0);
          }
        })();
      }
      setTimeout(next, 650);
    })();
  }

  /* ------------------------------------------------------------------ reveal on scroll */
  var reveals = $$(".reveal");
  $$(".pubs > .reveal").forEach(function (el, i) { el.style.setProperty("--d", i * 70 + "ms"); });
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
        // Drop the stagger once revealed so hover transitions stay snappy.
        setTimeout(function () { e.target.style.removeProperty("--d"); }, 1200);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ------------------------------------------------------------------ cursor-following light on glass */
  $$(".spot").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
    el.addEventListener("pointerleave", function () {
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
    });
  });

  /* ------------------------------------------------------------------ dock scroll-spy with a sliding liquid indicator */
  var spyLinks = $$(".dock-links a[data-spy]");
  var indicator = $(".dock-indicator");
  var spySections = spyLinks.map(function (a) { return document.getElementById(a.dataset.spy); }).filter(Boolean);
  var activeId = null;
  function moveIndicator() {
    var a = activeId && $('.dock-links a[data-spy="' + activeId + '"]');
    if (!indicator) return;
    if (!a) { indicator.style.opacity = "0"; return; }
    indicator.style.width = a.offsetWidth + "px";
    indicator.style.transform = "translateX(" + a.offsetLeft + "px)";
    indicator.style.opacity = "1";
  }
  function spy() {
    var line = window.innerHeight * 0.42;
    var id = null;
    spySections.forEach(function (s) { if (s.getBoundingClientRect().top < line) id = s.id; });
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom && spySections.length) id = spySections[spySections.length - 1].id;
    if (id === activeId) return;
    activeId = id;
    spyLinks.forEach(function (a) {
      var on = a.dataset.spy === id;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    moveIndicator();
  }
  if (spyLinks.length) {
    window.addEventListener("scroll", rafThrottle(spy), { passive: true });
    window.addEventListener("resize", rafThrottle(moveIndicator));
    spy();
  }

  /* ------------------------------------------------------------------ smooth jumps */
  function go(hash) {
    var target = hash === "#top" ? document.body : $(hash);
    if (!target) return;
    if (hash === "#top") window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    history.replaceState(null, "", hash === "#top" ? location.pathname : hash);
  }

  /* ------------------------------------------------------------------ background: agent network
     Drifting nodes ("agents") linked to nearby peers. Pulses hop node to node toward a random
     target using only local information: each hop picks the neighbor closest to the target. */
  var net = (function () {
    var cv = $("#net");
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, nodes = [], pulses = [], links = [];
    var LINK = 150, LINK2 = LINK * LINK;
    var pointer = { x: -1e4, y: -1e4 };
    var rgb1 = "150,236,205", rgb2 = "170,158,255";
    var running = !reduceMotion, rafId = 0, lastSpawn = 0;

    function readColors() {
      var cs = getComputedStyle(root);
      rgb1 = cs.getPropertyValue("--net-rgb").trim() || rgb1;
      rgb2 = cs.getPropertyValue("--net-rgb-2").trim() || rgb2;
    }
    function makeNode() {
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.24, vy: (Math.random() - 0.5) * 0.24,
        r: Math.random() * 1.3 + 0.8, hub: Math.random() < 0.14
      };
    }
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = Math.round(Math.min(92, Math.max(26, (W * H) / 16000)));
      while (nodes.length < want) nodes.push(makeNode());
      if (nodes.length > want) nodes.length = want;
      pulses = [];
      if (!running) draw();
    }
    function computeLinks() {
      links = [];
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, d2 = dx * dx + dy * dy;
          if (d2 < LINK2) links.push([i, j, d2]);
        }
      }
    }
    function neighbors(i) {
      var out = [];
      for (var k = 0; k < links.length; k++) {
        if (links[k][0] === i) out.push(links[k][1]);
        else if (links[k][1] === i) out.push(links[k][0]);
      }
      return out;
    }
    function dist2(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
    function spawn() {
      var s = Math.floor(Math.random() * nodes.length), t = Math.floor(Math.random() * nodes.length);
      if (s !== t && dist2(nodes[s], nodes[t]) > LINK2 * 4) pulses.push({ from: s, to: s, target: t, p: 1, life: 1 });
    }
    function step(now) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var dx = pointer.x - n.x, dy = pointer.y - n.y, d2 = dx * dx + dy * dy;
        if (d2 < 32000) { n.vx += dx * 0.000012; n.vy += dy * 0.000012; }
        n.vx = Math.max(-0.45, Math.min(0.45, n.vx));
        n.vy = Math.max(-0.45, Math.min(0.45, n.vy));
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      }
      computeLinks();
      if (now - lastSpawn > 650 && pulses.length < 7) { spawn(); lastSpawn = now; }
      for (var p = pulses.length - 1; p >= 0; p--) {
        var u = pulses[p];
        u.p += 0.028;
        if (u.p >= 1) {
          if (u.to === u.target) { u.life -= 0.06; if (u.life <= 0) pulses.splice(p, 1); continue; }
          // Next hop: the neighbor that gets closest to the target (greedy, local info only).
          var here = u.to, best = -1, bestD = dist2(nodes[here], nodes[u.target]);
          neighbors(here).forEach(function (nb) {
            var d = dist2(nodes[nb], nodes[u.target]);
            if (d < bestD) { bestD = d; best = nb; }
          });
          if (best < 0) { u.target = here; continue; }
          u.from = here; u.to = best; u.p = 0;
        }
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (!links.length) computeLinks();
      // Links, bucketed by opacity to keep canvas state changes low.
      var buckets = [[], [], [], [], []];
      links.forEach(function (l) { buckets[Math.min(4, Math.floor((1 - Math.sqrt(l[2]) / LINK) * 5))].push(l); });
      ctx.lineWidth = 1;
      buckets.forEach(function (b, bi) {
        if (!b.length) return;
        ctx.strokeStyle = "rgba(" + rgb1 + "," + (0.03 + bi * 0.045) + ")";
        ctx.beginPath();
        b.forEach(function (l) { ctx.moveTo(nodes[l[0]].x, nodes[l[0]].y); ctx.lineTo(nodes[l[1]].x, nodes[l[1]].y); });
        ctx.stroke();
      });
      // Pointer joins the network.
      ctx.strokeStyle = "rgba(" + rgb2 + ",0.22)";
      ctx.beginPath();
      nodes.forEach(function (n) {
        if (dist2(n, pointer) < 26000) { ctx.moveTo(n.x, n.y); ctx.lineTo(pointer.x, pointer.y); }
      });
      ctx.stroke();
      // Nodes.
      nodes.forEach(function (n) {
        ctx.fillStyle = "rgba(" + rgb1 + "," + (n.hub ? 0.85 : 0.5) + ")";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.hub ? n.r + 1.1 : n.r, 0, 6.2832); ctx.fill();
        if (n.hub) {
          ctx.fillStyle = "rgba(" + rgb1 + ",0.08)";
          ctx.beginPath(); ctx.arc(n.x, n.y, 9, 0, 6.2832); ctx.fill();
        }
      });
      // Pulses: a glowing packet plus the edge it is travelling on.
      pulses.forEach(function (u) {
        var a = nodes[u.from], b = nodes[u.to], t = Math.min(u.p, 1);
        var x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        ctx.strokeStyle = "rgba(" + rgb2 + "," + 0.5 * u.life + ")";
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(x, y); ctx.stroke();
        var g = ctx.createRadialGradient(x, y, 0, x, y, 10);
        g.addColorStop(0, "rgba(" + rgb2 + "," + 0.95 * u.life + ")");
        g.addColorStop(1, "rgba(" + rgb2 + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.2832); ctx.fill();
      });
      ctx.lineWidth = 1;
    }
    var frame = 0;
    function loop(now) {
      // Touch devices redraw at half rate to save battery.
      if (!coarse || frame++ % 2 === 0) { step(now || 0); draw(); }
      rafId = running ? requestAnimationFrame(loop) : 0;
    }

    readColors();
    resize();
    window.addEventListener("resize", rafThrottle(resize));
    window.addEventListener("pointermove", function (e) { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
    document.addEventListener("pointerleave", function () { pointer.x = pointer.y = -1e4; });
    themeListeners.push(function () { readColors(); if (!running) draw(); });
    if (running) rafId = requestAnimationFrame(loop); else draw();

    return {
      toggle: function () {
        running = !running;
        if (running && !rafId) rafId = requestAnimationFrame(loop);
        return running;
      }
    };
  })();

  /* ------------------------------------------------------------------ liquid glass refraction (Chromium only)
     Chromium can run an SVG filter on an element's backdrop. For each .liquid element we draw a
     displacement map on a canvas — a thick rounded rim that bends the backdrop inward, or, for the
     lens, a convex magnifier — and split R/G/B with slightly different strengths for a prism fringe.
     Other browsers keep the plain frosted blur from the CSS. */
  var isChromium = !!(navigator.userAgentData && navigator.userAgentData.brands &&
    navigator.userAgentData.brands.some(function (b) { return /Chromium/i.test(b.brand); }));
  var defs = $("#fx-defs");
  if (isChromium && defs && !reduceTransparency && "ResizeObserver" in window) {
    root.classList.add("lg");
    var SVGNS = "http://www.w3.org/2000/svg";
    var svgEl = function (tag, attrs) {
      var el = document.createElementNS(SVGNS, tag);
      for (var k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    };
    var mapCanvas = document.createElement("canvas");

    // Rounded-rect rim: inside a band of `bezel` px along the edge, sample the backdrop further inward.
    var rimMap = function (w, h, radius, bezel) {
      mapCanvas.width = w; mapCanvas.height = h;
      var c = mapCanvas.getContext("2d"), img = c.createImageData(w, h), d = img.data;
      var hw = w / 2, hh = h / 2, r = Math.min(radius, hw, hh);
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var px = x + 0.5 - hw, py = y + 0.5 - hh;
          var qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
          var inside = -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r);
          var ox = 0, oy = 0;
          if (inside > 0 && inside < bezel) {
            var nx, ny;
            if (qx > 0 && qy > 0) { var l = Math.hypot(qx, qy); nx = qx / l; ny = qy / l; }
            else if (qx > qy) { nx = 1; ny = 0; } else { nx = 0; ny = 1; }
            nx *= px < 0 ? -1 : 1; ny *= py < 0 ? -1 : 1;
            var t = 1 - inside / bezel, m = t * t * (3 - 2 * t);
            ox = -nx * m; oy = -ny * m;
          }
          var i = (y * w + x) * 4;
          d[i] = 128 + ox * 127; d[i + 1] = 128 + oy * 127; d[i + 2] = 128; d[i + 3] = 255;
        }
      }
      c.putImageData(img, 0, 0);
      return mapCanvas.toDataURL();
    };

    // Convex lens: everything is pulled toward the center (magnification), more strongly near the rim.
    var lensMap = function (w, h) {
      mapCanvas.width = w; mapCanvas.height = h;
      var c = mapCanvas.getContext("2d"), img = c.createImageData(w, h), d = img.data;
      var R = Math.min(w, h) / 2, cx = w / 2, cy = h / 2;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var dx = (x + 0.5 - cx) / R, dy = (y + 0.5 - cy) / R, rho = Math.hypot(dx, dy);
          var ox = 0, oy = 0;
          if (rho < 1) {
            var e = Math.max(0, Math.min(1, (rho - 0.6) / 0.4)), edge = e * e * (3 - 2 * e);
            var k = 0.42 + 0.58 * edge * edge;
            ox = -dx * k; oy = -dy * k;
          }
          var i = (y * w + x) * 4;
          d[i] = 128 + ox * 127; d[i + 1] = 128 + oy * 127; d[i + 2] = 128; d[i + 3] = 255;
        }
      }
      c.putImageData(img, 0, 0);
      return mapCanvas.toDataURL();
    };

    // One displacement pass per color channel at slightly different strengths gives the prism fringe.
    // Touch devices get a single pass (no fringe) to keep scrolling smooth.
    var CHANNELS = coarse ? [] : [
      ["1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", 1.0],
      ["0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", 0.93],
      ["0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", 0.86]
    ];

    $$(".liquid").forEach(function (el, n) {
      var id = "lg-" + n;
      var isLens = el.classList.contains("lens");
      var filter = svgEl("filter", { id: id, x: "0", y: "0", width: "1", height: "1", filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" });
      var image = svgEl("feImage", { x: "0", y: "0", width: "1", height: "1", preserveAspectRatio: "none", result: "map" });
      filter.appendChild(image);
      var maps;
      if (CHANNELS.length) {
        maps = CHANNELS.map(function (ch, ci) {
          var disp = svgEl("feDisplacementMap", { "in": "SourceGraphic", in2: "map", scale: "0", xChannelSelector: "R", yChannelSelector: "G", result: "d" + ci });
          filter.appendChild(disp);
          filter.appendChild(svgEl("feColorMatrix", { "in": "d" + ci, type: "matrix", values: ch[0], result: "c" + ci }));
          return { node: disp, k: ch[1] };
        });
        filter.appendChild(svgEl("feBlend", { "in": "c0", in2: "c1", mode: "screen", result: "c01" }));
        filter.appendChild(svgEl("feBlend", { "in": "c01", in2: "c2", mode: "screen" }));
      } else {
        var single = svgEl("feDisplacementMap", { "in": "SourceGraphic", in2: "map", scale: "0", xChannelSelector: "R", yChannelSelector: "G" });
        filter.appendChild(single);
        maps = [{ node: single, k: 1 }];
      }
      defs.appendChild(filter);

      var lastKey = "";
      var update = function () {
        var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
        if (!w || !h) return;
        var key = w + "x" + h;
        if (key === lastKey) return;
        lastKey = key;
        var radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
        var bezel = Math.max(8, Math.min(22, Math.min(w, h) * 0.42));
        var scale = isLens ? Math.min(w, h) * 0.58 : bezel * 2.1;
        [filter, image].forEach(function (node) { node.setAttribute("width", w); node.setAttribute("height", h); });
        image.setAttribute("href", isLens ? lensMap(w, h) : rimMap(w, h, radius, bezel));
        maps.forEach(function (m) { m.node.setAttribute("scale", (scale * m.k).toFixed(1)); });
        el.style.backdropFilter = "url(#" + id + ") blur(" + (isLens ? 0.4 : 3) + "px) saturate(" + (isLens ? 1.25 : 1.85) + ") brightness(1.05)";
      };
      new ResizeObserver(update).observe(el);
      update();
    });
  }

  /* ------------------------------------------------------------------ draggable lens */
  var lens = $(".lens");
  if (lens) {
    var wrap = lens.parentElement, drag = null, offX = 0, offY = 0;
    lens.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX - offX, y: e.clientY - offY };
      lens.setPointerCapture(e.pointerId);
      lens.classList.add("grabbing");
    });
    lens.addEventListener("pointermove", function (e) {
      if (!drag) return;
      offX = e.clientX - drag.x; offY = e.clientY - drag.y;
      wrap.style.transform = "translate(" + offX + "px," + offY + "px)";
    });
    var end = function () { drag = null; lens.classList.remove("grabbing"); };
    lens.addEventListener("pointerup", end);
    lens.addEventListener("pointercancel", end);
    lens.addEventListener("dblclick", function () { offX = offY = 0; wrap.style.transform = ""; });
  }

  /* ------------------------------------------------------------------ command palette */
  var palette = $("#palette"), input = $("#palette-input"), list = $("#palette-list");
  var commands = [], visible = [], selected = 0, lastFocus = null;
  function openUrl(url) { window.open(url, "_blank", "noopener"); }
  function cmd(group, icon, label, hint, run) { commands.push({ group: group, icon: icon, label: label, hint: hint, run: run }); }

  cmd("navigate", "#", "Go to About", "g a", function () { go("#about"); });
  cmd("navigate", "#", "Go to Publications", "g p", function () { go("#publications"); });
  cmd("navigate", "#", "Go to Contact", "g c", function () { go("#contact"); });
  cmd("navigate", "↑", "Back to top", "", function () { go("#top"); });
  cmd("actions", "@", "Copy email address", "", function () { copy(email, "email"); });
  cmd("actions", "◐", "Toggle light / dark theme", "t", toggleTheme);
  if (net) cmd("actions", "~", "Pause / resume the background network", "", function () { toast(net.toggle() ? "network: running" : "network: paused"); });
  cmd("links", "↗", "Open Google Scholar", "", function () { openUrl("https://scholar.google.com/citations?user=aqVLYsAAAAAJ"); });
  cmd("links", "↗", "Open GitHub", "", function () { openUrl("https://github.com/qufy6"); });
  cmd("links", "</>", "View this site's source", "", function () { openUrl("https://github.com/qufy6/qufy6.github.io"); });
  $$(".pub").forEach(function (pub) {
    var code = $(".bibtex code", pub);
    if (code && pub.dataset.cmd) cmd("bibtex", "{}", "Copy BibTeX — " + pub.dataset.cmd, "", function () { copy(code.textContent, "bibtex"); });
  });

  function render() {
    var q = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    visible = commands.filter(function (c) {
      var hay = (c.label + " " + c.group).toLowerCase();
      return q.every(function (w) { return hay.indexOf(w) !== -1; });
    });
    selected = Math.min(selected, Math.max(0, visible.length - 1));
    list.innerHTML = "";
    if (!visible.length) {
      var empty = document.createElement("li");
      empty.className = "cmd-empty";
      empty.textContent = "no matching command — try “bib”, “theme” or “email”";
      list.appendChild(empty);
      input.removeAttribute("aria-activedescendant");
      return;
    }
    var group = "";
    visible.forEach(function (c, i) {
      if (c.group !== group) {
        group = c.group;
        var g = document.createElement("li");
        g.className = "cmd-group";
        g.setAttribute("role", "presentation");
        g.textContent = group;
        list.appendChild(g);
      }
      var li = document.createElement("li");
      li.className = "cmd-item";
      li.id = "cmd-" + i;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === selected));
      li.innerHTML = '<span class="cmd-icon" aria-hidden="true"></span><span class="cmd-label"></span>' + (c.hint ? '<span class="cmd-hint"></span>' : "");
      li.querySelector(".cmd-icon").textContent = c.icon;
      li.querySelector(".cmd-label").textContent = c.label;
      if (c.hint) li.querySelector(".cmd-hint").textContent = c.hint;
      li.addEventListener("pointermove", function () { if (selected !== i) { selected = i; mark(); } });
      li.addEventListener("click", function () { run(i); });
      list.appendChild(li);
    });
    mark();
  }
  function mark() {
    $$(".cmd-item", list).forEach(function (li) { li.setAttribute("aria-selected", String(li.id === "cmd-" + selected)); });
    var cur = document.getElementById("cmd-" + selected);
    if (!cur) return;
    input.setAttribute("aria-activedescendant", cur.id);
    // Keep the selection visible by scrolling only the list, never the page behind it.
    var top = cur.offsetTop, bottom = top + cur.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top - 8;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 8;
  }
  function run(i) {
    var c = visible[i];
    if (!c) return;
    closePalette();
    setTimeout(c.run, 60);
  }
  function openPalette() {
    if (!palette) return;
    lastFocus = document.activeElement;
    palette.hidden = false;
    input.value = "";
    selected = 0;
    render();
    input.focus({ preventScroll: true });
  }
  function closePalette() {
    if (!palette || palette.hidden) return;
    palette.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  if (palette && input && list) {
    input.addEventListener("input", function () { selected = 0; render(); });
    $$("[data-close]", palette).forEach(function (el) { el.addEventListener("click", closePalette); });
    $$('[data-action="palette"]').forEach(function (b) { b.addEventListener("click", openPalette); });
  }

  /* ------------------------------------------------------------------ keyboard */
  var gPressed = 0;
  function typingIn(el) { return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)); }
  document.addEventListener("keydown", function (e) {
    var k = e.key;
    if (palette && (e.metaKey || e.ctrlKey) && (k === "k" || k === "K")) {
      e.preventDefault();
      if (palette.hidden) openPalette(); else closePalette();
      return;
    }
    if (palette && !palette.hidden) {
      if (k === "Escape") { e.preventDefault(); closePalette(); }
      else if (k === "ArrowDown") { e.preventDefault(); if (visible.length) { selected = (selected + 1) % visible.length; mark(); } }
      else if (k === "ArrowUp") { e.preventDefault(); if (visible.length) { selected = (selected - 1 + visible.length) % visible.length; mark(); } }
      else if (k === "Enter") { e.preventDefault(); run(selected); }
      else if (k === "Tab") { e.preventDefault(); }
      return;
    }
    if (typingIn(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (k === "/" && palette) { e.preventDefault(); openPalette(); }
    else if (k === "t") toggleTheme();
    else if (k === "g") gPressed = Date.now();
    else if (gPressed && Date.now() - gPressed < 900) {
      if (k === "a") go("#about");
      else if (k === "p") go("#publications");
      else if (k === "c") go("#contact");
      gPressed = 0;
    }
  });

  /* ------------------------------------------------------------------ hello, fellow hacker */
  if (window.console && console.log) {
    console.log(
      "%cfq_%c\n\nHey there, fellow hacker.\nThis page is hand-written HTML, CSS and JS: no frameworks, no build step.\n" +
      "Source: https://github.com/qufy6/qufy6.github.io\nTip: press ⌘K (or /) for the command palette.",
      "font: 800 28px ui-monospace, Menlo, monospace; color: #4ae3a7;",
      "font: 12px ui-monospace, Menlo, monospace;"
    );
  }
})();
