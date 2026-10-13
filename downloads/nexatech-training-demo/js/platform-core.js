/* ==========================================================================
   NexaTech Training Platform — core: storage, accounts, progress, audit
   Everything is stored in this browser's localStorage. A production release
   would use a secure back end (see README / B4 security report).
   ========================================================================== */
window.NxCore = (function () {
  "use strict";
  var C = window.NEXA_CONTENT;
  var STORAGE_KEY = "nexatech_platform_v4";
  var PREFS_KEY = "nexatech_platform_prefs";
  var SESSION_MINUTES = 20;

  /* ---------- Small utilities ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso); if (isNaN(d)) return "—";
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }
  function fmtDateTime(iso) {
    if (!iso) return "—";
    var d = new Date(iso); if (isNaN(d)) return "—";
    return d.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }
  function daysSince(iso) { if (!iso) return null; return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function downloadBlob(filename, text, type) {
    var blob = new Blob([text], { type: type || "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }
  function csvCell(v) {
    v = String(v == null ? "" : v);
    if (/^[=+\-@]/.test(v)) v = "'" + v;                 // neutralise spreadsheet formulas
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  /* ---------- Toasts and confirm dialog ---------- */
  function toast(message, kind) {
    var host = document.getElementById("toasts");
    if (!host) return;
    var t = document.createElement("div");
    t.className = "toast " + (kind || "");
    t.textContent = message;
    host.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 3200);
    setTimeout(function () { t.remove(); }, 3700);
  }
  function confirmBox(message, okLabel) {
    return new Promise(function (resolve) {
      var dlg = document.getElementById("confirmDialog");
      if (!dlg || typeof dlg.showModal !== "function") { resolve(window.confirm(message)); return; }
      dlg.querySelector("[data-msg]").textContent = message;
      var ok = dlg.querySelector("[data-ok]"), cancel = dlg.querySelector("[data-cancel]");
      ok.textContent = okLabel || "Confirm";
      var done = function (v) { dlg.close(); ok.onclick = cancel.onclick = null; resolve(v); };
      ok.onclick = function () { done(true); };
      cancel.onclick = function () { done(false); };
      dlg.oncancel = function () { done(false); };
      dlg.showModal();
    });
  }

  /* ---------- Store ---------- */
  function defaultSettings() {
    return { finalPassPercent: C.FINAL_PASS_PERCENT, finalQuestions: C.FINAL_QUESTIONS, contacts: clone(C.DEFAULT_CONTACTS) };
  }
  function defaultStore() {
    return { currentUser: null, users: {}, content: {}, settings: defaultSettings(), reports: [], audit: [], savedAt: null };
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultStore();
      var p = JSON.parse(raw);
      if (!p || !p.users) return defaultStore();
      p.content = p.content || {}; p.reports = p.reports || []; p.audit = p.audit || [];
      p.settings = Object.assign(defaultSettings(), p.settings || {});
      p.settings.contacts = Object.assign(clone(C.DEFAULT_CONTACTS), p.settings.contacts || {});
      return p;
    } catch (e) { return defaultStore(); }
  }
  var store = load();
  var storageOk = true;
  function save() {
    try { store.savedAt = new Date().toISOString(); localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); storageOk = true; }
    catch (e) { storageOk = false; }
  }
  function audit(action, detail, who) {
    store.audit.unshift({ t: new Date().toISOString(), user: who || (store.currentUser && store.users[store.currentUser] ? store.users[store.currentUser].name : "—"), action: action, detail: detail || "" });
    if (store.audit.length > 300) store.audit.length = 300;
  }

  /* ---------- Content access (defaults + admin edits) ---------- */
  function zoneIds() { return C.ZONE_IDS; }
  function getZone(id) { return store.content[id] || C.ZONES[id]; }
  function allZones() { var o = {}; C.ZONE_IDS.forEach(function (z) { o[z] = getZone(z); }); return o; }
  function questionPool() {
    var pool = [];
    C.ZONE_IDS.forEach(function (z) { getZone(z).questions.forEach(function (q) { pool.push(q); }); });
    return pool.concat(C.GENERAL_QUESTIONS);
  }

  /* ---------- Progress model ---------- */
  function emptyZone() { return { hotspotsSeen: [], ppePassed: false, ppeAttempts: 0, quizPassed: false, quizBest: 0, quizAttempts: 0, complete: false, completedAt: null }; }
  function emptyUserData() {
    var progress = {}, emergency = {};
    C.ZONE_IDS.forEach(function (z) { progress[z] = emptyZone(); });
    C.SCENARIO_IDS.forEach(function (s) { emergency[s] = { passed: false, best: 0, attempts: 0, passedAt: null }; });
    return { progress: progress, emergency: emergency, final: { passed: false, best: 0, bestMax: 0, attempts: 0, passedAt: null, certId: null, history: [] }, reports: 0, lastActive: null };
  }
  function normalise(u) {
    var base = emptyUserData();
    u.progress = u.progress || base.progress; u.emergency = u.emergency || base.emergency; u.final = u.final || base.final;
    C.ZONE_IDS.forEach(function (z) { u.progress[z] = Object.assign(emptyZone(), u.progress[z] || {}); });
    C.SCENARIO_IDS.forEach(function (s) { u.emergency[s] = Object.assign(base.emergency[s], u.emergency[s] || {}); });
    u.final = Object.assign(base.final, u.final);
    return u;
  }
  function me() { return store.currentUser ? store.users[store.currentUser] || null : null; }

  function zoneSteps(p) { return Math.min(p.hotspotsSeen.length, 3) + (p.ppePassed ? 1 : 0) + (p.quizPassed ? 1 : 0); }
  function zonePercent(p) { return p.complete ? 100 : Math.round(zoneSteps(p) / 5 * 100); }
  function zoneStatus(p) { return p.complete ? "complete" : (zoneSteps(p) > 0 || p.ppeAttempts || p.quizAttempts) ? "progress" : "new"; }
  function zonesDone(u) { return C.ZONE_IDS.filter(function (z) { return u.progress[z].complete; }).length; }
  function scenariosDone(u) { return C.SCENARIO_IDS.filter(function (s) { return u.emergency[s].passed; }).length; }
  function emergencyPercent(u) { return Math.round(scenariosDone(u) / C.SCENARIO_IDS.length * 100); }
  function finalPercentScore(u) { return u.final.bestMax ? Math.round(u.final.best / u.final.bestMax * 100) : 0; }
  function prerequisitesMet(u) { return zonesDone(u) === C.ZONE_IDS.length && scenariosDone(u) === C.SCENARIO_IDS.length; }
  function certified(u) { return !!u.final.passed && prerequisitesMet(u); }
  function overallPercent(u) {
    var sum = 0;
    C.ZONE_IDS.forEach(function (z) { sum += zonePercent(u.progress[z]); });
    sum += emergencyPercent(u);
    sum += u.final.passed ? 100 : 0;
    return Math.round(sum / (C.ZONE_IDS.length + 2));
  }
  function overallStatus(u) {
    if (certified(u)) return "complete";
    return overallPercent(u) > 0 || u.final.attempts ? "progress" : "new";
  }
  function statusLabel(s) { return s === "complete" ? "Certified" : s === "progress" ? "In progress" : "Not started"; }
  function zoneStatusLabel(s) { return s === "complete" ? "Complete" : s === "progress" ? "In progress" : "Not started"; }
  function touch(u) { u.lastActive = new Date().toISOString(); }

  /* Next recommended step for the learner */
  function nextStep(u) {
    for (var i = 0; i < C.ZONE_IDS.length; i++) {
      var z = C.ZONE_IDS[i], p = u.progress[z];
      if (!p.complete) {
        var step = p.hotspotsSeen.length < 3 ? "explore" : !p.ppePassed ? "ppe" : "quiz";
        var label = step === "explore" ? "Explore the hazards" : step === "ppe" ? "PPE check" : "Knowledge check";
        return { kind: "zone", zone: z, step: step, text: getZone(z).zoneName + " — " + label };
      }
    }
    for (var j = 0; j < C.SCENARIO_IDS.length; j++) {
      var s = C.SCENARIO_IDS[j];
      if (!u.emergency[s].passed) return { kind: "scenario", scenario: s, text: "Emergency scenario — " + C.SCENARIOS[s].title };
    }
    if (!u.final.passed) return { kind: "final", text: "Final assessment" };
    return null;
  }

  /* Badges are computed from progress, never stored */
  function badges(u) {
    var allHotspots = C.ZONE_IDS.every(function (z) { return u.progress[z].hotspotsSeen.length >= 3; });
    return [
      { id: "starter", icon: "🚀", name: "Zone Starter", desc: "Complete your first training zone", earned: zonesDone(u) >= 1 },
      { id: "spotter", icon: "🔎", name: "Hazard Spotter", desc: "Find every hazard marker in all zones", earned: allHotspots },
      { id: "ppe", icon: "🦺", name: "PPE Pro", desc: "Pass the PPE check in all three zones", earned: C.ZONE_IDS.every(function (z) { return u.progress[z].ppePassed; }) },
      { id: "emergency", icon: "🚨", name: "Emergency Ready", desc: "Pass all three emergency scenarios", earned: scenariosDone(u) === C.SCENARIO_IDS.length },
      { id: "voice", icon: "📣", name: "Safety Voice", desc: "Submit a hazard or near-miss report", earned: (u.reports || 0) > 0 },
      { id: "sharp", icon: "🎯", name: "Sharp Mind", desc: "Score 90% or more in the final assessment", earned: finalPercentScore(u) >= 90 },
      { id: "certified", icon: "🏅", name: "Certified", desc: "Complete the full programme", earned: certified(u) }
    ];
  }

  /* ---------- Accounts ---------- */
  function randHex(n) {
    var a = new Uint8Array(n);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function hashPassword(salt, pw) {
    var data = salt + "|" + pw;
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(data)).then(function (buf) {
        return "sha256:" + Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      });
    }
    return Promise.resolve("plain:" + data);
  }
  function userKey(name) { return String(name).trim().toLowerCase().replace(/\s+/g, " "); }

  var lock = { fails: {}, until: {} };
  function register(name, pw, role) {
    var key = userKey(name);
    var salt = randHex(8);
    return hashPassword(salt, pw).then(function (h) {
      var u = Object.assign({ name: name.trim().replace(/\s+/g, " "), role: role, salt: salt, hash: h, created: new Date().toISOString() }, emptyUserData());
      store.users[key] = u;
      audit("Account created", role, u.name);
      return u;
    });
  }
  function authenticate(name, pw) {
    var key = userKey(name), u = store.users[key];
    if (lock.until[key] && Date.now() < lock.until[key]) {
      return Promise.resolve({ ok: false, error: "Too many attempts. Please wait " + Math.ceil((lock.until[key] - Date.now()) / 1000) + " seconds and try again." });
    }
    if (!u) return Promise.resolve({ ok: false, notFound: true });
    if (!u.hash) return Promise.resolve({ ok: false, error: "This is a sample account and cannot be signed into. Create your own account to try the platform." });
    return hashPassword(u.salt, pw).then(function (h) {
      if (h === u.hash) { lock.fails[key] = 0; return { ok: true, user: u, key: key }; }
      lock.fails[key] = (lock.fails[key] || 0) + 1;
      if (lock.fails[key] >= 5) { lock.until[key] = Date.now() + 30000; lock.fails[key] = 0; audit("Sign-in locked", "5 failed attempts", u.name); save(); return { ok: false, error: "Too many incorrect passwords. This account is locked for 30 seconds." }; }
      return { ok: false, error: "Incorrect password for this name. Try again, or use a different name to create a new account." };
    });
  }

  /* ---------- Certificate ids ---------- */
  function makeCertId(u) {
    var d = new Date();
    return "NXT-" + d.getFullYear() + "-" + randHex(3).toUpperCase();
  }
  function findCertificate(id) {
    id = String(id).trim().toUpperCase();
    var found = null;
    Object.keys(store.users).forEach(function (k) { var u = store.users[k]; if (u.final && u.final.certId && u.final.certId.toUpperCase() === id && certified(u)) found = u; });
    return found;
  }

  /* ---------- Preferences (text size, contrast) kept outside the main store ---------- */
  function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; } }
  function savePrefs(p) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch (e) {} }

  /* ---------- Sample colleagues so dashboards are not empty ---------- */
  function seed() {
    if (store.seeded) return;
    function mk(name, role) { return Object.assign({ name: name, role: role || "trainee", hash: null, created: daysAgo(30), sample: true }, emptyUserData()); }
    var ids = C.ZONE_IDS;
    function seen(z) { return Object.keys(C.ZONES[z].hotspots); }
    function fz(u, z, when, quiz) { var p = u.progress[z]; p.hotspotsSeen = seen(z); p.ppePassed = true; p.ppeAttempts = 1; p.quizPassed = true; p.quizBest = quiz || 3; p.quizAttempts = 1; p.complete = true; p.completedAt = daysAgo(when); }
    function sc(u, s, score, when) { u.emergency[s] = { passed: true, best: score, attempts: 1, passedAt: daysAgo(when) }; }

    var a = mk("Jordan Kowalski");
    a.progress[ids[0]].hotspotsSeen = seen(ids[0]).slice(0, 2); a.lastActive = daysAgo(9);
    var b = mk("Rita Osei");
    fz(b, ids[0], 6); fz(b, ids[1], 5, 2); sc(b, "fire", 6, 4);
    b.progress[ids[2]].hotspotsSeen = seen(ids[2]).slice(0, 1); b.lastActive = daysAgo(2);
    var c = mk("Marcus Bell");
    ids.forEach(function (z, i) { fz(c, z, 12 - i); });
    C.SCENARIO_IDS.forEach(function (s, i) { sc(c, s, 6 - (i === 1 ? 1 : 0), 8 - i); });
    c.final = { passed: true, best: 7, bestMax: 8, attempts: 1, passedAt: daysAgo(5), certId: "NXT-2026-3F9A12", history: [] }; c.lastActive = daysAgo(5);
    var d = mk("Priya Shrestha");
    var e = mk("Daniel Whitfield");
    ids.forEach(function (z, i) { fz(e, z, 7 - i, i === 1 ? 2 : 3); });
    sc(e, "fire", 6, 3); sc(e, "spill", 4, 2); e.lastActive = daysAgo(1);
    [a, b, c, d, e].forEach(function (u) { store.users[userKey(u.name)] = u; });
    store.seeded = true;
    store.reports.push(
      { id: "R-1001", t: daysAgo(3), by: "Rita Osei", zone: "forkliftAisle", type: "Near miss", severity: "Medium", desc: "Forklift reversed close to the blue walkway at the blind corner; mirror was dirty and hard to read.", status: "open" },
      { id: "R-1000", t: daysAgo(10), by: "Marcus Bell", zone: "partsStorage", type: "Hazard", severity: "Low", desc: "Trolley left beside the fire exit route after delivery. Moved and reported.", status: "closed" }
    );
    save();
  }
  function isRealUser(u) { return !!u && !!u.name; }
  function trainees() {
    return Object.keys(store.users).map(function (k) { return store.users[k]; }).filter(function (u) { return isRealUser(u) && u.role === "trainee"; }).map(normalise);
  }

  function resetAll() { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }

  return {
    C: C, store: function () { return store; }, save: save, audit: audit, storageOk: function () { return storageOk; },
    esc: esc, fmtDate: fmtDate, fmtDateTime: fmtDateTime, daysAgo: daysAgo, daysSince: daysSince, clone: clone, shuffle: shuffle,
    downloadBlob: downloadBlob, csvCell: csvCell, toast: toast, confirmBox: confirmBox,
    zoneIds: zoneIds, getZone: getZone, allZones: allZones, questionPool: questionPool,
    emptyZone: emptyZone, normalise: normalise, me: me, userKey: userKey,
    zoneSteps: zoneSteps, zonePercent: zonePercent, zoneStatus: zoneStatus, zoneStatusLabel: zoneStatusLabel,
    zonesDone: zonesDone, scenariosDone: scenariosDone, emergencyPercent: emergencyPercent, finalPercentScore: finalPercentScore,
    prerequisitesMet: prerequisitesMet, certified: certified, overallPercent: overallPercent, overallStatus: overallStatus, statusLabel: statusLabel,
    touch: touch, nextStep: nextStep, badges: badges,
    register: register, authenticate: authenticate, makeCertId: makeCertId, findCertificate: findCertificate,
    loadPrefs: loadPrefs, savePrefs: savePrefs, seed: seed, trainees: trainees, resetAll: resetAll,
    SESSION_MINUTES: SESSION_MINUTES
  };
})();
