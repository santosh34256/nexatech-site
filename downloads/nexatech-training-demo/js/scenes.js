/* ==========================================================================
   NexaTech Training Platform — 360°-style illustrated scenes
   Each zone is an illustrated panorama that wraps around: drag, swipe, use
   the arrow buttons or arrow keys to look around. Hotspots sit in the scene.
   This is the browser prototype of the immersive view; a VR headset
   version is scoped as a later phase.
   ========================================================================== */
window.NexaScenes = (function () {
  "use strict";

  var W = 1800, H = 520;

  function r(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" ' + (extra || "") + '/>'; }
  function line(x1, y1, x2, y2, stroke, sw, extra) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + stroke + '" stroke-width="' + (sw || 2) + '" ' + (extra || "") + '/>'; }
  function circ(cx, cy, rad, fill, extra) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="' + fill + '" ' + (extra || "") + '/>'; }
  function txt(x, y, s, size, fill, extra) { return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" font-family="Space Grotesk,Segoe UI,Arial,sans-serif" font-weight="700" ' + (extra || "") + '>' + s + '</text>'; }

  /* Shared warehouse shell: wall, roof trusses, lights, floor */
  function shell() {
    var s = '<defs>' +
      '<linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8d3e6"/><stop offset="1" stop-color="#e4eaf5"/></linearGradient>' +
      '<linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a4aec1"/><stop offset="1" stop-color="#7c879c"/></linearGradient>' +
      '<pattern id="hatch" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="11" height="22" fill="#FFB020"/><rect x="11" width="11" height="22" fill="#1b2438"/></pattern>' +
      '</defs>';
    s += r(0, 0, W, 300, "url(#wallG)");
    s += r(0, 300, W, 220, "url(#floorG)");
    s += r(0, 292, W, 10, "#6b768c");
    // roof trusses & lights
    for (var x = 0; x < W; x += 225) {
      s += line(x, 0, x + 112, 46, "#9aa7c0", 5) + line(x + 225, 0, x + 112, 46, "#9aa7c0", 5);
      s += r(x + 82, 52, 60, 8, "#f7f3d7", 'rx="3"') + r(x + 70, 60, 84, 3, "rgba(255,248,200,.35)");
    }
    // floor perspective lines
    for (var f = 0; f < W; f += 150) s += line(f, 302, f - 60 + (f % 300 ? 20 : 0), 520, "rgba(255,255,255,.08)", 2);
    return s;
  }

  function pedestrianLane(y, x0, x1) {
    var s = r(x0, y, x1 - x0, 46, "rgba(47,93,232,.9)");
    s += line(x0, y, x1, y, "#fff", 3) + line(x0, y + 46, x1, y + 46, "#fff", 3);
    for (var x = x0 + 40; x < x1 - 20; x += 150) s += txt(x, y + 32, "🚶", 26, "#fff");
    return s;
  }
  function vehicleLane(y, x0, x1) {
    var s = r(x0, y, x1 - x0, 40, "url(#hatch)", 'opacity=".55"');
    s += line(x0, y, x1, y, "#FFB020", 3) + line(x0, y + 40, x1, y + 40, "#FFB020", 3);
    return s;
  }
  function forklift(x, y, flip) {
    var g = '<g transform="translate(' + x + ',' + y + ')' + (flip ? ' scale(-1,1)' : '') + '">';
    g += r(-6, -118, 8, 118, "#1b2438") + r(18, -118, 8, 118, "#1b2438");                  // mast
    g += r(-14, -36, 52, 8, "#2a2f3c") + r(-14, -28, 60, 6, "#2a2f3c");                      // forks
    g += r(32, -80, 100, 62, "#F5A01B", 'rx="8"');                                           // body
    g += r(62, -128, 58, 52, "none", 'stroke="#1b2438" stroke-width="6" rx="6"');            // cage
    g += r(80, -64, 36, 22, "#1b2438", 'rx="3"');                                            // seat
    g += circ(66, -14, 20, "#1b2438") + circ(66, -14, 8, "#8a93a6") + circ(122, -14, 17, "#1b2438") + circ(122, -14, 7, "#8a93a6");
    g += circ(100, -138, 7, "#FFB020") + '</g>';
    return g;
  }
  function pallet(x, y, boxes) {
    var s = r(x, y, 90, 12, "#a9794a") + r(x + 6, y + 12, 14, 8, "#8a5f37") + r(x + 38, y + 12, 14, 8, "#8a5f37") + r(x + 70, y + 12, 14, 8, "#8a5f37");
    for (var i = 0; i < boxes; i++) s += r(x + 4, y - 30 * (i + 1), 82, 30, i % 2 ? "#c9a679" : "#d7b88b", 'stroke="#8a5f37" stroke-width="2"');
    return s;
  }
  function exitSign(x, y) {
    return r(x, y, 74, 34, "#1E8E5A", 'rx="5"') + txt(x + 8, y + 24, "EXIT", 18, "#fff") + txt(x + 52, y + 26, "➜", 18, "#fff");
  }

  /* -------------------- Loading Bay -------------------- */
  function loadingBay() {
    var s = shell();
    [100, 470, 840, 1210].forEach(function (x, i) {
      s += r(x - 10, 92, 280, 214, "#8c97ad");                                   // frame
      s += r(x, 102, 260, 196, i === 1 ? "#2a2f3c" : "#b9c2d4");                  // door
      if (i !== 1) for (var y = 112; y < 298; y += 16) s += line(x, y, x + 260, y, "#9ca7bd", 3);
      s += r(x - 10, 296, 280, 8, "url(#hatch)");                                  // dock leveller
      s += r(x - 14, 226, 14, 70, "#222a3d") + r(x + 260, 226, 14, 70, "#222a3d"); // bumpers
      s += circ(x + 20, 96, 6, i === 1 ? "#1E8E5A" : "#C2402F");                   // door light
    });
    // truck at bay 2
    s += r(488, 128, 224, 170, "#eef1f7", 'rx="4"') + r(498, 138, 204, 150, "#3a4358", 'rx="3"');
    s += pallet(520, 262, 3) + pallet(618, 262, 2);
    s += txt(500, 120, "BAY 2", 16, "#fff");
    s += vehicleLane(340, 0, W);
    s += txt(60, 366, "VEHICLES ONLY", 18, "#2a2f3c", 'opacity=".75"') + txt(980, 366, "VEHICLES ONLY", 18, "#2a2f3c", 'opacity=".75"');
    s += forklift(760, 378, false);
    s += pedestrianLane(440, 0, W);
    // bollards
    for (var b = 80; b < W; b += 260) s += r(b, 404, 16, 40, "#FFB020", 'rx="4"') + r(b, 418, 16, 8, "#1b2438");
    // PPE station
    s += r(1530, 120, 150, 180, "#f4f6fb", 'stroke="#6b768c" stroke-width="4" rx="8"') + txt(1548, 146, "PPE STATION", 16, "#0A1930");
    s += txt(1546, 206, "⛑️", 44, "#000") + txt(1606, 206, "🦺", 44, "#000") + txt(1546, 268, "🥾", 44, "#000") + txt(1606, 268, "🧤", 44, "#000");
    // exit
    s += r(1700, 150, 80, 150, "#d7dde9", 'stroke="#6b768c" stroke-width="4"') + exitSign(1703, 108) + r(1736, 232, 8, 18, "#6b768c");
    return s;
  }
  var LB_HOTSPOTS = { ppe: [1605, 205], exit: [1740, 200], route: [980, 360] };

  /* -------------------- Forklift Aisle -------------------- */
  function forkliftAisle() {
    var s = shell();
    // racking bays
    for (var x = 0; x < W; x += 300) {
      s += r(x + 2, 90, 10, 212, "#2F5DE8") + r(x + 290, 90, 10, 212, "#2F5DE8");
      [120, 190, 258].forEach(function (y) { s += r(x + 2, y, 298, 9, "#F5A01B"); });
      var cols = ["#d7b88b", "#c9a679", "#e1c9a1"];
      [[120, 0], [190, 1], [258, 2]].forEach(function (lv) {
        for (var k = 0; k < 4; k++) if ((x / 300 + k + lv[1]) % 5 !== 0) s += r(x + 14 + k * 70, lv[0] - 54 + 9, 62, 54, cols[(k + lv[1]) % 3], 'stroke="#8a5f37" stroke-width="2"');
      });
      s += r(x + 120, 62, 60, 22, "#FFD84D", 'stroke="#1b2438" stroke-width="2" rx="3"') + txt(x + 128, 79, "1500 kg", 14, "#1b2438");
    }
    // damaged upright & overloaded bay highlight
    s += r(603, 90, 10, 212, "#C2402F", 'transform="rotate(2 603 190)"');
    // forklift in aisle lane
    s += vehicleLane(344, 0, W);
    s += forklift(1130, 388, true);
    s += pedestrianLane(440, 0, 1380);
    // blind corner
    s += r(1400, 80, 400, 222, "#b3bdd1") + r(1400, 80, 16, 222, "#8c97ad");
    s += r(1430, 70, 8, 232, "#444d62") + circ(1434, 150, 44, "#e8eefc", 'stroke="#C2402F" stroke-width="8"') + circ(1424, 142, 12, "rgba(255,255,255,.7)") + r(1456, 138, 30, 14, "#1b2438", 'opacity=".5" rx="4"');
    s += txt(1480, 190, "BLIND CORNER", 16, "#0A1930") + txt(1480, 212, "STOP · LOOK · LISTEN", 14, "#C2402F");
    s += pedestrianLane(440, 1380, W);
    s += exitSign(1650, 110);
    return s;
  }
  var FA_HOTSPOTS = { walkway: [420, 463], mirror: [1434, 150], racking: [610, 190] };

  /* -------------------- Automotive Parts Storage -------------------- */
  function partsStorage() {
    var s = shell();
    // shelving with boxes
    for (var x = 20; x < 900; x += 220) {
      s += r(x, 100, 8, 200, "#2F5DE8") + r(x + 200, 100, 8, 200, "#2F5DE8");
      [130, 200, 270].forEach(function (y, i) {
        s += r(x, y, 208, 8, "#8c97ad");
        for (var k = 0; k < 3; k++) s += r(x + 12 + k * 62, y - 44 + 8, 54, 44, ["#d7b88b", "#bfc7d8", "#c9a679"][(k + i) % 3], 'stroke="#6b5a40" stroke-width="2"');
      });
    }
    // heavy engine rack
    s += r(470, 180, 168, 12, "#8c97ad");
    s += r(484, 142, 60, 40, "#4a5368", 'rx="6"') + r(556, 142, 60, 40, "#4a5368", 'rx="6"');
    s += r(470, 196, 168, 26, "#FFD84D", 'stroke="#1b2438" stroke-width="2" rx="3"') + txt(484, 215, "⚠ 15 kg + · TWO-PERSON LIFT", 11, "#1b2438");
    // COSHH cabinet
    s += r(980, 120, 140, 180, "#FFC21A", 'stroke="#1b2438" stroke-width="4" rx="6"') + r(992, 134, 54, 150, "#f2b30f") + r(1054, 134, 54, 150, "#f2b30f");
    s += r(1038, 200, 6, 36, "#1b2438") + r(1056, 200, 6, 36, "#1b2438");
    s += '<polygon points="1050,78 1086,114 1050,150 1014,114" fill="#fff" stroke="#C2402F" stroke-width="6"/>' + txt(1040, 124, "🔥", 24, "#000");
    s += txt(990, 316, "COSHH", 18, "#1b2438");
    // trolley
    s += r(1170, 250, 130, 10, "#8c97ad") + r(1176, 202, 8, 48, "#8c97ad") + circ(1190, 274, 12, "#1b2438") + circ(1284, 274, 12, "#1b2438") + r(1196, 214, 84, 36, "#c9a679", 'stroke="#6b5a40" stroke-width="2"');
    s += vehicleLane(344, 0, W);
    s += pedestrianLane(440, 0, W);
    // fire exit door
    s += r(1440, 130, 130, 172, "#C2402F", 'stroke="#6b768c" stroke-width="4" rx="3"') + r(1452, 144, 106, 150, "#d85a49") + r(1460, 220, 14, 8, "#f4f6fb");
    s += exitSign(1468, 90);
    s += '<polygon points="1440,302 1570,302 1600,330 1410,330" fill="url(#hatch)" opacity=".6"/>' + txt(1458, 326, "KEEP CLEAR", 14, "#fff");
    s += pallet(1650, 262, 3);
    return s;
  }
  var PS_HOTSPOTS = { handling: [545, 160], coshh: [1050, 215], fireexit: [1505, 215] };

  var ART = {
    loadingBay:    { svg: loadingBay,    spots: LB_HOTSPOTS },
    forkliftAisle: { svg: forkliftAisle, spots: FA_HOTSPOTS },
    partsStorage:  { svg: partsStorage,  spots: PS_HOTSPOTS }
  };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }

  /* mount(container, zoneId, zone, seenKeys, onHotspot) -> controller */
  function mount(container, zoneId, zone, seenKeys, onHotspot) {
    var art = ART[zoneId] || ART.loadingBay;
    var keys = Object.keys(zone.hotspots);
    var svgMarkup = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + art.svg() + '</svg>';

    function spotButtons(isPrimary) {
      return keys.map(function (k, i) {
        var pos = art.spots[k] || [W / 2, H / 2];
        var seen = seenKeys.indexOf(k) !== -1;
        return '<button type="button" class="hotspot' + (seen ? " seen" : "") + '" data-hotspot="' + k + '" style="left:' + (pos[0] / W * 100) + '%;top:' + (pos[1] / H * 100) + '%" aria-label="Hazard marker ' + (i + 1) + ': ' + esc(zone.hotspots[k].title) + '"' + (isPrimary ? "" : ' tabindex="-1" aria-hidden="true"') + '>' + (seen ? "✓" : (i + 1)) + '</button>';
      }).join("");
    }
    function copy(isPrimary) { return '<div class="pano-copy">' + svgMarkup + spotButtons(isPrimary) + '</div>'; }

    container.innerHTML =
      '<div class="pano" tabindex="0" role="application" aria-label="360-degree view of the ' + esc(zone.zoneName) + '. Drag, swipe or use the left and right arrow keys to look around.">' +
        '<div class="pano-track">' + copy(true) + copy(false) + '</div>' +
        '<span class="pano-label">' + esc(zone.zoneName) + ' · drag to look around</span>' +
        '<button type="button" class="pano-nav left" aria-label="Look left">◀</button>' +
        '<button type="button" class="pano-nav right" aria-label="Look right">▶</button>' +
      '</div>' +
      '<div class="minimap" aria-hidden="true"><div class="mm-window"></div></div>' +
      '<div class="spot-chips" role="group" aria-label="Jump to a hazard marker"></div>';

    var pano = container.querySelector(".pano");
    var track = container.querySelector(".pano-track");
    var mm = container.querySelector(".minimap");
    var mmWin = container.querySelector(".mm-window");
    var chips = container.querySelector(".spot-chips");
    var SW = 0, VW = 0, offset = 0, vel = 0, dragging = false, moved = 0, lastX = 0, raf = null, captured = false, pid = 0;

    function layout() {
      var h = pano.clientHeight || 400;
      SW = Math.round(W * (h / H));
      Array.prototype.forEach.call(track.children, function (c) { c.style.width = SW + "px"; });
      VW = pano.clientWidth;
      mmWin.style.width = Math.min(100, VW / SW * 100) + "%";
      apply();
    }
    function apply() {
      if (SW) { offset = ((offset % SW) + SW) % SW; }
      track.style.transform = "translate3d(" + (-offset) + "px,0,0)";
      mmWin.style.left = (offset / SW * 100) + "%";
    }
    function panTo(spotKey) {
      var pos = art.spots[spotKey]; if (!pos) return;
      var target = pos[0] / W * SW - VW / 2;
      var d = ((target - offset) % SW + SW) % SW; if (d > SW / 2) d -= SW;   // shortest way round
      var start = offset, t0 = null, dur = 520;
      cancelAnimationFrame(raf);
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { offset = start + d; apply(); return; }
      (function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        offset = start + d * e; apply();
        if (p < 1) raf = requestAnimationFrame(step);
      })(performance.now());
    }
    function inertia() {
      if (dragging || Math.abs(vel) < 0.4) return;
      offset += vel; vel *= 0.94; apply();
      raf = requestAnimationFrame(inertia);
    }

    pano.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".pano-nav")) return;
      dragging = true; moved = 0; lastX = e.clientX; vel = 0;
      cancelAnimationFrame(raf);
      captured = false; pid = e.pointerId;
    });
    pano.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      if (!captured && moved > 6) { captured = true; pano.classList.add("grabbing"); try { pano.setPointerCapture(pid); } catch (x) {} }
      offset -= dx; vel = -dx; apply();
    });
    function end() { if (!dragging) return; dragging = false; pano.classList.remove("grabbing"); raf = requestAnimationFrame(inertia); }
    pano.addEventListener("pointerup", end);
    pano.addEventListener("pointercancel", end);
    pano.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { offset -= 140; apply(); e.preventDefault(); }
      if (e.key === "ArrowRight") { offset += 140; apply(); e.preventDefault(); }
    });
    pano.querySelector(".pano-nav.left").addEventListener("click", function () { offset -= 260; apply(); });
    pano.querySelector(".pano-nav.right").addEventListener("click", function () { offset += 260; apply(); });
    mm.addEventListener("click", function (e) {
      var rect = mm.getBoundingClientRect();
      offset = ((e.clientX - rect.left) / rect.width) * SW - VW / 2; apply();
    });
    // hotspots: ignore clicks that were really drags
    track.addEventListener("click", function (e) {
      var b = e.target.closest(".hotspot"); if (!b) return;
      if (moved > 6) { moved = 0; return; }
      onHotspot(b.getAttribute("data-hotspot"));
    });

    function renderChips(seen) {
      chips.innerHTML = keys.map(function (k, i) {
        var done = seen.indexOf(k) !== -1;
        return '<button type="button" class="chip' + (done ? " done" : "") + '" data-chip="' + k + '"><span>' + (done ? "✓" : (i + 1)) + '</span> ' + esc(zone.hotspots[k].title) + '</button>';
      }).join("");
      Array.prototype.forEach.call(chips.querySelectorAll("[data-chip]"), function (c) {
        c.addEventListener("click", function () { var k = c.getAttribute("data-chip"); panTo(k); onHotspot(k); });
      });
    }
    // mini-map markers
    keys.forEach(function (k) {
      var pos = art.spots[k]; var m = document.createElement("i");
      m.className = "mm-dot"; m.setAttribute("data-mm", k); m.style.left = (pos[0] / W * 100) + "%"; mm.appendChild(m);
    });

    renderChips(seenKeys);
    layout();
    // start facing the first hotspot
    offset = Math.max(0, (art.spots[keys[0]][0] / W) * SW - VW / 2); apply();
    var onResize = function () { layout(); };
    window.addEventListener("resize", onResize);

    return {
      markSeen: function (seen) {
        Array.prototype.forEach.call(container.querySelectorAll(".hotspot"), function (b, idx) {
          var k = b.getAttribute("data-hotspot"), done = seen.indexOf(k) !== -1, n = keys.indexOf(k) + 1;
          b.classList.toggle("seen", done); b.textContent = done ? "✓" : n;
        });
        Array.prototype.forEach.call(mm.querySelectorAll(".mm-dot"), function (d) { d.classList.toggle("seen", seen.indexOf(d.getAttribute("data-mm")) !== -1); });
        renderChips(seen);
      },
      panTo: panTo,
      destroy: function () { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); }
    };
  }

  return { mount: mount };
})();
