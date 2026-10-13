/* ==========================================================================
   NexaTech Training Platform — trainee experience
   Overview, zone walkthroughs (explore → PPE check → knowledge check),
   emergency scenarios, final assessment, records and certificate.
   ========================================================================== */
window.NxTrainee = (function () {
  "use strict";
  var K = window.NxCore, C = K.C, esc = K.esc;
  var app = { go: function () {} };
  var pano = null;
  var ui = { zone: null, step: "explore", ppeSel: {}, ppeResult: null, quiz: null, scenario: null, assess: null };

  function pill(status, label) {
    return '<span class="pill-status ' + status + '">' + esc(label) + '</span>';
  }
  function ring(pct) {
    var c = 2 * Math.PI * 52, off = c * (1 - pct / 100);
    return '<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="' + pct + ' percent of the programme complete">' +
      '<circle class="ring-bg" cx="60" cy="60" r="52"/>' +
      '<circle class="ring-fg" cx="60" cy="60" r="52" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
      '<text x="60" y="68" text-anchor="middle">' + pct + '%</text></svg>';
  }
  function bar(pct) { return '<div class="bar" aria-hidden="true"><i style="width:' + pct + '%"></i></div>'; }
  function destroyPano() { if (pano) { pano.destroy(); pano = null; } }

  /* ---------------------------------------------------------------- overview */
  function firstOpenStep(z, u) {
    var p = u.progress[z];
    return p.hotspotsSeen.length < 3 ? "explore" : !p.ppePassed ? "ppe" : "quiz";
  }
  function openNext(next) {
    var u = K.me();
    if (!next) { app.go("records"); return; }
    if (next.kind === "zone") { ui.zone = next.zone; ui.step = next.step; ui.quiz = null; ui.ppeResult = null; ui.ppeSel = {}; app.go("training"); }
    else if (next.kind === "scenario") { ui.scenario = null; app.go("emergency"); }
    else { ui.assess = null; app.go("assessment"); }
  }

  function overview(el) {
    var u = K.me(), pct = K.overallPercent(u), next = K.nextStep(u), zones = K.allZones();
    var path = "";
    C.ZONE_IDS.forEach(function (z, i) {
      var p = u.progress[z], st = K.zoneStatus(p);
      path += '<li><span class="path-num">' + (i + 1) + '</span><div class="path-body"><strong>' + esc(zones[z].zoneName) + '</strong><small>' + K.zoneSteps(p) + ' of 5 steps · about ' + zones[z].minutes + ' min</small>' + bar(K.zonePercent(p)) + '</div>' +
        pill(st, K.zoneStatusLabel(st)) + '<button class="btn btn-secondary btn-sm" data-act="openzone" data-zone="' + z + '">' + (st === "new" ? "Start" : st === "complete" ? "Review" : "Continue") + '</button></li>';
    });
    var es = K.emergencyPercent(u);
    path += '<li><span class="path-num">4</span><div class="path-body"><strong>Emergency procedures</strong><small>' + K.scenariosDone(u) + ' of 3 scenarios passed · about 10 min</small>' + bar(es) + '</div>' +
      pill(es === 100 ? "complete" : es > 0 ? "progress" : "new", es === 100 ? "Complete" : es > 0 ? "In progress" : "Not started") + '<button class="btn btn-secondary btn-sm" data-act="go" data-view="emergency">' + (es === 0 ? "Start" : "Open") + '</button></li>';
    path += '<li><span class="path-num">5</span><div class="path-body"><strong>Final assessment</strong><small>' + (u.final.passed ? "Passed with " + K.finalPercentScore(u) + "%" : K.prerequisitesMet(u) ? "Unlocked — pass mark " + K.store().settings.finalPassPercent + "%" : "Unlocks after steps 1–4") + '</small>' + bar(u.final.passed ? 100 : 0) + '</div>' +
      pill(u.final.passed ? "complete" : K.prerequisitesMet(u) ? "progress" : "locked", u.final.passed ? "Passed" : K.prerequisitesMet(u) ? "Ready" : "Locked") + '<button class="btn btn-secondary btn-sm" data-act="go" data-view="assessment">' + (K.prerequisitesMet(u) ? "Open" : "View") + '</button></li>';

    var badgeHtml = K.badges(u).map(function (b) {
      return '<div class="badge ' + (b.earned ? "earned" : "") + '" title="' + esc(b.desc) + '"><span aria-hidden="true">' + b.icon + '</span><b>' + esc(b.name) + '</b><small>' + (b.earned ? "Earned" : esc(b.desc)) + '</small></div>';
    }).join("");

    el.innerHTML =
      '<div class="card hero-card">' +
        '<div class="hero-ring">' + ring(pct) + '</div>' +
        '<div class="hero-copy"><p class="eyebrow">WELCOME BACK</p><h2>Hello, ' + esc(u.name.split(" ")[0]) + '</h2>' +
        (next ? '<p>Your next step is <strong>' + esc(next.text) + '</strong>.</p><button class="btn btn-primary" data-act="next">Continue training <span aria-hidden="true">→</span></button>'
              : '<p>You have completed the full programme. Your certificate is ready in <strong>My records</strong>.</p><button class="btn btn-primary" data-act="go" data-view="records">View my certificate <span aria-hidden="true">→</span></button>') +
        '</div>' +
        '<ul class="mini-stats"><li><b>' + K.zonesDone(u) + '/3</b><span>Zones complete</span></li><li><b>' + K.scenariosDone(u) + '/3</b><span>Scenarios passed</span></li><li><b>' + (u.final.passed ? K.finalPercentScore(u) + "%" : "—") + '</b><span>Final score</span></li></ul>' +
      '</div>' +
      '<div class="card"><h3>Your learning path</h3><ol class="path">' + path + '</ol></div>' +
      '<div class="card"><h3>Achievements</h3><div class="badges">' + badgeHtml + '</div></div>';
    el.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "next") openNext(K.nextStep(K.me()));
      if (act === "go") app.go(b.getAttribute("data-view"));
      if (act === "openzone") { var z = b.getAttribute("data-zone"); ui.zone = z; ui.step = firstOpenStep(z, K.me()); ui.quiz = null; ui.ppeResult = null; ui.ppeSel = {}; app.go("training"); }
    };
  }

  /* ---------------------------------------------------------------- training */
  function training(el) {
    destroyPano();
    var u = K.me();
    if (!ui.zone) zoneList(el, u); else zoneWalkthrough(el, u);
  }

  function zoneList(el, u) {
    var zones = K.allZones();
    var html = '<div class="card"><p class="eyebrow">TRAINEE LEARNING</p><h2>Choose a zone</h2><p>Each zone has three steps: explore the 360° scene, pass the PPE check, then complete the knowledge check. Work through the zones in any order.</p><div class="zone-grid">';
    C.ZONE_IDS.forEach(function (z) {
      var p = u.progress[z], st = K.zoneStatus(p);
      html += '<div class="zone-card ' + st + '"><div class="zone-art" aria-hidden="true">' + zones[z].emoji + '</div>' +
        '<div class="zone-top">' + pill(st, K.zoneStatusLabel(st)) + '<span class="muted">~' + zones[z].minutes + ' min</span></div>' +
        '<h3>' + esc(zones[z].zoneName) + '</h3><p>' + esc(C.ZONES[z].blurb) + '</p>' +
        '<ul class="step-dots"><li class="' + (p.hotspotsSeen.length >= 3 ? "done" : "") + '">Explore</li><li class="' + (p.ppePassed ? "done" : "") + '">PPE</li><li class="' + (p.quizPassed ? "done" : "") + '">Quiz</li></ul>' +
        bar(K.zonePercent(p)) +
        '<button class="btn btn-primary" data-act="openzone" data-zone="' + z + '">' + (st === "new" ? "Start zone" : st === "complete" ? "Review zone" : "Continue zone") + '</button></div>';
    });
    html += '</div></div>';
    el.innerHTML = html;
    el.onclick = function (e) {
      var b = e.target.closest("[data-act='openzone']"); if (!b) return;
      var z = b.getAttribute("data-zone"); ui.zone = z; ui.step = firstOpenStep(z, K.me()); ui.quiz = null; ui.ppeResult = null; ui.ppeSel = {};
      training(el);
    };
  }

  function maybeComplete(u, z) {
    var p = u.progress[z];
    if (!p.complete && p.hotspotsSeen.length >= 3 && p.ppePassed && p.quizPassed) {
      p.complete = true; p.completedAt = new Date().toISOString();
      K.audit("Zone completed", K.getZone(z).zoneName);
      K.save();
      K.toast(K.getZone(z).zoneName + " complete 🎉", "good");
      return true;
    }
    return false;
  }

  function stepper(u, z) {
    var p = u.progress[z];
    var steps = [
      { id: "explore", n: 1, label: "Explore", done: p.hotspotsSeen.length >= 3, locked: false },
      { id: "ppe", n: 2, label: "PPE check", done: p.ppePassed, locked: p.hotspotsSeen.length < 3 },
      { id: "quiz", n: 3, label: "Knowledge check", done: p.quizPassed, locked: !p.ppePassed }
    ];
    return '<ol class="stepper" aria-label="Zone steps">' + steps.map(function (s) {
      return '<li><button type="button" class="step ' + (ui.step === s.id ? "active " : "") + (s.done ? "done " : "") + (s.locked ? "locked" : "") + '" data-act="step" data-step="' + s.id + '"' + (s.locked ? ' disabled aria-disabled="true"' : "") + (ui.step === s.id ? ' aria-current="step"' : "") + '><span>' + (s.done ? "✓" : s.n) + '</span>' + s.label + '</button></li>';
    }).join("") + '</ol>';
  }

  function zoneWalkthrough(el, u) {
    var z = ui.zone, zone = K.getZone(z), p = u.progress[z];
    var head = '<div class="card"><p class="eyebrow">TRAINEE LEARNING</p><p><a href="#" data-act="back">← All zones</a></p><h2>' + esc(zone.zoneName) + ' safety induction</h2>' + stepper(u, z);
    if (p.complete) {
      var nx = K.nextStep(u);
      head += '<div class="banner good" role="status"><strong>Zone complete</strong> — finished ' + esc(K.fmtDate(p.completedAt)) + '. You can revisit any step to refresh your knowledge. ' + (nx ? '<button class="btn btn-primary btn-sm" data-act="next">Next: ' + esc(nx.text) + ' →</button>' : '') + '</div>';
    }
    head += '<div id="stepBody"></div></div>';
    el.innerHTML = head;
    var body = el.querySelector("#stepBody");
    if (ui.step === "explore") stepExplore(body, u, z, zone);
    else if (ui.step === "ppe") stepPpe(body, u, z, zone);
    else stepQuiz(body, u, z, zone);

    el.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "back") { e.preventDefault(); ui.zone = null; training(el); }
      if (act === "step") { ui.step = b.getAttribute("data-step"); ui.quiz = null; ui.retake = false; ui.ppeResult = null; training(el); }
      if (act === "next") openNext(K.nextStep(K.me()));
    };
  }

  /* Step 1: explore */
  function stepExplore(body, u, z, zone) {
    var p = u.progress[z];
    body.innerHTML =
      '<p>Look around the ' + esc(zone.zoneName) + ' by dragging the scene, using the arrows, or the marker list. Select every numbered marker to learn about each hazard.</p>' +
      '<div id="panoHost"></div>' +
      '<div class="hotspot-info" id="hsInfo" aria-live="polite"><strong>Select a marker</strong><p>Learn about each hazard before moving on to the PPE check.</p></div>' +
      '<div class="step-foot"><p id="exploreProgress" class="muted"></p><button class="btn btn-primary" id="toPpe" data-act="gotoppe">Continue to PPE check <span aria-hidden="true">→</span></button></div>';
    var info = body.querySelector("#hsInfo"), prog = body.querySelector("#exploreProgress"), toPpe = body.querySelector("#toPpe");
    function refresh() {
      var n = Math.min(p.hotspotsSeen.length, 3);
      prog.textContent = n + " of 3 hazard markers viewed";
      toPpe.disabled = n < 3;
    }
    var wasDone = p.hotspotsSeen.length >= 3;
    pano = window.NexaScenes.mount(body.querySelector("#panoHost"), z, zone, p.hotspotsSeen, function (key) {
      var h = zone.hotspots[key]; if (!h) return;
      info.innerHTML = "<strong>" + esc(h.title) + "</strong><p>" + esc(h.body) + "</p>";
      if (p.hotspotsSeen.indexOf(key) === -1) {
        p.hotspotsSeen.push(key); K.touch(u); K.save();
        pano.markSeen(p.hotspotsSeen);
        if (!wasDone && p.hotspotsSeen.length >= 3) { wasDone = true; K.toast("All hazards found — PPE check unlocked", "good"); }
      }
      refresh();
      var st = document.querySelector(".stepper"); if (st) { var tmp = document.createElement("div"); tmp.innerHTML = stepper(u, z); st.replaceWith(tmp.firstChild); }
    });
    refresh();
    body.onclick = function (e) {
      if (e.target.closest("#toPpe") && !toPpe.disabled) { ui.step = "ppe"; ui.ppeResult = null; ui.ppeSel = {}; training(body.closest("section")); }
    };
  }

  /* Step 2: PPE check */
  function stepPpe(body, u, z, zone) {
    var p = u.progress[z], def = C.ZONES[z], res = ui.ppeResult;
    var items = Object.keys(C.PPE_ITEMS).map(function (k) {
      var it = C.PPE_ITEMS[k], on = !!ui.ppeSel[k];
      var cls = "ppe-item" + (on ? " on" : "");
      if (res) { var req = def.ppeRequired.indexOf(k) !== -1; if (req && on) cls += " right"; else if (req && !on) cls += " missed"; else if (!req && on) cls += " wrong"; }
      return '<button type="button" class="' + cls + '" data-act="ppe" data-item="' + k + '" aria-pressed="' + on + '"' + (res && res.pass ? " disabled" : "") + '><span class="ppe-icon" aria-hidden="true">' + it.icon + '</span><span>' + esc(it.label) + '</span></button>';
    }).join("");
    var fb = "";
    if (res) {
      fb = '<div class="banner ' + (res.pass ? "good" : "bad") + '" role="status"><strong>' + (res.pass ? "Correct PPE selected" : "Not quite right") + '</strong><ul class="plain">' +
        res.missing.map(function (k) { return "<li>❌ Missing: <b>" + esc(C.PPE_ITEMS[k].label) + "</b> — " + esc(C.PPE_ITEMS[k].why) + "</li>"; }).join("") +
        res.extra.map(function (k) { return "<li>⚠️ Not required here: <b>" + esc(C.PPE_ITEMS[k].label) + "</b> — " + esc(C.PPE_ITEMS[k].why) + "</li>"; }).join("") +
        (res.pass ? def.ppeRequired.map(function (k) { return "<li>✅ <b>" + esc(C.PPE_ITEMS[k].label) + "</b> — " + esc(C.PPE_ITEMS[k].why) + "</li>"; }).join("") : "") + '</ul></div>';
    }
    body.innerHTML =
      '<div class="task-card"><span aria-hidden="true">📋</span><div><strong>Your task</strong><p>' + esc(def.task) + '</p></div></div>' +
      '<p class="muted">Select every item you need — and only what you need. ' + (p.ppePassed ? "You have already passed this check; you can repeat it for practice." : "") + '</p>' +
      '<div class="ppe-grid">' + items + '</div>' + fb +
      '<div class="step-foot"><span class="muted">Attempts: ' + p.ppeAttempts + '</span>' +
      (res && res.pass ? '<button class="btn btn-primary" data-act="toquiz">Continue to knowledge check →</button>' : '<button class="btn btn-primary" data-act="checkppe">Check my PPE</button>') + '</div>';
    body.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "ppe") { if (res && res.pass) return; var k = b.getAttribute("data-item"); ui.ppeSel[k] = !ui.ppeSel[k]; ui.ppeResult = null; stepPpe(body, u, z, zone); }
      if (act === "checkppe") {
        var sel = Object.keys(ui.ppeSel).filter(function (k) { return ui.ppeSel[k]; });
        if (!sel.length) { K.toast("Select at least one item first", "warn"); return; }
        var missing = def.ppeRequired.filter(function (k) { return sel.indexOf(k) === -1; });
        var extra = sel.filter(function (k) { return def.ppeRequired.indexOf(k) === -1; });
        p.ppeAttempts++;
        var pass = !missing.length && !extra.length;
        if (pass) { p.ppePassed = true; }
        K.touch(u); K.save();
        ui.ppeResult = { pass: pass, missing: missing, extra: extra };
        stepPpe(body, u, z, zone);
        var st = document.querySelector(".stepper"); if (st) { var tmp = document.createElement("div"); tmp.innerHTML = stepper(u, z); st.replaceWith(tmp.firstChild); }
        maybeComplete(u, z);
      }
      if (act === "toquiz") { ui.step = "quiz"; ui.quiz = null; training(body.closest("section")); }
    };
  }

  /* Step 3: knowledge check */
  function stepQuiz(body, u, z, zone) {
    var p = u.progress[z];
    if (!ui.quiz) {
      if (p.quizPassed && !ui.retake) {
        body.innerHTML = '<div class="banner good"><strong>Knowledge check passed</strong> — best score ' + p.quizBest + ' of ' + zone.questions.length + ' after ' + p.quizAttempts + ' attempt' + (p.quizAttempts === 1 ? "" : "s") + '.</div>' +
          '<div class="step-foot"><span></span><button class="btn btn-secondary" data-act="startquiz">Retake for practice</button></div>';
      } else {
        body.innerHTML = '<p>Answer ' + zone.questions.length + ' scenario questions. You need <strong>' + C.PASS_MARK_ZONE + ' correct</strong> to pass, and you will see the explanation after each answer.</p>' +
          '<div class="step-foot"><span class="muted">Attempts: ' + p.quizAttempts + '</span><button class="btn btn-primary" data-act="startquiz">Start knowledge check</button></div>';
      }
      body.onclick = function (e) {
        if (!e.target.closest("[data-act='startquiz']")) return;
        ui.quiz = { idx: 0, score: 0, picked: null, order: zone.questions.map(function (q) { return K.shuffle(q.options.map(function (o, i) { return i; })); }), done: false };
        ui.retake = true;
        stepQuiz(body, u, z, zone);
      };
      return;
    }
    var qz = ui.quiz;
    if (qz.done) {
      var pass = qz.score >= C.PASS_MARK_ZONE;
      body.innerHTML = '<div class="banner ' + (pass ? "good" : "bad") + '" role="status"><strong>' + (pass ? "Knowledge check passed" : "Not passed this time") + '</strong> — you scored ' + qz.score + ' of ' + zone.questions.length + '. ' + (pass ? "" : "Review the explanations and the scene, then try again.") + '</div>' +
        '<div class="step-foot"><span></span>' + (pass ? '<button class="btn btn-primary" data-act="finish">Finish</button>' : '<button class="btn btn-secondary" data-act="explorerev">Review the scene</button><button class="btn btn-primary" data-act="startquiz">Try again</button>') + '</div>';
      body.onclick = function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        var act = b.getAttribute("data-act");
        if (act === "startquiz") { ui.quiz = { idx: 0, score: 0, picked: null, order: zone.questions.map(function (q) { return K.shuffle(q.options.map(function (o, i) { return i; })); }), done: false }; stepQuiz(body, u, z, zone); }
        if (act === "explorerev") { ui.step = "explore"; ui.quiz = null; ui.retake = false; training(body.closest("section")); }
        if (act === "finish") { ui.quiz = null; ui.retake = false; training(body.closest("section")); }
      };
      return;
    }
    var q = zone.questions[qz.idx], order = qz.order[qz.idx];
    var opts = order.map(function (oi) {
      var o = q.options[oi], cls = "answer";
      if (qz.picked !== null) { if (o.correct) cls += " right"; else if (qz.picked === oi) cls += " wrong"; }
      return '<button type="button" class="' + cls + '" data-act="answer" data-oi="' + oi + '"' + (qz.picked !== null ? " disabled" : "") + '>' + esc(o.text) + '</button>';
    }).join("");
    var fb = "";
    if (qz.picked !== null) {
      var ok = q.options[qz.picked].correct;
      fb = '<div class="banner ' + (ok ? "good" : "bad") + '" role="status"><strong>' + (ok ? "Correct" : "Not quite") + '</strong> — ' + esc(q.why || "") + '</div>' +
        '<div class="step-foot"><span></span><button class="btn btn-primary" data-act="nextq">' + (qz.idx === zone.questions.length - 1 ? "See result" : "Next question →") + '</button></div>';
    }
    body.innerHTML = '<p class="muted">Question ' + (qz.idx + 1) + ' of ' + zone.questions.length + '</p>' + bar(Math.round(qz.idx / zone.questions.length * 100)) +
      '<h3 class="q-text">' + esc(q.q) + '</h3><div class="answers">' + opts + '</div>' + fb;
    body.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "answer" && qz.picked === null) {
        qz.picked = parseInt(b.getAttribute("data-oi"), 10);
        if (q.options[qz.picked].correct) qz.score++;
        stepQuiz(body, u, z, zone);
      }
      if (act === "nextq") {
        if (qz.idx < zone.questions.length - 1) { qz.idx++; qz.picked = null; stepQuiz(body, u, z, zone); }
        else {
          qz.done = true;
          p.quizAttempts++; if (qz.score > p.quizBest) p.quizBest = qz.score;
          var passed = qz.score >= C.PASS_MARK_ZONE;
          if (passed) p.quizPassed = true;
          K.touch(u); K.save();
          stepQuiz(body, u, z, zone);
          var st = document.querySelector(".stepper"); if (st) { var tmp = document.createElement("div"); tmp.innerHTML = stepper(u, z); st.replaceWith(tmp.firstChild); }
          if (maybeComplete(u, z)) {
            var card = body.closest(".card"), banner = document.createElement("div");
            banner.className = "banner good"; banner.setAttribute("role", "status");
            banner.innerHTML = "<strong>Zone complete</strong> — well done! All three steps are finished.";
            card.insertBefore(banner, card.querySelector(".stepper").nextSibling);
          }
        }
      }
    };
  }

  /* --------------------------------------------------------------- emergency */
  function emergency(el) {
    var u = K.me();
    if (!ui.scenario) {
      var html = '<div class="card"><p class="eyebrow">EMERGENCY PROCEDURES</p><h2>Scenario simulations</h2><p>Make decisions in three realistic emergencies. Each scenario has three decisions worth up to 2 points each — you need <strong>4 of 6</strong> to pass. You can retry as often as you like.</p><div class="zone-grid">';
      C.SCENARIO_IDS.forEach(function (id) {
        var s = C.SCENARIOS[id], r = u.emergency[id];
        html += '<div class="zone-card ' + (r.passed ? "complete" : r.attempts ? "progress" : "new") + '"><div class="zone-art" aria-hidden="true">' + s.icon + '</div>' +
          '<div class="zone-top">' + pill(r.passed ? "complete" : r.attempts ? "progress" : "new", r.passed ? "Passed" : r.attempts ? "Retry needed" : "Not started") + '<span class="muted">' + (r.attempts ? "Best " + r.best + "/6" : "~3 min") + '</span></div>' +
          '<h3>' + esc(s.title) + '</h3><p>' + esc(s.intro) + '</p><button class="btn btn-primary" data-act="play" data-id="' + id + '">' + (r.attempts ? "Play again" : "Start scenario") + '</button></div>';
      });
      html += '</div></div>';
      el.innerHTML = html;
      el.onclick = function (e) {
        var b = e.target.closest("[data-act='play']"); if (!b) return;
        var id = b.getAttribute("data-id");
        ui.scenario = { id: id, stepId: C.SCENARIOS[id].start, n: 1, score: 0, picked: null, log: [], done: false, order: {} };
        emergency(el);
      };
      return;
    }
    var sc = ui.scenario, def = C.SCENARIOS[sc.id];
    if (sc.done) {
      var out = def.outcomes.filter(function (o) { return sc.score >= o.min; })[0];
      var pass = sc.score >= 4;
      el.innerHTML = '<div class="card"><p class="eyebrow">' + esc(def.title.toUpperCase()) + '</p><h2>' + esc(out.title) + '</h2>' +
        '<div class="banner ' + (pass ? "good" : "bad") + '" role="status"><strong>' + sc.score + ' of 6 points</strong> — ' + (pass ? "scenario passed." : "you need 4 to pass.") + ' ' + esc(out.text) + '</div>' +
        '<h3>Your decisions</h3><ol class="review">' + sc.log.map(function (l) { return '<li class="' + (l.score === 2 ? "ok" : l.score === 1 ? "mid" : "no") + '"><b>' + esc(l.situation) + '</b><br>You chose: ' + esc(l.choice) + '<br><em>' + esc(l.feedback) + '</em> <span class="pts">+' + l.score + '</span></li>'; }).join("") + '</ol>' +
        '<div class="step-foot"><button class="btn btn-secondary" data-act="list">All scenarios</button><button class="btn btn-primary" data-act="again">Try again</button></div></div>';
      el.onclick = function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        if (b.getAttribute("data-act") === "list") { ui.scenario = null; emergency(el); }
        if (b.getAttribute("data-act") === "again") { var id = sc.id; ui.scenario = { id: id, stepId: def.start, n: 1, score: 0, picked: null, log: [], done: false, order: {} }; emergency(el); }
      };
      return;
    }
    var step = def.steps[sc.stepId];
    if (!sc.order[sc.stepId]) sc.order[sc.stepId] = K.shuffle(step.options.map(function (o, i) { return i; }));
    var opts = sc.order[sc.stepId].map(function (oi) {
      var o = step.options[oi], cls = "answer";
      if (sc.picked !== null) { if (oi === sc.picked) cls += o.score === 2 ? " right" : o.score === 1 ? " mid" : " wrong"; else if (o.score === 2) cls += " right"; }
      return '<button type="button" class="' + cls + '" data-act="choose" data-oi="' + oi + '"' + (sc.picked !== null ? " disabled" : "") + '>' + esc(o.text) + '</button>';
    }).join("");
    var fb = "";
    if (sc.picked !== null) {
      var chosen = step.options[sc.picked];
      fb = '<div class="banner ' + (chosen.score === 2 ? "good" : chosen.score === 1 ? "warn" : "bad") + '" role="status"><strong>' + (chosen.score === 2 ? "Good decision (+2)" : chosen.score === 1 ? "Partly right (+1)" : "Risky choice (+0)") + '</strong> — ' + esc(chosen.feedback) + '</div>' +
        '<div class="step-foot"><span></span><button class="btn btn-primary" data-act="cont">' + (chosen.next === "end" ? "See outcome" : "Next decision →") + '</button></div>';
    }
    el.innerHTML = '<div class="card"><p class="eyebrow">' + def.icon + ' ' + esc(def.title.toUpperCase()) + '</p><p class="muted">Decision ' + sc.n + ' of 3 · Score so far ' + sc.score + '</p>' + bar(Math.round((sc.n - 1) / 3 * 100)) +
      '<div class="situation"><strong>Situation</strong><p>' + esc(step.text) + '</p></div><h3 class="q-text">What do you do?</h3><div class="answers">' + opts + '</div>' + fb +
      '<p><a href="#" data-act="quit">Leave this scenario</a></p></div>';
    el.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "quit") { e.preventDefault(); ui.scenario = null; emergency(el); }
      if (act === "choose" && sc.picked === null) {
        sc.picked = parseInt(b.getAttribute("data-oi"), 10);
        var o = step.options[sc.picked];
        sc.score += o.score; sc.log.push({ situation: step.text, choice: o.text, feedback: o.feedback, score: o.score });
        emergency(el);
      }
      if (act === "cont") {
        var o2 = step.options[sc.picked];
        if (o2.next === "end") {
          sc.done = true;
          var r = u.emergency[sc.id]; r.attempts++; if (sc.score > r.best) r.best = sc.score;
          if (sc.score >= 4 && !r.passed) { r.passed = true; r.passedAt = new Date().toISOString(); K.audit("Scenario passed", def.title + " (" + sc.score + "/6)"); K.toast("Scenario passed 🎉", "good"); }
          K.touch(u); K.save();
        } else { sc.stepId = o2.next; sc.n++; sc.picked = null; }
        emergency(el);
      }
    };
  }

  /* -------------------------------------------------------------- assessment */
  function assessment(el) {
    var u = K.me(), S = K.store().settings;
    if (!ui.assess) {
      if (!K.prerequisitesMet(u)) {
        var todo = [];
        C.ZONE_IDS.forEach(function (z) { if (!u.progress[z].complete) todo.push(K.getZone(z).zoneName + " zone"); });
        C.SCENARIO_IDS.forEach(function (s) { if (!u.emergency[s].passed) todo.push("Scenario: " + C.SCENARIOS[s].title); });
        el.innerHTML = '<div class="card"><p class="eyebrow">FINAL ASSESSMENT</p><h2>Locked — finish your training first</h2><p>The final assessment unlocks when all three zones and all three emergency scenarios are complete. Still to do:</p><ul class="todo">' + todo.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul><button class="btn btn-primary" data-act="next">Continue training →</button></div>';
        el.onclick = function (e) { if (e.target.closest("[data-act='next']")) openNext(K.nextStep(K.me())); };
        return;
      }
      el.innerHTML = '<div class="card"><p class="eyebrow">FINAL ASSESSMENT</p><h2>Show what you know</h2>' +
        '<p>' + S.finalQuestions + ' questions drawn at random from across the programme. There are no hints during the assessment; you will see the full review at the end. Pass mark: <strong>' + S.finalPassPercent + '%</strong>.</p>' +
        (u.final.attempts ? '<p class="muted">Attempts: ' + u.final.attempts + ' · Best score: ' + K.finalPercentScore(u) + '%' + (u.final.passed ? " · Passed " + K.fmtDate(u.final.passedAt) : "") + '</p>' : "") +
        (u.final.passed ? '<div class="banner good"><strong>You have passed.</strong> Your certificate (' + esc(u.final.certId) + ') is in <a href="#" data-act="records">My records</a>. You may retake the assessment to improve your score.</div>' : "") +
        '<button class="btn btn-primary" data-act="start">' + (u.final.attempts ? "Retake assessment" : "Start assessment") + '</button></div>';
      el.onclick = function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        if (b.getAttribute("data-act") === "records") { e.preventDefault(); app.go("records"); }
        if (b.getAttribute("data-act") === "start") {
          var pool = K.shuffle(K.questionPool()).slice(0, Math.min(S.finalQuestions, K.questionPool().length));
          ui.assess = { idx: 0, picked: null, done: false, qs: pool.map(function (q) { return { q: q, order: K.shuffle(q.options.map(function (o, i) { return i; })), chosen: null }; }) };
          assessment(el);
        }
      };
      return;
    }
    var A = ui.assess;
    if (A.done) {
      var correct = A.qs.filter(function (x) { return x.q.options[x.chosen].correct; }).length, max = A.qs.length, pct = Math.round(correct / max * 100), pass = pct >= S.finalPassPercent;
      el.innerHTML = '<div class="card"><p class="eyebrow">FINAL ASSESSMENT RESULT</p><h2>' + (pass ? "You passed 🎉" : "Not passed this time") + '</h2>' +
        '<div class="banner ' + (pass ? "good" : "bad") + '" role="status"><strong>' + correct + ' of ' + max + ' (' + pct + '%)</strong> — pass mark ' + S.finalPassPercent + '%. ' + (pass ? 'Your certificate is ready in My records.' : 'Review the answers below and try again.') + '</div>' +
        '<h3>Review</h3><ol class="review">' + A.qs.map(function (x) {
          var ok = x.q.options[x.chosen].correct, right = x.q.options.filter(function (o) { return o.correct; })[0];
          return '<li class="' + (ok ? "ok" : "no") + '"><b>' + esc(x.q.q) + '</b><br>Your answer: ' + esc(x.q.options[x.chosen].text) + (ok ? " ✓" : '<br>Correct answer: ' + esc(right.text)) + '<br><em>' + esc(x.q.why || "") + '</em></li>';
        }).join("") + '</ol>' +
        '<div class="step-foot"><button class="btn btn-secondary" data-act="home">Back to overview</button>' + (pass ? '<button class="btn btn-primary" data-act="records">View certificate</button>' : '<button class="btn btn-primary" data-act="retry">Retake assessment</button>') + '</div></div>';
      el.onclick = function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return;
        var act = b.getAttribute("data-act");
        if (act === "home") { ui.assess = null; app.go("overview"); }
        if (act === "records") { ui.assess = null; app.go("records"); }
        if (act === "retry") { ui.assess = null; assessment(el); }
      };
      return;
    }
    var item = A.qs[A.idx], q = item.q;
    var opts = item.order.map(function (oi) {
      return '<button type="button" class="answer' + (item.chosen === oi ? " picked" : "") + '" data-act="pick" data-oi="' + oi + '" aria-pressed="' + (item.chosen === oi) + '">' + esc(q.options[oi].text) + '</button>';
    }).join("");
    el.innerHTML = '<div class="card"><p class="eyebrow">FINAL ASSESSMENT</p><p class="muted">Question ' + (A.idx + 1) + ' of ' + A.qs.length + '</p>' + bar(Math.round(A.idx / A.qs.length * 100)) +
      '<h3 class="q-text">' + esc(q.q) + '</h3><div class="answers">' + opts + '</div>' +
      '<div class="step-foot"><button class="btn btn-secondary" data-act="prev"' + (A.idx === 0 ? " disabled" : "") + '>← Back</button><button class="btn btn-primary" data-act="next"' + (item.chosen === null ? " disabled" : "") + '>' + (A.idx === A.qs.length - 1 ? "Submit assessment" : "Next →") + '</button></div></div>';
    el.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
      var act = b.getAttribute("data-act");
      if (act === "pick") { item.chosen = parseInt(b.getAttribute("data-oi"), 10); assessment(el); }
      if (act === "prev" && A.idx > 0) { A.idx--; assessment(el); }
      if (act === "next") {
        if (A.idx < A.qs.length - 1) { A.idx++; assessment(el); }
        else {
          var correct2 = A.qs.filter(function (x) { return x.q.options[x.chosen].correct; }).length, max2 = A.qs.length, pct2 = Math.round(correct2 / max2 * 100);
          var f = u.final; f.attempts++; f.history = (f.history || []).concat([{ t: new Date().toISOString(), score: correct2, max: max2 }]).slice(-10);
          if (!f.bestMax || correct2 / max2 > f.best / f.bestMax) { f.best = correct2; f.bestMax = max2; }
          var passed = pct2 >= S.finalPassPercent;
          if (passed && !f.passed) { f.passed = true; f.passedAt = new Date().toISOString(); f.certId = K.makeCertId(u); K.audit("Final assessment passed", pct2 + "% — certificate " + f.certId); K.toast("Final assessment passed 🏅", "good"); }
          else if (!passed) { K.audit("Final assessment attempt", pct2 + "% (not passed)"); }
          K.touch(u); K.save();
          A.done = true; assessment(el);
        }
      }
    };
  }

  /* ----------------------------------------------------------------- records */
  function printHtml(html) {
    var f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(f);
    f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(function () { f.remove(); }, 2000); }, 300);
  }
  var LOGO_SVG = '<svg viewBox="0 0 100 100" width="56" height="56"><polygon points="50,3 93,26 93,74 50,97 7,74 7,26" fill="none" stroke="#1B3FB8" stroke-width="6"/><path d="M32 71 L32 29 L43 29 L64 60 L64 29 L75 29 L75 71 L64 71 L43 40 L43 71 Z" fill="#1B3FB8"/></svg>';

  function certificateHtml(u) {
    var zones = K.allZones();
    var rows = C.ZONE_IDS.map(function (z) { return "<tr><td>" + esc(zones[z].zoneName) + " zone</td><td>" + K.fmtDate(u.progress[z].completedAt) + "</td><td>Quiz " + u.progress[z].quizBest + "/3</td></tr>"; }).join("") +
      C.SCENARIO_IDS.map(function (s) { return "<tr><td>Emergency: " + esc(C.SCENARIOS[s].title) + "</td><td>" + K.fmtDate(u.emergency[s].passedAt) + "</td><td>Score " + u.emergency[s].best + "/6</td></tr>"; }).join("") +
      "<tr><td><b>Final assessment</b></td><td>" + K.fmtDate(u.final.passedAt) + "</td><td><b>" + K.finalPercentScore(u) + "%</b></td></tr>";
    return '<!doctype html><html><head><meta charset="utf-8"><title>Certificate — ' + esc(u.name) + '</title><style>' +
      '@page{size:A4 landscape;margin:0}body{margin:0;font-family:Georgia,"Times New Roman",serif;color:#0A1930;background:#fff}' +
      '.sheet{box-sizing:border-box;width:297mm;height:210mm;padding:12mm}.frame{height:100%;border:3px solid #0A1930;padding:5px;box-sizing:border-box}.inner{height:100%;border:1px solid #FFB020;box-sizing:border-box;text-align:center;padding:10mm 16mm;display:flex;flex-direction:column;justify-content:space-between}' +
      'h1{font-size:13pt;letter-spacing:.35em;text-transform:uppercase;color:#48536B;margin:6px 0 0;font-weight:400}h2{font-size:34pt;margin:4px 0;font-weight:700}.sub{font-size:12pt;color:#48536B;margin:0}' +
      'table{margin:8px auto;border-collapse:collapse;font-size:10pt;min-width:60%}td{padding:3px 14px;border-bottom:1px solid #DCE2EE;text-align:left}' +
      '.row{display:flex;justify-content:space-between;align-items:flex-end;font-size:10pt}.sig{border-top:1px solid #0A1930;width:200px;padding-top:4px;color:#48536B}.id{font-family:Consolas,monospace;font-size:11pt}' +
      '.note{font-size:8pt;color:#8592A6}</style></head><body><div class="sheet"><div class="frame"><div class="inner">' +
      '<div>' + LOGO_SVG + '<h1>Certificate of Completion</h1></div>' +
      '<div><p class="sub">This certifies that</p><h2>' + esc(u.name) + '</h2><p class="sub">has successfully completed the Warehouse Safety Training programme, including hazard-zone induction, PPE checks, emergency procedures and the final assessment.</p>' +
      '<table>' + rows + '</table></div>' +
      '<div class="row"><div class="sig">Site safety officer</div><div class="id">Certificate ID: <b>' + esc(u.final.certId) + '</b><br>Issued: ' + K.fmtDate(u.final.passedAt) + '</div><div class="sig">Training administrator</div></div>' +
      '<p class="note">Issued by the NexaTech Training Platform prototype. For demonstration only — not a recognised qualification. Verify this ID on the platform sign-in page.</p>' +
      '</div></div></div></body></html>';
  }
  function statementHtml(u) {
    var zones = K.allZones();
    var rows = C.ZONE_IDS.map(function (z) { var p = u.progress[z]; return "<tr><td>" + esc(zones[z].zoneName) + "</td><td>" + K.zonePercent(p) + "%</td><td>" + K.zoneStatusLabel(K.zoneStatus(p)) + "</td><td>" + p.quizBest + "/3</td><td>" + K.fmtDate(p.completedAt) + "</td></tr>"; }).join("") +
      C.SCENARIO_IDS.map(function (s) { var r = u.emergency[s]; return "<tr><td>Scenario: " + esc(C.SCENARIOS[s].title) + "</td><td>" + (r.passed ? "100%" : "0%") + "</td><td>" + (r.passed ? "Passed" : r.attempts ? "Retry needed" : "Not started") + "</td><td>" + (r.attempts ? r.best + "/6" : "—") + "</td><td>" + K.fmtDate(r.passedAt) + "</td></tr>"; }).join("") +
      "<tr><td>Final assessment</td><td>" + (u.final.passed ? "100%" : "0%") + "</td><td>" + (u.final.passed ? "Passed" : u.final.attempts ? "Not passed" : "Not started") + "</td><td>" + (u.final.attempts ? K.finalPercentScore(u) + "%" : "—") + "</td><td>" + K.fmtDate(u.final.passedAt) + "</td></tr>";
    return '<!doctype html><html><head><meta charset="utf-8"><title>Training statement — ' + esc(u.name) + '</title><style>body{font-family:Arial,sans-serif;color:#0A1930;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #DCE2EE;padding:8px;text-align:left;font-size:13px}th{background:#EDF1F9}h1{margin:0}p{color:#48536B}</style></head><body>' + LOGO_SVG +
      '<h1>Training statement</h1><p><b>' + esc(u.name) + '</b> · overall progress ' + K.overallPercent(u) + '% · generated ' + K.fmtDate(new Date().toISOString()) + '</p><table><thead><tr><th>Module</th><th>Progress</th><th>Status</th><th>Best score</th><th>Completed</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p style="margin-top:16px;font-size:12px">Prototype record generated on this device. Not a compliance record.</p></body></html>';
  }

  function records(el) {
    var u = K.me(), zones = K.allZones();
    var rows = "";
    C.ZONE_IDS.forEach(function (z) {
      var p = u.progress[z], st = K.zoneStatus(p);
      rows += '<tr><td>' + esc(zones[z].zoneName) + '</td><td>Zone</td><td>' + K.zonePercent(p) + '%</td><td>' + pill(st, K.zoneStatusLabel(st)) + '</td><td>' + (p.quizAttempts ? "Quiz " + p.quizBest + "/3" : "—") + '</td><td>' + K.fmtDate(p.completedAt) + '</td></tr>';
    });
    C.SCENARIO_IDS.forEach(function (s) {
      var r = u.emergency[s];
      rows += '<tr><td>' + esc(C.SCENARIOS[s].title) + '</td><td>Emergency</td><td>' + (r.passed ? "100%" : "0%") + '</td><td>' + pill(r.passed ? "complete" : r.attempts ? "progress" : "new", r.passed ? "Passed" : r.attempts ? "Retry needed" : "Not started") + '</td><td>' + (r.attempts ? "Best " + r.best + "/6" : "—") + '</td><td>' + K.fmtDate(r.passedAt) + '</td></tr>';
    });
    rows += '<tr><td>Final assessment</td><td>Assessment</td><td>' + (u.final.passed ? "100%" : "0%") + '</td><td>' + pill(u.final.passed ? "complete" : u.final.attempts ? "progress" : "new", u.final.passed ? "Passed" : u.final.attempts ? "Not passed" : "Not started") + '</td><td>' + (u.final.attempts ? K.finalPercentScore(u) + "% (" + u.final.attempts + " attempt" + (u.final.attempts === 1 ? "" : "s") + ")" : "—") + '</td><td>' + K.fmtDate(u.final.passedAt) + '</td></tr>';
    var cert = K.certified(u);
    el.innerHTML = '<div class="card"><p class="eyebrow">MY RECORDS</p><h2>Training evidence</h2>' +
      '<div class="banner ' + (cert ? "good" : "info") + '">' + (cert ? '<strong>Certified</strong> — certificate ID <span class="mono">' + esc(u.final.certId) + '</span>, issued ' + K.fmtDate(u.final.passedAt) + '.' : 'Your certificate unlocks when you pass the final assessment. Overall progress: <strong>' + K.overallPercent(u) + '%</strong>.') + '</div>' +
      '<div class="table-scroll"><table class="data"><thead><tr><th>Module</th><th>Type</th><th>Progress</th><th>Status</th><th>Score</th><th>Completed</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="btn-row"><button class="btn btn-primary" data-act="cert"' + (cert ? "" : " disabled") + '>Print certificate</button><button class="btn btn-secondary" data-act="statement">Print training statement</button><button class="btn btn-secondary" data-act="download">Download my record (JSON)</button></div></div>';
    el.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
      var act = b.getAttribute("data-act");
      if (act === "cert") { K.audit("Certificate printed", u.final.certId); K.save(); printHtml(certificateHtml(u)); }
      if (act === "statement") printHtml(statementHtml(u));
      if (act === "download") {
        var safe = u.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "trainee";
        K.downloadBlob(safe + "-learning-record.json", JSON.stringify({ exportedAt: new Date().toISOString(), platform: "NexaTech Training Platform (prototype)", trainee: u.name, overallProgress: K.overallPercent(u) + "%", certified: cert, certificateId: u.final.certId, zones: u.progress, emergency: u.emergency, finalAssessment: u.final }, null, 2), "application/json");
      }
    };
  }

  return {
    init: function (a) { app = a; },
    overview: overview, training: function (el) { training(el); }, emergency: emergency, assessment: assessment, records: records,
    leave: function () { destroyPano(); },
    resetUi: function () { ui = { retake: false, zone: null, step: "explore", ppeSel: {}, ppeResult: null, quiz: null, scenario: null, assess: null }; destroyPano(); },
    navReset: function (view) {
      if (view === "training") { ui.zone = null; ui.quiz = null; ui.retake = false; }
      if (view === "emergency") ui.scenario = null;
      if (view === "assessment" && ui.assess && ui.assess.done) ui.assess = null;
    }
  };
})();
