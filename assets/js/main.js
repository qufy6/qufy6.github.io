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
  function addSpot(el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
    el.addEventListener("pointerleave", function () {
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
    });
  }
  $$(".spot").forEach(addSpot);

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
  } else if (indicator && $(".dock-links a.active")) {
    // Pages without sections (the blog) mark their link as active in the HTML.
    var placeStatic = function () {
      var a = $(".dock-links a.active");
      indicator.style.width = a.offsetWidth + "px";
      indicator.style.transform = "translateX(" + a.offsetLeft + "px)";
      indicator.style.opacity = "1";
    };
    placeStatic();
    window.addEventListener("resize", rafThrottle(placeStatic));
  }

  /* ------------------------------------------------------------------ smooth jumps */
  function go(hash) {
    var target = hash === "#top" ? document.body : $(hash);
    if (!target) { location.href = "/" + hash; return; } // e.g. from a blog page back to a homepage section
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

  /* ------------------------------------------------------------------ lightbox (paper figures, hobby media, blog images) */
  var lb = $("#lightbox"), lbStage = lb && $(".lightbox-stage", lb), lbCap = lb && $(".lightbox-caption", lb);
  var lbItems = [], lbIndex = 0, lbReturn = null;
  function lbShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    var it = lbItems[lbIndex], el;
    lbStage.innerHTML = "";
    if (it.type === "video") {
      el = document.createElement("video");
      el.controls = true; el.autoplay = true; el.playsInline = true;
    } else {
      el = document.createElement("img");
      el.alt = it.alt || "";
    }
    el.src = it.src;
    lbStage.appendChild(el);
    lbCap.textContent = it.caption || "";
    lbCap.hidden = !it.caption;
    $$(".lightbox-nav", lb).forEach(function (b) { b.hidden = lbItems.length < 2; });
  }
  function openLightbox(items, i) {
    if (!lb || !items.length) return;
    lbItems = items;
    lbReturn = document.activeElement;
    lb.hidden = false;
    lbShow(i || 0);
    $(".lightbox-close", lb).focus({ preventScroll: true });
  }
  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    lbStage.innerHTML = "";
    if (lbReturn && lbReturn.focus) lbReturn.focus({ preventScroll: true });
  }
  if (lb) {
    $$("[data-close]", lb).forEach(function (el) { el.addEventListener("click", closeLightbox); });
    $(".lightbox-nav.prev", lb).addEventListener("click", function () { lbShow(lbIndex - 1); });
    $(".lightbox-nav.next", lb).addEventListener("click", function () { lbShow(lbIndex + 1); });
  }
  $$(".pub-figure").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var img = $("img", btn);
      openLightbox([{ type: "img", src: btn.dataset.full || img.src, alt: img.alt, caption: btn.dataset.caption }], 0);
    });
  });
  $$(".prose img").forEach(function (img) {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", function () {
      // Images that share a <figure> open as one gallery (e.g. a three-panel figure).
      var fig = img.closest("figure"), group = fig ? $$("img", fig) : [img];
      openLightbox(group.map(function (m) {
        return { type: "img", src: m.currentSrc || m.src, alt: m.alt, caption: m.alt };
      }), group.indexOf(img));
    });
  });

  /* ------------------------------------------------------------------ hobby galleries: empty frame until media is added */
  $$(".media").forEach(function (box) {
    var media = $$("img, video", box);
    if (!media.length) { box.classList.add("is-empty"); return; }
    var items = media.map(function (m) {
      return { type: m.tagName === "VIDEO" ? "video" : "img", src: m.currentSrc || m.src, alt: m.alt, caption: m.getAttribute("alt") || m.getAttribute("title") || "" };
    });
    media.forEach(function (m, i) {
      if (m.tagName === "IMG") m.loading = "lazy";
      m.addEventListener("click", function (e) { e.preventDefault(); openLightbox(items, i); });
    });
  });

  /* ------------------------------------------------------------------ latest blog posts on the homepage */
  var blogList = $("[data-blog-list]");
  if (blogList && window.fetch) {
    fetch("/blog/posts.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (posts) {
        if (!Array.isArray(posts) || !posts.length) return;
        blogList.innerHTML = "";
        posts.slice(0, 3).forEach(function (p) {
          var a = document.createElement("a");
          a.className = "card glass spot post-card";
          a.href = p.url;
          a.innerHTML = '<span class="post-date"></span><span class="post-title"></span><span class="post-excerpt"></span><span class="post-foot"></span>';
          $(".post-date", a).textContent = p.date;
          $(".post-title", a).textContent = p.title;
          $(".post-excerpt", a).textContent = p.excerpt || "";
          var foot = $(".post-foot", a);
          foot.textContent = (p.minutes || 1) + " min read";
          (p.tags || []).forEach(function (t) {
            var s = document.createElement("span");
            s.className = "post-tag";
            s.textContent = "#" + t;
            foot.appendChild(s);
          });
          blogList.appendChild(a);
          addSpot(a);
        });
      })
      .catch(function () { /* keep the static "Read the blog" card */ });
  }

  /* ------------------------------------------------------------------ reading progress on blog posts */
  var progress = $(".read-progress span"), article = $(".post-article");
  if (progress && article) {
    var updateProgress = function () {
      var r = article.getBoundingClientRect();
      var p = -r.top / Math.max(1, r.height - window.innerHeight * 0.6);
      progress.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
    };
    window.addEventListener("scroll", rafThrottle(updateProgress), { passive: true });
    updateProgress();
  }

  /* ------------------------------------------------------------------ travel globe
     A dotted, see-through glass globe on a canvas (orthographic projection, no libraries).
     Land dots: assets/data/land-dots.json (Natural Earth 110m, sampled offline into bitmask rows).
     Places and the journey arcs: assets/data/places.json. */
  var globe = (function () {
    var cv = $("#globe");
    if (!cv || !cv.getContext || !window.fetch) return null;
    var wrap = cv.parentElement, tip = $(".globe-tip", wrap), ctx = cv.getContext("2d");
    var D2R = Math.PI / 180, TAU = Math.PI * 2, HOME_LAT = 24 * D2R;
    var dpr = 1, R = 0, cx = 0, cy = 0;
    var landN = 0, lSin, lCos, lLon, px, py, pz;
    var places = [], arcs = [], proj = [];
    var lon0 = 112 * D2R, lat0 = HOME_LAT, sin0 = 0, cos0 = 1, vLon = 0, vLat = 0;
    var drag = null, hover = -1, focus = -1, focusUntil = 0, idleUntil = 0, tween = null;
    var inView = false, rafId = 0, last = 0, C = {}, monoFont = "monospace";
    var tmp = { x: 0, y: 0, z: 0 };

    function readColors() {
      var cs = getComputedStyle(root), v = function (n) { return cs.getPropertyValue(n).trim(); };
      C = {
        dot: v("--net-rgb"), base: v("--accent-rgb"), visit: v("--accent-2-rgb"), text: v("--text"),
        hi: v("--globe-fill-hi"), lo: v("--globe-fill-lo"), rim: v("--globe-rim"), glow: v("--globe-glow"),
        back: parseFloat(v("--globe-back")) || 0.08
      };
      monoFont = v("--font-mono") || "monospace";
    }
    function resize() {
      var w = Math.round(wrap.getBoundingClientRect().width);
      if (!w) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = cv.height = Math.round(w * dpr);
      R = w * dpr * 0.4;
      cx = cy = w * dpr / 2;
      requestDraw();
    }
    function project(s, c, lon, h, out) {
      var d = lon - lon0, cd = Math.cos(d);
      out.x = cx + R * h * c * Math.sin(d);
      out.y = cy - R * h * (cos0 * s - sin0 * c * cd);
      out.z = sin0 * s + cos0 * c * cd;
      return out;
    }
    function behind(o) { var dx = o.x - cx, dy = o.y - cy; return o.z < 0 && dx * dx + dy * dy < R * R; }
    function glow(x, y, r, rgb, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(" + rgb + "," + a + ")");
      g.addColorStop(1, "rgba(" + rgb + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }

    function loadLand(data) {
      var lats = [], lons = [];
      data.rows.forEach(function (row) {
        var bits = atob(row.bits);
        for (var j = 0; j < row.n; j++) {
          if ((bits.charCodeAt(j >> 3) >> (j & 7)) & 1) { lats.push(row.lat); lons.push(-180 + (j + 0.5) * 360 / row.n); }
        }
      });
      landN = lats.length;
      lSin = new Float32Array(landN); lCos = new Float32Array(landN); lLon = new Float32Array(landN);
      px = new Float32Array(landN); py = new Float32Array(landN); pz = new Float32Array(landN);
      for (var i = 0; i < landN; i++) {
        lSin[i] = Math.sin(lats[i] * D2R); lCos[i] = Math.cos(lats[i] * D2R); lLon[i] = lons[i] * D2R;
      }
    }
    function continent(lat, lon) {
      if (lon < -25) return lat < 12 ? "south america" : "north america";
      if (lat < -10 && lon > 110) return "oceania";
      if (lat > 35 && lon < 60) return "europe";
      if (lon < 52 && (lon < 35 || lat < 12)) return "africa";
      return "asia";
    }
    function arc(a, b) {
      var va = [a.c * Math.cos(a.lon), a.c * Math.sin(a.lon), a.s], vb = [b.c * Math.cos(b.lon), b.c * Math.sin(b.lon), b.s];
      var w = Math.acos(Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]))), sw = Math.sin(w), pts = [];
      if (sw < 1e-6) return pts;
      for (var i = 0; i <= 80; i++) {
        var t = i / 80, k1 = Math.sin((1 - t) * w) / sw, k2 = Math.sin(t * w) / sw;
        var x = k1 * va[0] + k2 * vb[0], y = k1 * va[1] + k2 * vb[1], z = k1 * va[2] + k2 * vb[2];
        var lat = Math.asin(Math.max(-1, Math.min(1, z)));
        pts.push({ s: Math.sin(lat), c: Math.cos(lat), lon: Math.atan2(y, x), h: 1 + (0.1 + 0.3 * w / Math.PI) * Math.sin(Math.PI * t) });
      }
      return pts;
    }
    function loadPlaces(data) {
      var byName = {};
      places = (data.places || []).map(function (p, i) {
        byName[p.name] = i;
        return {
          name: p.name, note: p.note || "", base: p.type === "base", left: p.label === "left", listed: p.list !== false,
          s: Math.sin(p.lat * D2R), c: Math.cos(p.lat * D2R), lat: p.lat * D2R, lon: p.lon * D2R,
          region: continent(p.lat, p.lon), phase: Math.random() * 2.2
        };
      });
      var j = data.journey || [];
      for (var k = 0; k + 1 < j.length; k++) {
        if (byName[j[k]] != null && byName[j[k + 1]] != null) arcs.push(arc(places[byName[j[k]]], places[byName[j[k + 1]]]));
      }
    }

    function renderChips() {
      $$("[data-place-count]").forEach(function (el) { el.textContent = places.length; });
      var regions = {};
      places.forEach(function (p) { regions[p.region] = (regions[p.region] || 0) + 1; });
      $$("[data-continent-count]").forEach(function (el) { el.textContent = Object.keys(regions).length; });
      var host = $("[data-place-groups]");
      if (!host) return;
      host.innerHTML = "";
      var groups = [["studied & worked", function (p) { return p.base; }]];
      Object.keys(regions).sort(function (a, b) { return regions[b] - regions[a]; }).forEach(function (r) {
        groups.push([r, function (p) { return !p.base && p.region === r; }]);
      });
      groups.forEach(function (g) {
        var members = places.filter(g[1]), shown = members.filter(function (p) { return p.listed; });
        if (!shown.length) return;
        var box = document.createElement("div"), h = document.createElement("h4"), list = document.createElement("div");
        box.className = "place-group"; list.className = "place-chips";
        h.textContent = g[0];
        shown.forEach(function (p) {
          var i = places.indexOf(p), b = document.createElement("button");
          b.type = "button";
          b.className = "place-chip" + (p.base ? " base" : "");
          b.dataset.i = i;
          b.textContent = p.name;
          b.addEventListener("click", function () { flyTo(i); });
          b.addEventListener("pointerenter", function () { hover = i; requestDraw(); });
          b.addEventListener("pointerleave", function () { hover = -1; requestDraw(); });
          list.appendChild(b);
        });
        // Places marked "list": false stay on the globe but are summarised here as "etc."
        if (shown.length < members.length) {
          var etc = document.createElement("span");
          etc.className = "place-etc";
          etc.textContent = "etc.";
          etc.title = (members.length - shown.length) + " more on the globe";
          list.appendChild(etc);
        }
        box.appendChild(h); box.appendChild(list); host.appendChild(box);
      });
    }
    function markChip() {
      $$(".place-chip").forEach(function (b) { b.classList.toggle("active", +b.dataset.i === focus); });
    }

    function draw(now) {
      var size = cv.width, t = now / 1000, i, o;
      ctx.clearRect(0, 0, size, size);
      if (!R) return;
      sin0 = Math.sin(lat0); cos0 = Math.cos(lat0);

      // Atmosphere.
      var atm = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.3);
      atm.addColorStop(0, C.glow); atm.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, 0, TAU); ctx.fill();

      // Land: project once, then draw the far side faintly (seen through the glass) and the near side by depth.
      for (i = 0; i < landN; i++) {
        project(lSin[i], lCos[i], lLon[i], 1, tmp);
        px[i] = tmp.x; py[i] = tmp.y; pz[i] = tmp.z;
      }
      var sz = 1.4 * dpr;
      ctx.fillStyle = "rgba(" + C.dot + "," + C.back + ")";
      for (i = 0; i < landN; i++) if (pz[i] < 0) ctx.fillRect(px[i] - sz / 2, py[i] - sz / 2, sz, sz);

      var body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.42, R * 0.05, cx, cy, R);
      body.addColorStop(0, C.hi); body.addColorStop(1, C.lo);
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

      for (var b = 0; b < 4; b++) {
        var lo = b / 4, hi = (b + 1) / 4, s = (1.2 + 0.28 * b) * dpr;
        ctx.fillStyle = "rgba(" + C.dot + "," + (0.26 + 0.2 * b).toFixed(2) + ")";
        for (i = 0; i < landN; i++) {
          var z = pz[i];
          if (z > lo && (z <= hi || b === 3)) ctx.fillRect(px[i] - s / 2, py[i] - s / 2, s, s);
        }
      }

      // Glass rim and a soft specular highlight.
      ctx.strokeStyle = C.rim; ctx.lineWidth = dpr;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      var spec = ctx.createRadialGradient(cx - R * 0.42, cy - R * 0.5, 0, cx - R * 0.42, cy - R * 0.5, R * 0.6);
      spec.addColorStop(0, "rgba(255,255,255,0.16)"); spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spec; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

      // Journey arcs: dashed great circles lifted off the surface, with a travelling spark.
      arcs.forEach(function (pts, ai) {
        ctx.setLineDash([3 * dpr, 5 * dpr]);
        ctx.lineDashOffset = -t * 16 * dpr;
        ctx.lineWidth = 1.4 * dpr;
        ctx.strokeStyle = "rgba(" + C.base + ",0.8)";
        ctx.beginPath();
        var pen = false;
        pts.forEach(function (q) {
          project(q.s, q.c, q.lon, q.h, tmp);
          if (behind(tmp)) { pen = false; return; }
          if (pen) ctx.lineTo(tmp.x, tmp.y); else { ctx.moveTo(tmp.x, tmp.y); pen = true; }
        });
        ctx.stroke();
        ctx.setLineDash([]);
        var q = pts[Math.floor(((t * 0.2 + ai * 0.5) % 1) * (pts.length - 1))];
        if (q) {
          project(q.s, q.c, q.lon, q.h, tmp);
          if (!behind(tmp)) glow(tmp.x, tmp.y, 8 * dpr, C.base, 0.95);
        }
      });

      // Places.
      ctx.font = "500 " + 11 * dpr + "px " + monoFont;
      for (i = 0; i < places.length; i++) {
        var p = places[i];
        o = proj[i] || (proj[i] = { x: 0, y: 0, z: 0 });
        project(p.s, p.c, p.lon, 1, o);
        if (o.z <= 0.02) continue;
        var a = Math.min(1, o.z * 2.2), active = i === hover || i === focus, col = p.base ? C.base : C.visit;
        if (p.base || active) {
          var ph = ((t + p.phase) % 2.2) / 2.2;
          ctx.strokeStyle = "rgba(" + col + "," + (0.65 * (1 - ph) * a).toFixed(3) + ")";
          ctx.lineWidth = 1.2 * dpr;
          ctx.beginPath(); ctx.arc(o.x, o.y, (4 + ph * 13) * dpr, 0, TAU); ctx.stroke();
        }
        glow(o.x, o.y, (active ? 11 : p.base ? 8 : 6) * dpr, col, (0.5 * a).toFixed(3));
        ctx.fillStyle = "rgba(" + col + "," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(o.x, o.y, (active ? 3.8 : p.base ? 3.1 : 2.3) * dpr, 0, TAU); ctx.fill();
        if (active) {
          ctx.strokeStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
          ctx.lineWidth = 1.3 * dpr;
          ctx.beginPath(); ctx.arc(o.x, o.y, 6.5 * dpr, 0, TAU); ctx.stroke();
        }
        if (p.base && o.z > 0.3) {
          ctx.globalAlpha = Math.min(1, (o.z - 0.3) * 3) * 0.9;
          ctx.fillStyle = C.text;
          ctx.textAlign = p.left ? "right" : "left";
          ctx.fillText(p.name, o.x + (p.left ? -10 : 10) * dpr, o.y + 4 * dpr);
          ctx.globalAlpha = 1;
        }
      }
    }

    function updateTip() {
      var i = hover >= 0 ? hover : focus, o = proj[i];
      if (!tip || i < 0 || !o || o.z <= 0.02) { if (tip) tip.hidden = true; return; }
      if (tip.dataset.i !== String(i)) {
        var p = places[i];
        tip.dataset.i = i;
        tip.textContent = p.name;
        if (p.note) { var sm = document.createElement("small"); sm.textContent = p.note; tip.appendChild(sm); }
      }
      tip.hidden = false;
      tip.style.left = o.x / dpr + "px";
      tip.style.top = o.y / dpr + "px";
    }

    function flyTo(i) {
      var p = places[i];
      if (!p) return;
      var d = ((p.lon - lon0 + Math.PI) % TAU + TAU) % TAU - Math.PI;
      tween = { a: [lon0, lat0], b: [lon0 + d, Math.max(-1, Math.min(1, p.lat * 0.85))], t0: performance.now(), dur: 1100 };
      focus = i; focusUntil = performance.now() + 5500; idleUntil = focusUntil;
      markChip();
      requestDraw();
    }

    function frame(now) {
      rafId = 0;
      var moving = false, dt = last ? Math.min(50, now - last) : 16.7;
      last = now;
      if (tween) {
        var k = Math.min(1, (now - tween.t0) / tween.dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        lon0 = tween.a[0] + (tween.b[0] - tween.a[0]) * e;
        lat0 = tween.a[1] + (tween.b[1] - tween.a[1]) * e;
        if (k >= 1) tween = null;
        moving = true;
      } else if (!drag) {
        if (Math.abs(vLon) + Math.abs(vLat) > 1e-4) {
          lon0 += vLon; lat0 = Math.max(-1.2, Math.min(1.2, lat0 + vLat));
          vLon *= 0.93; vLat *= 0.93;
          moving = true;
        } else if (!reduceMotion && now > idleUntil) {
          lon0 -= 0.0013 * dt;                       // ≈ 4.5° per second, west to east like the real Earth
          lat0 += (HOME_LAT - lat0) * 0.02;
          moving = true;
        }
      }
      if (focus >= 0 && now > focusUntil) { focus = -1; markChip(); }
      draw(now);
      updateTip();
      if (inView && (moving || drag || !reduceMotion)) rafId = requestAnimationFrame(frame);
    }
    function requestDraw() { if (!rafId && inView) rafId = requestAnimationFrame(frame); }

    function pick(e) {
      var r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) * dpr, my = (e.clientY - r.top) * dpr;
      var best = -1, bd = 196 * dpr * dpr;
      proj.forEach(function (o, i) {
        if (!o || o.z <= 0.02) return;
        var dx = o.x - mx, dy = o.y - my, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }
    cv.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY, lon: lon0, lat: lat0, moved: false };
      tween = null; vLon = vLat = 0;
      cv.setPointerCapture(e.pointerId);
      cv.classList.add("dragging");
      requestDraw();
    });
    cv.addEventListener("pointermove", function (e) {
      if (drag) {
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y, k = dpr / R;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        var nl = drag.lon - dx * k, nt = Math.max(-1.2, Math.min(1.2, drag.lat + dy * k));
        vLon = nl - lon0; vLat = nt - lat0;
        lon0 = nl; lat0 = nt;
        idleUntil = performance.now() + 2500;
        requestDraw();
        return;
      }
      var h = pick(e);
      if (h !== hover) { hover = h; cv.classList.toggle("hovering", h >= 0); requestDraw(); }
    });
    function endDrag(e) {
      if (!drag) return;
      var click = !drag.moved;
      drag = null;
      cv.classList.remove("dragging");
      if (click) { var h = pick(e); if (h >= 0) flyTo(h); }
      requestDraw();
    }
    cv.addEventListener("pointerup", endDrag);
    cv.addEventListener("pointercancel", endDrag);
    cv.addEventListener("pointerleave", function () { if (hover >= 0) { hover = -1; cv.classList.remove("hovering"); requestDraw(); } });

    readColors();
    themeListeners.push(function () { readColors(); requestDraw(); });
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(wrap);
    else window.addEventListener("resize", rafThrottle(resize));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) { last = 0; requestDraw(); }
      }, { rootMargin: "120px" }).observe(cv);
    } else {
      inView = true;
    }
    resize();

    Promise.all([
      fetch("/assets/data/land-dots.json").then(function (r) { return r.json(); }),
      fetch("/assets/data/places.json").then(function (r) { return r.json(); })
    ]).then(function (res) {
      loadLand(res[0]);
      loadPlaces(res[1]);
      renderChips();
      places.forEach(function (p, i) {
        cmd("travel", "✈", "Fly to " + p.name, "", function () {
          go("#life");
          setTimeout(function () { flyTo(i); }, 450);
        });
      });
      requestDraw();
    }).catch(function () { wrap.classList.add("globe-error"); });

    return { flyTo: flyTo };
  })();

  /* ------------------------------------------------------------------ command palette */
  var palette = $("#palette"), input = $("#palette-input"), list = $("#palette-list");
  var commands = [], visible = [], selected = 0, lastFocus = null;
  function openUrl(url) { window.open(url, "_blank", "noopener"); }
  function cmd(group, icon, label, hint, run) { commands.push({ group: group, icon: icon, label: label, hint: hint, run: run }); }

  cmd("navigate", "#", "Go to About", "g a", function () { go("#about"); });
  cmd("navigate", "#", "Go to Publications", "g p", function () { go("#publications"); });
  cmd("navigate", "#", "Go to Blog", "g b", function () { go("#blog"); });
  cmd("navigate", "#", "Go to Life · travel & hobbies", "g l", function () { go("#life"); });
  cmd("navigate", "#", "Go to Contact", "g c", function () { go("#contact"); });
  cmd("navigate", "↑", "Back to top", "", function () { go("#top"); });
  if (email) cmd("actions", "@", "Copy email address", "", function () { copy(email, "email"); });
  cmd("actions", "◐", "Toggle light / dark theme", "t", toggleTheme);
  if (net) cmd("actions", "~", "Pause / resume the background network", "", function () { toast(net.toggle() ? "network: running" : "network: paused"); });
  cmd("links", "✎", "Open the blog · all posts", "", function () { location.href = "/blog/"; });
  cmd("links", "↗", "Open Google Scholar", "", function () { openUrl("https://scholar.google.com/citations?user=aqVLYsAAAAAJ"); });
  cmd("links", "↗", "Open GitHub", "", function () { openUrl("https://github.com/qufy6"); });
  cmd("links", "↗", "Open LinkedIn", "", function () { openUrl("https://www.linkedin.com/in/feiyu-qu-1016a8384/"); });
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
    if (lb && !lb.hidden) {
      if (k === "Escape") { e.preventDefault(); closeLightbox(); }
      else if (k === "ArrowLeft" && lbItems.length > 1) { e.preventDefault(); lbShow(lbIndex - 1); }
      else if (k === "ArrowRight" && lbItems.length > 1) { e.preventDefault(); lbShow(lbIndex + 1); }
      return;
    }
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
      else if (k === "b") go("#blog");
      else if (k === "l") go("#life");
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
