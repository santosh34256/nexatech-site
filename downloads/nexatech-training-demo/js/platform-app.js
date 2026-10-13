/* ==========================================================================
   NexaTech Training Platform — app shell: sign-in, navigation, preferences
   ========================================================================== */
(function () {
  "use strict";
  var K = window.NxCore, C = K.C, esc = K.esc;
  var $ = function (id) { return document.getElementById(id); };

  var loginSection = $("login"), appSection = $("app");
  if (!loginSection || !appSection) return;

  var ROLE_VIEWS = {
    trainee: ["overview", "training", "emergency", "assessment", "records", "guide", "report"],
    supervisor: ["overview", "supervisor", "guide", "report"],
    admin: ["overview", "supervisor", "admin", "guide", "report"]
  };
  var ROLE_LABEL = { trainee: "Trainee", supervisor: "Supervisor", admin: "Administrator" };
  var current = "overview";
  var lastActivity = Date.now();

  K.seed();

  /* ---------------- Preferences: contrast + text size ---------------- */
  var prefs = K.loadPrefs();
  function applyPrefs() {
    document.body.classList.toggle("high-contrast", !!prefs.contrast);
    document.documentElement.style.fontSize = (prefs.size || 100) + "%";
    var c = $("contrast"); if (c) { c.setAttribute("aria-pressed", String(!!prefs.contrast)); c.textContent = prefs.contrast ? "Standard contrast" : "High contrast"; }
  }
  applyPrefs();
  $("contrast").addEventListener("click", function () { prefs.contrast = !prefs.contrast; K.savePrefs(prefs); applyPrefs(); });
  $("sizeUp").addEventListener("click", function () { prefs.size = Math.min(130, (prefs.size || 100) + 10); K.savePrefs(prefs); applyPrefs(); });
  $("sizeDown").addEventListener("click", function () { prefs.size = Math.max(90, (prefs.size || 100) - 10); K.savePrefs(prefs); applyPrefs(); });

  /* ---------------- Navigation ---------------- */
  var navButtons = Array.prototype.slice.call(document.querySelectorAll(".side-nav button[data-view]"));
  var RENDER = {
    overview: function (el) { var u = K.me(); if (u.role === "trainee") window.NxTrainee.overview(el); else staffOverview(el, u); },
    training: function (el) { window.NxTrainee.training(el); },
    emergency: function (el) { window.NxTrainee.emergency(el); },
    assessment: function (el) { window.NxTrainee.assessment(el); },
    records: function (el) { window.NxTrainee.records(el); },
    guide: function (el) { window.NxStaff.guide(el); },
    report: function (el) { window.NxStaff.report(el); },
    supervisor: function (el) { window.NxStaff.supervisor(el); },
    admin: function (el) { window.NxStaff.admin(el); }
  };

  function staffOverview(el, u) {
    var all = K.trainees(), cert = all.filter(K.certified).length, attn = all.filter(function (t) { if (K.certified(t)) return false; var d = K.daysSince(t.lastActive); return d === null || d >= 7; }).length;
    var open = K.store().reports.filter(function (r) { return r.status === "open"; }).length;
    el.innerHTML = '<div class="card"><p class="eyebrow">WELCOME BACK</p><h2>Hello, ' + esc(u.name.split(" ")[0]) + '</h2>' +
      '<p>You are signed in as ' + (u.role === "admin" ? "an administrator" : "a supervisor") + '. Here is where your team stands today.</p>' +
      '<div class="tiles"><div class="tile"><b>' + all.length + '</b><span>Trainees</span></div><div class="tile good"><b>' + cert + '</b><span>Certified</span></div><div class="tile ' + (attn ? "warn" : "") + '"><b>' + attn + '</b><span>Need attention</span></div><div class="tile ' + (open ? "warn" : "") + '"><b>' + open + '</b><span>Open hazard reports</span></div></div>' +
      '<div class="btn-row"><button class="btn btn-primary" data-go="supervisor">Open team dashboard</button>' + (u.role === "admin" ? '<button class="btn btn-secondary" data-go="admin">Manage content</button>' : "") + '<button class="btn btn-secondary" data-go="report">Report a hazard</button></div></div>';
    el.onclick = function (e) { var b = e.target.closest("[data-go]"); if (b) go(b.getAttribute("data-go")); };
  }

  function go(view) {
    var u = K.me(); if (!u) return;
    if (ROLE_VIEWS[u.role].indexOf(view) === -1) view = "overview";
    if (current === "training" && view !== "training") window.NxTrainee.leave();
    current = view;
    Array.prototype.forEach.call(document.querySelectorAll(".view"), function (v) { v.classList.toggle("active", v.id === view); });
    navButtons.forEach(function (b) { var on = b.getAttribute("data-view") === view; b.classList.toggle("active", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    var el = $(view);
    el.innerHTML = "";
    RENDER[view](el);
    var h = el.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); }
    window.scrollTo({ top: 0 });
  }
  var appApi = { go: go };
  window.NxTrainee.init(appApi); window.NxStaff.init(appApi);
  navButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-view");
      window.NxTrainee.navReset(v);
      go(v);
    });
  });

  /* ---------------- Sign in / out ---------------- */
  var loginForm = $("loginForm"), loginError = $("loginError");
  function enter(u, key) {
    K.normalise(u);
    var s = K.store(); s.currentUser = key;
    K.touch(u); K.audit("Signed in", u.role, u.name); K.save();
    loginSection.classList.add("hidden"); appSection.classList.remove("hidden");
    $("whoName").textContent = u.name; $("whoRole").textContent = ROLE_LABEL[u.role] || u.role;
    var allowed = ROLE_VIEWS[u.role];
    navButtons.forEach(function (b) { b.parentElement.classList.toggle("hidden", allowed.indexOf(b.getAttribute("data-view")) === -1); });
    window.NxTrainee.resetUi();
    lastActivity = Date.now();
    if (!K.storageOk()) $("storageWarn").classList.remove("hidden");
    go("overview");
  }
  function signIn(name, pw, role) {
    loginError.textContent = "";
    name = name.trim().replace(/\s+/g, " ");
    if (name.length < 2) { loginError.textContent = "Please enter your full name (at least 2 characters)."; return Promise.resolve(); }
    if (pw.length < 4) { loginError.textContent = "Password must be at least 4 characters."; return Promise.resolve(); }
    return K.authenticate(name, pw).then(function (res) {
      if (res.ok) return enter(res.user, res.key);
      if (res.notFound) {
        return K.register(name, pw, role).then(function (u) { K.save(); K.toast("Account created for " + u.name, "good"); enter(u, K.userKey(name)); });
      }
      loginError.textContent = res.error;
    });
  }
  loginForm.addEventListener("submit", function (e) { e.preventDefault(); signIn($("name").value, $("password").value, $("role").value); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-demo]"), function (b) {
    b.addEventListener("click", function () {
      var role = b.getAttribute("data-demo"), names = { trainee: "Demo Trainee", supervisor: "Demo Supervisor", admin: "Demo Administrator" };
      signIn(names[role], "demo1234", role);
    });
  });

  function signOut(message) {
    var s = K.store(), u = K.me();
    if (u) K.audit("Signed out", message || "", u.name);
    s.currentUser = null; K.save();
    window.NxTrainee.leave(); window.NxTrainee.resetUi();
    appSection.classList.add("hidden"); loginSection.classList.remove("hidden");
    loginForm.reset();
    loginError.textContent = message || "";
    $("name").focus();
  }
  $("signOut").addEventListener("click", function () { signOut(""); });

  /* ---------------- Inactivity timeout ---------------- */
  ["click", "keydown", "pointerdown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, function () { lastActivity = Date.now(); }, { passive: true }); });
  setInterval(function () {
    if (!K.me()) return;
    if (Date.now() - lastActivity > K.SESSION_MINUTES * 60000) signOut("You were signed out after " + K.SESSION_MINUTES + " minutes of inactivity.");
  }, 30000);

  /* ---------------- Certificate verification ---------------- */
  var verifyForm = $("verifyForm");
  if (verifyForm) verifyForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var out = $("verifyResult"), id = $("certId").value.trim();
    if (!id) { out.className = "banner bad"; out.textContent = "Enter a certificate ID, for example NXT-2026-3F9A12."; return; }
    var u = K.findCertificate(id);
    if (u) { out.className = "banner good"; out.innerHTML = "<strong>Valid certificate.</strong> Issued to <b>" + esc(u.name) + "</b> on " + K.fmtDate(u.final.passedAt) + " with a final score of " + K.finalPercentScore(u) + "%."; }
    else { out.className = "banner bad"; out.textContent = "No certificate with that ID was found on this device."; }
  });

  /* ---------------- Resume session ---------------- */
  var s0 = K.store();
  if (s0.currentUser && s0.users[s0.currentUser] && s0.users[s0.currentUser].role) {
    enter(s0.users[s0.currentUser], s0.currentUser);
  }
})();
