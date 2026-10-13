/* ==========================================================================
   NexaTech Training Platform — supervisor, administrator, safety guide and
   hazard reporting views.
   ========================================================================== */
window.NxStaff = (function () {
  "use strict";
  var K = window.NxCore, C = K.C, esc = K.esc;
  var app = { go: function () {} };
  var sv = { tab: "progress", q: "", status: "all", open: {}, rstatus: "all" };
  var ad = { tab: "content", zone: C.ZONE_IDS[0] };

  function pill(status, label) { return '<span class="pill-status ' + status + '">' + esc(label) + '</span>'; }
  function bar(pct) { return '<div class="bar" aria-hidden="true"><i style="width:' + pct + '%"></i></div>'; }
  function tabs(list, current, attr) {
    return '<div class="tabs" role="tablist">' + list.map(function (t) {
      return '<button type="button" role="tab" class="tab' + (t[0] === current ? " active" : "") + '" aria-selected="' + (t[0] === current) + '" data-act="' + attr + '" data-tab="' + t[0] + '">' + esc(t[1]) + '</button>';
    }).join("") + '</div>';
  }
  function zoneLabel(id) { return id === "general" ? "General / other area" : (C.ZONES[id] ? K.getZone(id).zoneName : id); }

  /* ------------------------------------------------------------ attention flag */
  function needsAttention(u) {
    if (K.certified(u)) return false;
    var d = K.daysSince(u.lastActive);
    return d === null ? true : d >= 7;
  }

  /* --------------------------------------------------------------- supervisor */
  function supervisor(el) {
    var openReports = K.store().reports.filter(function (r) { return r.status === "open"; }).length;
    el.innerHTML = '<div class="card"><p class="eyebrow">SUPERVISOR VIEW</p><h2>Team training dashboard</h2>' +
      '<p class="muted">Sample trainees are shown alongside any accounts created on this device. In production this would show only people in your team, loaded securely from a server.</p>' +
      tabs([["progress", "Team progress"], ["reports", "Hazard reports" + (openReports ? " (" + openReports + " open)" : "")]], sv.tab, "svtab") + '<div id="svBody"></div></div>';
    el.onclick = function (e) {
      var b = e.target.closest("[data-act='svtab']"); if (!b) return;
      sv.tab = b.getAttribute("data-tab"); supervisor(el);
    };
    var body = el.querySelector("#svBody");
    if (sv.tab === "progress") svProgress(body); else svReports(body);
  }

  function matchRows() {
    var q = sv.q.trim().toLowerCase();
    return K.trainees().filter(function (u) {
      if (q && u.name.toLowerCase().indexOf(q) === -1) return false;
      var st = K.overallStatus(u);
      if (sv.status === "complete") return st === "complete";
      if (sv.status === "progress") return st === "progress";
      if (sv.status === "new") return st === "new";
      if (sv.status === "attention") return needsAttention(u);
      return true;
    });
  }

  function svProgress(body) {
    var all = K.trainees(), n = all.length;
    var cert = all.filter(K.certified).length, prog = all.filter(function (u) { return K.overallStatus(u) === "progress"; }).length, fresh = all.filter(function (u) { return K.overallStatus(u) === "new"; }).length;
    var avg = n ? Math.round(all.reduce(function (s, u) { return s + K.overallPercent(u); }, 0) / n) : 0;
    var attn = all.filter(needsAttention).length;
    var finals = all.filter(function (u) { return u.final.attempts; });
    var avgFinal = finals.length ? Math.round(finals.reduce(function (s, u) { return s + K.finalPercentScore(u); }, 0) / finals.length) : null;
    var modules = C.ZONE_IDS.map(function (z) { return [K.getZone(z).zoneName, n ? Math.round(all.filter(function (u) { return u.progress[z].complete; }).length / n * 100) : 0]; });
    modules.push(["Emergency procedures", n ? Math.round(all.filter(function (u) { return K.scenariosDone(u) === 3; }).length / n * 100) : 0]);
    modules.push(["Final assessment", n ? Math.round(all.filter(function (u) { return u.final.passed; }).length / n * 100) : 0]);

    body.innerHTML =
      '<div class="tiles">' +
        '<div class="tile"><b>' + n + '</b><span>Trainees</span></div>' +
        '<div class="tile good"><b>' + cert + '</b><span>Certified</span></div>' +
        '<div class="tile"><b>' + prog + '</b><span>In progress</span></div>' +
        '<div class="tile"><b>' + fresh + '</b><span>Not started</span></div>' +
        '<div class="tile ' + (attn ? "warn" : "") + '"><b>' + attn + '</b><span>Need attention</span></div>' +
        '<div class="tile"><b>' + avg + '%</b><span>Average progress</span></div>' +
        '<div class="tile"><b>' + (avgFinal === null ? "—" : avgFinal + "%") + '</b><span>Average final score</span></div>' +
      '</div>' +
      '<h3>Completion by module</h3><div class="module-bars">' + modules.map(function (m) { return '<div class="mbar"><span>' + esc(m[0]) + '</span>' + bar(m[1]) + '<b>' + m[1] + '%</b></div>'; }).join("") + '</div>' +
      '<div class="toolbar"><label class="sr-only" for="svSearch">Search trainees</label><input type="search" id="svSearch" placeholder="Search by name" value="' + esc(sv.q) + '">' +
      '<label class="sr-only" for="svStatus">Filter by status</label><select id="svStatus">' + [["all", "All trainees"], ["complete", "Certified"], ["progress", "In progress"], ["new", "Not started"], ["attention", "Needs attention"]].map(function (o) { return '<option value="' + o[0] + '"' + (sv.status === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select>' +
      '<span class="spacer"></span><button class="btn btn-secondary btn-sm" data-act="remind">Copy reminder list</button><button class="btn btn-secondary btn-sm" data-act="csv">Export CSV</button></div>' +
      '<div class="table-scroll"><table class="data"><thead><tr><th>Trainee</th><th>Overall</th><th>Zones</th><th>Emergency</th><th>Final</th><th>Last active</th><th>Status</th><th><span class="sr-only">Details</span></th></tr></thead><tbody id="svRows"></tbody></table></div>';

    function rows() {
      var list = matchRows(), zones = K.allZones(), html = "";
      list.forEach(function (u) {
        var key = K.userKey(u.name), st = K.overallStatus(u), pct = K.overallPercent(u), d = K.daysSince(u.lastActive), attnFlag = needsAttention(u);
        html += '<tr><td><strong>' + esc(u.name) + '</strong>' + (u.sample ? ' <span class="tag-sample">sample</span>' : "") + '</td>' +
          '<td class="w-overall"><div class="inline-bar">' + bar(pct) + '<b>' + pct + '%</b></div></td>' +
          '<td>' + C.ZONE_IDS.map(function (z) { return '<span class="dot ' + K.zoneStatus(u.progress[z]) + '" title="' + esc(zones[z].zoneName + ": " + K.zoneStatusLabel(K.zoneStatus(u.progress[z]))) + '"></span>'; }).join("") + '</td>' +
          '<td>' + K.scenariosDone(u) + '/3</td><td>' + (u.final.attempts ? K.finalPercentScore(u) + "%" : "—") + '</td>' +
          '<td>' + (d === null ? "Never" : d === 0 ? "Today" : d + " day" + (d === 1 ? "" : "s") + " ago") + '</td>' +
          '<td>' + pill(st, K.statusLabel(st)) + (attnFlag ? ' <span class="pill-status warn">Needs attention</span>' : "") + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" data-act="detail" data-key="' + esc(key) + '" aria-expanded="' + !!sv.open[key] + '">' + (sv.open[key] ? "Hide" : "Details") + '</button></td></tr>';
        if (sv.open[key]) {
          html += '<tr class="detail-row"><td colspan="8"><div class="detail-grid">' +
            C.ZONE_IDS.map(function (z) { var p = u.progress[z]; return '<div><b>' + esc(zones[z].zoneName) + '</b><br>Hazards ' + Math.min(p.hotspotsSeen.length, 3) + '/3 · PPE ' + (p.ppePassed ? "passed" : "not yet") + ' (' + p.ppeAttempts + ' attempt' + (p.ppeAttempts === 1 ? "" : "s") + ')<br>Quiz ' + (p.quizAttempts ? "best " + p.quizBest + "/3 (" + p.quizAttempts + " attempt" + (p.quizAttempts === 1 ? "" : "s") + ")" : "not attempted") + '<br>Completed ' + K.fmtDate(p.completedAt) + '</div>'; }).join("") +
            '<div><b>Emergency scenarios</b><br>' + C.SCENARIO_IDS.map(function (s) { var r = u.emergency[s]; return esc(C.SCENARIOS[s].title) + ': ' + (r.attempts ? (r.passed ? "passed" : "not passed") + " (best " + r.best + "/6)" : "not attempted"); }).join("<br>") + '</div>' +
            '<div><b>Final assessment</b><br>' + (u.final.attempts ? "Best " + K.finalPercentScore(u) + "% after " + u.final.attempts + " attempt" + (u.final.attempts === 1 ? "" : "s") : "Not attempted") + (u.final.certId ? '<br>Certificate ' + esc(u.final.certId) : "") + '</div></div></td></tr>';
        }
      });
      body.querySelector("#svRows").innerHTML = html || '<tr><td colspan="8" class="muted">No trainees match this filter.</td></tr>';
    }
    rows();

    body.querySelector("#svSearch").addEventListener("input", function (e) { sv.q = e.target.value; rows(); });
    body.querySelector("#svStatus").addEventListener("change", function (e) { sv.status = e.target.value; rows(); });
    body.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "detail") { var k = b.getAttribute("data-key"); sv.open[k] = !sv.open[k]; rows(); }
      if (act === "csv") exportCsv();
      if (act === "remind") {
        var names = all.filter(function (u) { return !K.certified(u); }).map(function (u) { return "- " + u.name + " (" + K.overallPercent(u) + "% complete)"; });
        var text = "Reminder: please finish your warehouse safety training.\n\nOutstanding:\n" + (names.join("\n") || "(none)");
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { K.toast("Reminder list copied", "good"); }, function () { K.toast("Copy not available in this browser", "warn"); });
        else K.toast("Copy not available in this browser", "warn");
      }
    };
  }

  function exportCsv() {
    var zones = K.allZones(), head = ["Trainee", "Overall %", "Status"].concat(C.ZONE_IDS.map(function (z) { return zones[z].zoneName + " status"; }), C.ZONE_IDS.map(function (z) { return zones[z].zoneName + " quiz best"; }), C.SCENARIO_IDS.map(function (s) { return "Scenario: " + C.SCENARIOS[s].title + " best"; }), ["Final %", "Final attempts", "Certificate ID", "Last active"]);
    var lines = [head.map(K.csvCell).join(",")];
    K.trainees().forEach(function (u) {
      var row = [u.name, K.overallPercent(u), K.statusLabel(K.overallStatus(u))]
        .concat(C.ZONE_IDS.map(function (z) { return K.zoneStatusLabel(K.zoneStatus(u.progress[z])); }), C.ZONE_IDS.map(function (z) { return u.progress[z].quizAttempts ? u.progress[z].quizBest + "/3" : ""; }), C.SCENARIO_IDS.map(function (s) { return u.emergency[s].attempts ? u.emergency[s].best + "/6" : ""; }),
          [u.final.attempts ? K.finalPercentScore(u) : "", u.final.attempts, u.final.certId || "", u.lastActive ? K.fmtDate(u.lastActive) : ""]);
      lines.push(row.map(K.csvCell).join(","));
    });
    K.downloadBlob("training-completion.csv", lines.join("\n"), "text/csv");
    K.audit("Export", "Training completion CSV"); K.save();
  }

  function svReports(body) {
    var list = K.store().reports.filter(function (r) { return sv.rstatus === "all" || r.status === sv.rstatus; });
    body.innerHTML = '<div class="toolbar"><label class="sr-only" for="rsFilter">Filter reports</label><select id="rsFilter">' + [["all", "All reports"], ["open", "Open"], ["closed", "Closed"]].map(function (o) { return '<option value="' + o[0] + '"' + (sv.rstatus === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select><span class="spacer"></span><button class="btn btn-secondary btn-sm" data-act="rcsv">Export CSV</button></div>' +
      '<div class="table-scroll"><table class="data"><thead><tr><th>ID</th><th>Date</th><th>Reported by</th><th>Area</th><th>Type</th><th>Severity</th><th>Description</th><th>Status</th></tr></thead><tbody>' +
      (list.length ? list.map(function (r) {
        return '<tr><td class="mono">' + esc(r.id) + '</td><td>' + K.fmtDate(r.t) + '</td><td>' + esc(r.by) + '</td><td>' + esc(zoneLabel(r.zone)) + '</td><td>' + esc(r.type) + '</td><td>' + pill(r.severity === "High" ? "bad" : r.severity === "Medium" ? "warn" : "new", r.severity) + '</td><td class="desc">' + esc(r.desc) + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" data-act="toggle" data-id="' + esc(r.id) + '">' + (r.status === "open" ? "Open — mark closed" : "Closed — reopen") + '</button></td></tr>';
      }).join("") : '<tr><td colspan="8" class="muted">No reports yet.</td></tr>') + '</tbody></table></div>';
    body.querySelector("#rsFilter").addEventListener("change", function (e) { sv.rstatus = e.target.value; svReports(body); });
    body.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "toggle") {
        var id = b.getAttribute("data-id"), r = K.store().reports.filter(function (x) { return x.id === id; })[0];
        if (r) { r.status = r.status === "open" ? "closed" : "open"; K.audit("Hazard report " + r.status, r.id); K.save(); K.toast(r.id + " marked " + r.status, "good"); svReports(body); }
      }
      if (act === "rcsv") {
        var lines = [["ID", "Date", "Reported by", "Area", "Type", "Severity", "Description", "Status"].join(",")];
        K.store().reports.forEach(function (r) { lines.push([r.id, K.fmtDate(r.t), r.by, zoneLabel(r.zone), r.type, r.severity, r.desc, r.status].map(K.csvCell).join(",")); });
        K.downloadBlob("hazard-reports.csv", lines.join("\n"), "text/csv");
      }
    };
  }

  /* ------------------------------------------------------------------- report */
  function report(el) {
    var u = K.me(), mine = K.store().reports.filter(function (r) { return r.by === u.name; });
    var zoneOpts = C.ZONE_IDS.map(function (z) { return '<option value="' + z + '">' + esc(K.getZone(z).zoneName) + '</option>'; }).join("") + '<option value="general">General / other area</option>';
    el.innerHTML = '<div class="card"><p class="eyebrow">SAFETY REPORTING</p><h2>Report a hazard or near miss</h2>' +
      '<p>Spotted something unsafe? Report it here — near misses are early warnings that prevent injuries. <strong>If someone is hurt or in danger, call ' + esc(K.store().settings.contacts.emergency) + ' first.</strong></p>' +
      '<form id="reportForm" class="form" novalidate>' +
        '<div class="form-row"><div class="field"><label for="rType">Type</label><select id="rType"><option>Hazard</option><option>Near miss</option><option>Equipment fault</option><option>Other</option></select></div>' +
        '<div class="field"><label for="rZone">Area</label><select id="rZone">' + zoneOpts + '</select></div>' +
        '<div class="field"><label for="rSev">Severity</label><select id="rSev"><option>Low</option><option selected>Medium</option><option>High</option></select></div></div>' +
        '<div class="field"><label for="rDesc">What did you see?</label><textarea id="rDesc" rows="4" maxlength="500" placeholder="Where it is, what the hazard is, and whether anyone is at risk"></textarea><p class="field-error" id="rErr" role="alert"></p><p class="muted"><span id="rCount">0</span> / 500</p></div>' +
        '<button class="btn btn-primary" type="submit">Submit report</button></form></div>' +
      '<div class="card"><h3>My reports</h3>' + (mine.length ? '<div class="table-scroll"><table class="data"><thead><tr><th>ID</th><th>Date</th><th>Area</th><th>Type</th><th>Severity</th><th>Status</th></tr></thead><tbody>' + mine.map(function (r) { return '<tr><td class="mono">' + esc(r.id) + '</td><td>' + K.fmtDate(r.t) + '</td><td>' + esc(zoneLabel(r.zone)) + '</td><td>' + esc(r.type) + '</td><td>' + esc(r.severity) + '</td><td>' + pill(r.status === "open" ? "warn" : "complete", r.status === "open" ? "Open" : "Closed") + '</td></tr>'; }).join("") + '</tbody></table></div>' : '<p class="muted">You have not submitted any reports yet.</p>') + '</div>';
    var desc = el.querySelector("#rDesc"), cnt = el.querySelector("#rCount");
    desc.addEventListener("input", function () { cnt.textContent = desc.value.length; });
    el.querySelector("#reportForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var d = desc.value.trim(), err = el.querySelector("#rErr");
      if (d.length < 15) { err.textContent = "Please describe it in at least 15 characters so it can be acted on."; desc.focus(); return; }
      err.textContent = "";
      var s = K.store(), maxN = s.reports.reduce(function (m, r) { var n = parseInt(String(r.id).replace(/\D/g, ""), 10); return n > m ? n : m; }, 1000);
      var rep = { id: "R-" + (maxN + 1), t: new Date().toISOString(), by: u.name, zone: el.querySelector("#rZone").value, type: el.querySelector("#rType").value, severity: el.querySelector("#rSev").value, desc: d, status: "open" };
      s.reports.unshift(rep); u.reports = (u.reports || 0) + 1; K.touch(u);
      K.audit("Hazard report submitted", rep.id + " — " + rep.type + " (" + rep.severity + ")"); K.save();
      K.toast("Report " + rep.id + " submitted — thank you", "good");
      report(el);
    });
  }

  /* -------------------------------------------------------------------- guide */
  function guide(el) {
    var c = K.store().settings.contacts, zones = K.allZones();
    var ppeRows = Object.keys(C.PPE_ITEMS).map(function (k) {
      return '<tr><th scope="row"><span aria-hidden="true">' + C.PPE_ITEMS[k].icon + '</span> ' + esc(C.PPE_ITEMS[k].label) + '</th>' + C.ZONE_IDS.map(function (z) { return '<td>' + (C.ZONES[z].ppeRequired.indexOf(k) !== -1 ? '<span class="yes" aria-label="Required">●</span>' : '<span class="no" aria-label="Not required">–</span>') + '</td>'; }).join("") + '</tr>';
    }).join("");
    el.innerHTML = '<div class="card"><p class="eyebrow">SAFETY GUIDE</p><h2>Quick reference</h2>' +
      '<div class="contact-grid"><div class="contact emergency"><span aria-hidden="true">🚨</span><b>Emergency</b><p>' + esc(c.emergency) + '</p></div><div class="contact"><span aria-hidden="true">🦺</span><b>Safety officer</b><p>' + esc(c.safetyOfficer) + '</p></div><div class="contact"><span aria-hidden="true">⛑️</span><b>First aider</b><p>' + esc(c.firstAider) + '</p></div><div class="contact"><span aria-hidden="true">📍</span><b>Assembly point</b><p>' + esc(c.assembly) + '</p></div></div></div>' +
      '<div class="card"><h3>PPE by zone</h3><div class="table-scroll"><table class="data ppe-table"><thead><tr><th>Item</th>' + C.ZONE_IDS.map(function (z) { return '<th>' + esc(zones[z].zoneName) + '</th>'; }).join("") + '</tr></thead><tbody>' + ppeRows + '</tbody></table></div><p class="muted">● required for the task shown in each zone\'s PPE check. Always follow the signs and your supervisor on site.</p></div>' +
      '<div class="card"><h3>Glossary</h3>' + C.GLOSSARY.map(function (g) { return '<details><summary>' + esc(g.term) + '</summary><p>' + esc(g.def) + '</p></details>'; }).join("") + '</div>' +
      '<div class="card"><h3>How the platform works</h3><ol class="plain-ol"><li>Complete the three <b>zones</b>: explore the 360° scene, pass the PPE check, then the knowledge check.</li><li>Play the three <b>emergency scenarios</b> and make safe decisions.</li><li>Pass the <b>final assessment</b> to earn your certificate.</li><li>Use <b>Report a hazard</b> any time you see something unsafe.</li></ol><p class="muted">Content is illustrative and must be validated against your own site rules before real use.</p></div>';
  }

  /* -------------------------------------------------------------------- admin */
  function admin(el) {
    el.innerHTML = '<div class="card"><p class="eyebrow">CONTENT ADMINISTRATION</p><h2>Manage training content</h2>' +
      '<p class="muted">Changes apply to this browser only. A production version needs authenticated server-side change control and approval — the activity log shows how this would be audited.</p>' +
      tabs([["content", "Zone content"], ["settings", "Settings"], ["backup", "Backup & restore"], ["log", "Activity log"]], ad.tab, "adtab") + '<div id="adBody"></div></div>';
    el.onclick = function (e) {
      var b = e.target.closest("[data-act='adtab']"); if (!b) return;
      ad.tab = b.getAttribute("data-tab"); admin(el);
    };
    var body = el.querySelector("#adBody");
    if (ad.tab === "content") adContent(body, el);
    else if (ad.tab === "settings") adSettings(body);
    else if (ad.tab === "backup") adBackup(body, el);
    else adLog(body);
  }

  function adContent(body) {
    var zone = K.getZone(ad.zone);
    var html = '<div class="field"><label for="adZone">Zone to edit</label><select id="adZone">' + C.ZONE_IDS.map(function (z) { return '<option value="' + z + '"' + (z === ad.zone ? " selected" : "") + '>' + esc(K.getZone(z).zoneName) + '</option>'; }).join("") + '</select></div>' +
      '<div class="field"><label for="adName">Zone name</label><input id="adName" value="' + esc(zone.zoneName) + '" maxlength="60"></div><h3>Hazard markers</h3>';
    Object.keys(zone.hotspots).forEach(function (k, i) {
      html += '<fieldset class="fs"><legend>Marker ' + (i + 1) + '</legend><div class="field"><label for="adHT_' + k + '">Title</label><input id="adHT_' + k + '" value="' + esc(zone.hotspots[k].title) + '" maxlength="60"></div><div class="field"><label for="adHB_' + k + '">Description</label><textarea id="adHB_' + k + '" rows="2" maxlength="300">' + esc(zone.hotspots[k].body) + '</textarea></div></fieldset>';
    });
    html += '<h3>Knowledge-check questions</h3>';
    zone.questions.forEach(function (q, qi) {
      html += '<fieldset class="fs"><legend>Question ' + (qi + 1) + '</legend><div class="field"><label for="adQ_' + qi + '">Question</label><input id="adQ_' + qi + '" value="' + esc(q.q) + '" maxlength="200"></div>';
      q.options.forEach(function (o, oi) {
        html += '<div class="opt-row"><input type="radio" name="adC_' + qi + '" id="adC_' + qi + '_' + oi + '" value="' + oi + '"' + (o.correct ? " checked" : "") + ' aria-label="Option ' + (oi + 1) + ' is correct"><label class="sr-only" for="adO_' + qi + '_' + oi + '">Option ' + (oi + 1) + '</label><input id="adO_' + qi + '_' + oi + '" value="' + esc(o.text) + '" maxlength="200"></div>';
      });
      html += '<div class="field"><label for="adW_' + qi + '">Explanation shown after answering</label><input id="adW_' + qi + '" value="' + esc(q.why || "") + '" maxlength="250"></div></fieldset>';
    });
    html += '<p class="muted">Select the radio button beside the correct answer for each question.</p><p class="field-error" id="adErr" role="alert"></p><div class="btn-row"><button class="btn btn-primary" data-act="save">Save changes</button><button class="btn btn-secondary" data-act="reset">Reset this zone to default</button></div>';
    body.innerHTML = html;
    body.querySelector("#adZone").addEventListener("change", function (e) { ad.zone = e.target.value; adContent(body); });
    body.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act"), err = body.querySelector("#adErr");
      if (act === "save") {
        var next = K.clone(K.getZone(ad.zone)); err.textContent = "";
        var name = body.querySelector("#adName").value.trim();
        if (!name) { err.textContent = "Zone name cannot be empty."; return; }
        next.zoneName = name;
        var bad = null;
        Object.keys(next.hotspots).forEach(function (k) {
          var t = body.querySelector("#adHT_" + k).value.trim(), d = body.querySelector("#adHB_" + k).value.trim();
          if (!t || !d) bad = "Every marker needs a title and description."; next.hotspots[k].title = t; next.hotspots[k].body = d;
        });
        next.questions.forEach(function (q, qi) {
          q.q = body.querySelector("#adQ_" + qi).value.trim(); q.why = body.querySelector("#adW_" + qi).value.trim();
          var sel = body.querySelector('input[name="adC_' + qi + '"]:checked');
          q.options.forEach(function (o, oi) { o.text = body.querySelector("#adO_" + qi + "_" + oi).value.trim(); o.correct = !!sel && parseInt(sel.value, 10) === oi; if (!o.text) bad = "Every answer option needs text."; });
          if (!q.q) bad = "Every question needs text."; if (!sel) bad = "Choose a correct answer for every question.";
        });
        if (bad) { err.textContent = bad; return; }
        K.store().content[ad.zone] = next; K.audit("Content updated", next.zoneName); K.save();
        K.toast("Saved — " + next.zoneName, "good");
        adContent(body);
      }
      if (act === "reset") {
        K.confirmBox("Reset " + zone.zoneName + " to the original content?", "Reset").then(function (ok) {
          if (!ok) return; delete K.store().content[ad.zone]; K.audit("Content reset", C.ZONES[ad.zone].zoneName); K.save(); K.toast("Zone reset to default", "good"); adContent(body);
        });
      }
    };
  }

  function adSettings(body) {
    var S = K.store().settings, poolMax = K.questionPool().length;
    body.innerHTML = '<h3>Assessment</h3><div class="form-row"><div class="field"><label for="sPass">Final assessment pass mark (%)</label><input id="sPass" type="number" min="50" max="100" value="' + S.finalPassPercent + '"></div>' +
      '<div class="field"><label for="sQ">Questions in final assessment (5–' + poolMax + ')</label><input id="sQ" type="number" min="5" max="' + poolMax + '" value="' + S.finalQuestions + '"></div></div>' +
      '<h3>Emergency information (shown in the Safety guide)</h3>' +
      [["emergency", "Emergency number"], ["safetyOfficer", "Safety officer"], ["firstAider", "First aider"], ["assembly", "Assembly point"]].map(function (f) { return '<div class="field"><label for="sc_' + f[0] + '">' + f[1] + '</label><input id="sc_' + f[0] + '" value="' + esc(S.contacts[f[0]]) + '" maxlength="120"></div>'; }).join("") +
      '<p class="field-error" id="sErr" role="alert"></p><div class="btn-row"><button class="btn btn-primary" data-act="save">Save settings</button></div>';
    body.onclick = function (e) {
      if (!e.target.closest("[data-act='save']")) return;
      var pass = parseInt(body.querySelector("#sPass").value, 10), q = parseInt(body.querySelector("#sQ").value, 10), err = body.querySelector("#sErr");
      if (!(pass >= 50 && pass <= 100)) { err.textContent = "Pass mark must be between 50 and 100."; return; }
      if (!(q >= 5 && q <= poolMax)) { err.textContent = "Number of questions must be between 5 and " + poolMax + "."; return; }
      var contacts = {}; ["emergency", "safetyOfficer", "firstAider", "assembly"].forEach(function (k) { contacts[k] = body.querySelector("#sc_" + k).value.trim() || C.DEFAULT_CONTACTS[k]; });
      S.finalPassPercent = pass; S.finalQuestions = q; S.contacts = contacts;
      K.audit("Settings updated", "Pass mark " + pass + "%, " + q + " questions"); K.save(); err.textContent = ""; K.toast("Settings saved", "good");
    };
  }

  function validContent(obj) {
    if (!obj || typeof obj !== "object") return false;
    return C.ZONE_IDS.every(function (z) {
      var o = obj[z]; if (!o) return true;                         // zones may be omitted
      if (typeof o.zoneName !== "string" || !o.hotspots || !Array.isArray(o.questions) || o.questions.length !== 3) return false;
      if (Object.keys(C.ZONES[z].hotspots).some(function (k) { var h = o.hotspots[k]; return !h || typeof h.title !== "string" || typeof h.body !== "string"; })) return false;
      return o.questions.every(function (q) { return q && typeof q.q === "string" && Array.isArray(q.options) && q.options.length === 3 && q.options.every(function (x) { return typeof x.text === "string"; }) && q.options.filter(function (x) { return x.correct === true; }).length === 1; });
    });
  }

  function adBackup(body, el) {
    body.innerHTML = '<h3>Export content</h3><p>Download the current zone content and settings as a JSON file. User accounts and progress are not included.</p><button class="btn btn-secondary" data-act="export">Export content &amp; settings</button>' +
      '<h3>Import content</h3><p>Restore content from a file exported here. The file is validated before anything changes.</p><input type="file" id="impFile" accept="application/json,.json" aria-label="Choose a content export file">' +
      '<h3>Reset</h3><p>Remove every account, report and edit saved on this device and start again with the sample data.</p><button class="btn btn-danger" data-act="reset">Reset all demo data…</button>';
    body.onclick = function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      if (b.getAttribute("data-act") === "export") {
        var s = K.store(); K.downloadBlob("nexatech-content-export.json", JSON.stringify({ exportedAt: new Date().toISOString(), content: s.content, settings: s.settings }, null, 2), "application/json");
        K.audit("Content exported", ""); K.save();
      }
      if (b.getAttribute("data-act") === "reset") {
        K.confirmBox("Remove ALL accounts, progress, reports and content edits on this device?", "Reset everything").then(function (ok) { if (ok) { K.resetAll(); window.location.reload(); } });
      }
    };
    body.querySelector("#impFile").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      if (f.size > 500000) { K.toast("File is too large", "warn"); return; }
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var data = JSON.parse(rd.result);
          if (!validContent(data.content || {})) throw new Error("content");
          var s = K.store();
          s.content = data.content || {};
          if (data.settings) {
            var p = parseInt(data.settings.finalPassPercent, 10), q = parseInt(data.settings.finalQuestions, 10);
            if (p >= 50 && p <= 100) s.settings.finalPassPercent = p;
            if (q >= 5 && q <= K.questionPool().length) s.settings.finalQuestions = q;
            if (data.settings.contacts && typeof data.settings.contacts === "object") ["emergency", "safetyOfficer", "firstAider", "assembly"].forEach(function (k) { if (typeof data.settings.contacts[k] === "string") s.settings.contacts[k] = data.settings.contacts[k].slice(0, 120); });
          }
          K.audit("Content imported", f.name); K.save(); K.toast("Content imported", "good");
        } catch (err) { K.toast("That file is not a valid content export", "warn"); }
        e.target.value = "";
      };
      rd.readAsText(f);
    });
  }

  function adLog(body) {
    var log = K.store().audit.slice(0, 100);
    body.innerHTML = '<p class="muted">The latest 100 events recorded on this device.</p><div class="table-scroll"><table class="data"><thead><tr><th>When</th><th>User</th><th>Action</th><th>Detail</th></tr></thead><tbody>' +
      (log.length ? log.map(function (l) { return '<tr><td>' + K.fmtDateTime(l.t) + '</td><td>' + esc(l.user) + '</td><td>' + esc(l.action) + '</td><td>' + esc(l.detail) + '</td></tr>'; }).join("") : '<tr><td colspan="4" class="muted">No activity yet.</td></tr>') + '</tbody></table></div>';
  }

  return { init: function (a) { app = a; }, supervisor: supervisor, report: report, guide: guide, admin: admin };
})();
