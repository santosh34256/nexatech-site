/* ==========================================================================
   NexaTech Solution — shared site behaviour
   Runs on every page. Feature blocks below each check for their own
   elements before doing anything, so this one file is safe to include
   everywhere.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("open", !open);
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        links.classList.remove("open");
      });
    });
  }

  /* ---------- Decorative hex field ----------
     Each .hex-field container gets a deterministic scatter of hexagon
     outlines, seeded by data-seed so the same section always renders the
     same pattern (rather than shifting on every reload). */
  function seededRandom(seed) {
    var h = 0;
    for (var i = 0; i < seed.length; i++) {
      h = (h << 5) - h + seed.charCodeAt(i);
      h |= 0;
    }
    return function () {
      h = (h * 1664525 + 1013904223) | 0;
      return ((h >>> 0) % 10000) / 10000;
    };
  }

  document.querySelectorAll(".hex-field").forEach(function (field) {
    var count = parseInt(field.getAttribute("data-count"), 10) || 10;
    var seed = field.getAttribute("data-seed") || "default";
    var rand = seededRandom(seed);
    for (var i = 0; i < count; i++) {
      var hx = document.createElement("span");
      hx.className = "hx";
      var size = 30 + rand() * 90;
      hx.style.width = size + "px";
      hx.style.height = size + "px";
      hx.style.left = rand() * 100 + "%";
      hx.style.top = rand() * 100 + "%";
      hx.style.opacity = (0.35 + rand() * 0.5).toFixed(2);
      field.appendChild(hx);
    }
  });

  /* ---------- Reveal-on-scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("revealed"); });
    }
  }

  /* ---------- Contact form ----------
     This assignment build has no server-side email service. A valid
     enquiry is validated in the browser and saved only to this browser's
     local storage, with a downloadable receipt for the visitor. */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var status = document.getElementById("form-status");

    /* Pre-select the service dropdown when arriving via a link like
       contact.html?service=training-platform, e.g. from the "Request a
       demo" buttons on the Training Platform page. */
    var serviceSelect = document.getElementById("service");
    if (serviceSelect) {
      var params = new URLSearchParams(window.location.search);
      var requestedService = params.get("service");
      if (requestedService) {
        Array.prototype.slice.call(serviceSelect.options).forEach(function (opt) {
          if (opt.value === requestedService) serviceSelect.value = requestedService;
        });
      }
    }

    var fieldWrap = function (input) {
      return input.closest(".field");
    };
    var showError = function (input, message) {
      var wrap = fieldWrap(input);
      if (!wrap) return;
      wrap.classList.add("has-error");
      var err = wrap.querySelector(".field-error");
      if (err) err.textContent = message;
    };
    var clearError = function (input) {
      var wrap = fieldWrap(input);
      if (!wrap) return;
      wrap.classList.remove("has-error");
      var err = wrap.querySelector(".field-error");
      if (err) err.textContent = "";
    };
    var isValidEmail = function (value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    var nameInput = document.getElementById("name");
    var companyInput = document.getElementById("company");
    var emailInput = document.getElementById("email");
    var phoneInput = document.getElementById("phone");
    var serviceInput = document.getElementById("service");
    var messageInput = document.getElementById("message");
    var consentInput = document.getElementById("consent");

    var messageCounter = document.querySelector('[data-counter-for="message"]');
    if (messageInput && messageCounter) {
      var maxLen = parseInt(messageInput.getAttribute("data-max"), 10) || 600;
      var updateCount = function () {
        messageCounter.textContent = messageInput.value.length + " / " + maxLen;
      };
      messageInput.addEventListener("input", updateCount);
      updateCount();
    }

    var validate = function () {
      var ok = true;

      if (!nameInput.value.trim()) {
        showError(nameInput, "Please enter your full name.");
        ok = false;
      } else {
        clearError(nameInput);
      }

      if (!emailInput.value.trim()) {
        showError(emailInput, "Please enter an email address.");
        ok = false;
      } else if (!isValidEmail(emailInput.value.trim())) {
        showError(emailInput, "That email address doesn't look right.");
        ok = false;
      } else {
        clearError(emailInput);
      }

      if (!serviceInput.value) {
        showError(serviceInput, "Please choose a service.");
        ok = false;
      } else {
        clearError(serviceInput);
      }

      var msg = messageInput.value.trim();
      if (!msg) {
        showError(messageInput, "Please tell us a little about the project.");
        ok = false;
      } else if (msg.length < 20) {
        showError(messageInput, "A few more details would help — at least 20 characters.");
        ok = false;
      } else {
        clearError(messageInput);
      }

      if (!consentInput.checked) {
        showError(consentInput, "Please confirm you're happy for us to contact you back.");
        ok = false;
      } else {
        clearError(consentInput);
      }

      return ok;
    };

    [nameInput, emailInput, serviceInput, messageInput].forEach(function (input) {
      input.addEventListener("blur", validate);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        status.className = "form-status error";
        status.textContent = "Please check the highlighted fields and try again.";
        return;
      }
      var enquiry = {
        reference: "NEXA-" + Date.now().toString(36).toUpperCase(),
        submittedAt: new Date().toISOString(),
        name: nameInput.value.trim(),
        company: companyInput ? companyInput.value.trim() : "",
        email: emailInput.value.trim(),
        phone: phoneInput ? phoneInput.value.trim() : "",
        service: serviceInput.value,
        message: messageInput.value.trim()
      };
      try {
        var enquiries = JSON.parse(localStorage.getItem("nexatech_enquiries") || "[]");
        enquiries.push(enquiry);
        localStorage.setItem("nexatech_enquiries", JSON.stringify(enquiries));
      } catch (storageError) {
        /* Browsers may block local storage in private browsing. The form
           still confirms validation, but no receipt is offered. */
      }
      var honeypot = document.getElementById("website");
      if (honeypot && honeypot.value) { form.reset(); return; }
      var serviceLabel = serviceInput.options[serviceInput.selectedIndex].text;
      var bodyText =
        "Name: " + enquiry.name + "\n" +
        "Company: " + (enquiry.company || "-") + "\n" +
        "Email: " + enquiry.email + "\n" +
        "Phone: " + (enquiry.phone || "-") + "\n" +
        "Service: " + serviceLabel + "\n\n" + enquiry.message + "\n\nReference: " + enquiry.reference;
      var subject = "Website enquiry: " + serviceLabel + " (" + enquiry.reference + ")";
      var mailto = "mailto:hello@nexatechsolution.dev?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyText);

      status.className = "form-status success";
      status.textContent = "Thank you, " + enquiry.name.split(" ")[0] + ". Your enquiry is ready (reference " + enquiry.reference + "). Press “Open email to send” to deliver it to our team — nothing is sent until you press send in your email app.";
      var actions = document.createElement("div");
      actions.className = "form-actions";
      var send = document.createElement("a");
      send.className = "btn btn-primary";
      send.href = mailto;
      send.textContent = "Open email to send";
      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "btn btn-secondary";
      copy.textContent = "Copy enquiry text";
      copy.addEventListener("click", function () {
        var done = function () { copy.textContent = "Copied ✓"; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(bodyText).then(done, function () { copy.textContent = "Copy not available"; });
        } else { copy.textContent = "Copy not available"; }
      });
      var receipt = document.createElement("button");
      receipt.type = "button";
      receipt.className = "btn btn-secondary";
      receipt.textContent = "Download receipt";
      receipt.addEventListener("click", function () {
        var blob = new Blob([JSON.stringify(enquiry, null, 2)], { type: "application/json" });
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = enquiry.reference.toLowerCase() + "-enquiry.json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
      });
      actions.appendChild(send); actions.appendChild(copy); actions.appendChild(receipt);
      status.appendChild(actions);
      status.scrollIntoView({ behavior: "smooth", block: "nearest" });
      form.reset();
      if (messageCounter) messageCounter.textContent = "0 / " + (messageInput.getAttribute("data-max") || 600);
    });
  }
  /* ---------- Print button (marketing plan) ---------- */
  document.querySelectorAll("[data-print]").forEach(function (b) {
    b.addEventListener("click", function () { window.print(); });
  });

  /* ---------- Back-to-top ---------- */
  var top = document.createElement("button");
  top.type = "button"; top.className = "to-top"; top.setAttribute("aria-label", "Back to top"); top.textContent = "↑";
  top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  document.body.appendChild(top);
  window.addEventListener("scroll", function () { top.classList.toggle("show", window.scrollY > 600); }, { passive: true });
})();
