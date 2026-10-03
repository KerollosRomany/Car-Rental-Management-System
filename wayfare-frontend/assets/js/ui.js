/* ==========================================================================
   Shared UI helpers: formatting, dialogs, toasts, forms, page layout.
   Plain script (no modules) so pages also work when opened from disk.
   ========================================================================== */
(function () {
  "use strict";

  const App = (window.App = window.App || {});
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  App.$ = $;
  App.$$ = $$;

  App.base = (document.body && document.body.dataset.base) || "";
  App.brand = "Wayfare";

  App.esc = (value) =>
    String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Formatting ---------- */
  const parse = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const money0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const money2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

  App.fmt = {
    parse,
    iso: toIso,
    money: (n) => money0.format(n),
    money2: (n) => money2.format(n),
    date: (iso) => parse(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    short: (iso) => parse(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weekday: (iso) => parse(iso).toLocaleDateString("en-US", { weekday: "short" }),
    range: (a, b) => `${App.fmt.short(a)} to ${App.fmt.short(b)}`,
    plural: (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`,
    initials: (name) =>
      String(name)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join(""),
    relative(iso) {
      const diff = Math.round((parse(iso) - parse(window.DB.today)) / 86400000);
      if (diff === 0) return "today";
      if (diff === 1) return "tomorrow";
      if (diff === -1) return "yesterday";
      return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
    },
  };

  App.icon = (name, cls = "", fill = false) =>
    `<i class="${fill ? "ph-fill" : "ph"} ph-${name}${cls ? " " + cls : ""}" aria-hidden="true"></i>`;

  // Unsplash photo URLs carry a width. Cards ask for small ones, galleries for large ones.
  App.img = (url, width) => (url && url.indexOf("images.unsplash.com") > -1 ? url.replace(/w=\d+/, `w=${width}`) : url);

  const PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#1b1f23'/><text x='200' y='158' text-anchor='middle' font-family='sans-serif' font-size='15' fill='#8a929b'>Photo unavailable</text></svg>"
    );

  document.addEventListener(
    "error",
    (e) => {
      const el = e.target;
      if (el && el.tagName === "IMG" && !el.dataset.failed) {
        el.dataset.failed = "1";
        el.src = PLACEHOLDER;
        el.removeAttribute("srcset");
      }
    },
    true
  );

  /* ---------- Toasts ---------- */
  let toastBox;
  App.toast = (message, opts = {}) => {
    if (!toastBox) {
      toastBox = document.createElement("div");
      toastBox.className = "toasts";
      toastBox.setAttribute("role", "status");
      toastBox.setAttribute("aria-live", "polite");
      document.body.appendChild(toastBox);
    }
    const el = document.createElement("div");
    el.className = "toast" + (opts.error ? " is-error" : "");
    el.innerHTML = `${App.icon(opts.error ? "warning-circle" : "check-circle", "", true)}<span>${App.esc(message)}</span>`;
    toastBox.appendChild(el);
    setTimeout(() => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 260);
    }, opts.duration || 3600);
  };

  /* ---------- Dialogs ---------- */
  App.openDialog = (target) => {
    const d = typeof target === "string" ? $(target) : target;
    if (d && !d.open) d.showModal();
    return d;
  };
  App.closeDialog = (target) => {
    const d = typeof target === "string" ? $(target) : target;
    if (d && d.open) d.close();
  };

  document.addEventListener("click", (e) => {
    const closer = e.target.closest("[data-close]");
    if (closer) {
      const d = closer.closest("dialog");
      if (d) d.close();
      return;
    }
    // Click on the backdrop closes the dialog
    if (e.target instanceof HTMLDialogElement && e.target.open) {
      const r = e.target.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) e.target.close();
    }
  });

  App.confirm = ({ title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) =>
    new Promise((resolve) => {
      let dlg = $("#confirm-dialog");
      if (!dlg) {
        dlg = document.createElement("dialog");
        dlg.id = "confirm-dialog";
        dlg.className = "modal";
        dlg.style.width = "min(460px, calc(100vw - 32px))";
        document.body.appendChild(dlg);
      }
      dlg.innerHTML = `
        <div class="dialog-head"><div><h3>${App.esc(title)}</h3><p>${App.esc(body)}</p></div></div>
        <div class="dialog-foot" style="margin-top:16px">
          <button class="btn btn-secondary" type="button" data-act="no">${App.esc(cancelLabel)}</button>
          <button class="btn ${danger ? "btn-danger-solid" : "btn-dark"}" type="button" data-act="yes">${App.esc(confirmLabel)}</button>
        </div>`;
      let answer = false;
      dlg.onclick = (e) => {
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        answer = btn.dataset.act === "yes";
        dlg.close();
      };
      dlg.onclose = () => resolve(answer);
      dlg.showModal();
    });

  /* ---------- Menus ---------- */
  const setMenu = (anchor, open) => {
    const menu = $(".menu", anchor);
    const trigger = $("[data-menu-toggle]", anchor);
    anchor.classList.toggle("is-open", open);
    if (menu) menu.hidden = !open;
    if (trigger) trigger.setAttribute("aria-expanded", String(open));
  };

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-menu-toggle]");
    $$(".menu-anchor.is-open").forEach((a) => {
      if (!toggle || !a.contains(toggle)) setMenu(a, false);
    });
    if (toggle) {
      const anchor = toggle.closest(".menu-anchor");
      setMenu(anchor, !anchor.classList.contains("is-open"));
    }
  });


  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".menu-anchor.is-open").forEach((a) => setMenu(a, false));
  });

  /* ---------- Forms ---------- */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function checkControl(control, form) {
    const field = control.closest(".field");
    const labelEl = field && $("label.label", field);
    const label = labelEl ? labelEl.textContent.replace("*", "").trim() : "This field";
    const value = control.value.trim();

    if (control.type === "checkbox") {
      return control.required && !control.checked ? control.dataset.msg || "Tick this box to continue." : "";
    }
    if (control.required && !value) return control.dataset.msgRequired || `${label} is required.`;
    if (!value) return "";
    if (control.type === "email" && !EMAIL.test(value)) return "Enter a valid email, like name@example.com.";
    if (control.minLength > 0 && value.length < control.minLength) return `Use at least ${control.minLength} characters.`;
    if (control.dataset.match) {
      const other = $(control.dataset.match, form);
      if (other && other.value !== control.value) return "Passwords do not match.";
    }
    if (control.pattern && !new RegExp(`^(?:${control.pattern})$`).test(value)) return control.dataset.msgPattern || "Check the format and try again.";
    if (control.type === "number") {
      if (control.min !== "" && Number(value) < Number(control.min)) return `Must be at least ${control.min}.`;
      if (control.max !== "" && Number(value) > Number(control.max)) return `Must be ${control.max} or less.`;
    }
    return "";
  }

  function setError(field, control, message) {
    field.classList.toggle("has-error", Boolean(message));
    control.setAttribute("aria-invalid", message ? "true" : "false");
    let err = $(".error-msg", field);
    if (!err) {
      err = document.createElement("p");
      err.className = "error-msg";
      field.appendChild(err);
    }
    if (!err.id) err.id = `${control.id || control.name || "f"}-error`;
    err.textContent = message || "";
    if (message) control.setAttribute("aria-describedby", err.id);
    else control.removeAttribute("aria-describedby");
  }

  App.validate = (form) => {
    let firstBad = null;
    $$(".field", form).forEach((field) => {
      const control = $("input, select, textarea", field);
      if (!control || control.type === "hidden" || control.disabled) return;
      const message = checkControl(control, form);
      setError(field, control, message);
      if (message && !firstBad) firstBad = control;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  };

  // Clear an error as soon as the person starts fixing it.
  const revalidate = (e) => {
    const control = e.target;
    const field = control.closest && control.closest(".field");
    if (field && field.classList.contains("has-error")) setError(field, control, checkControl(control, control.form));
  };
  document.addEventListener("input", revalidate);
  document.addEventListener("change", revalidate);

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-toggle-password]");
    if (!t) return;
    const input = $("input", t.closest(".input-wrap"));
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    t.innerHTML = App.icon(show ? "eye-slash" : "eye");
    t.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });

  App.setLoading = (btn, loading) => {
    btn.classList.toggle("is-loading", loading);
    btn.disabled = loading;
  };

  /* ---------- Date range picker (wraps flatpickr) ---------- */
  App.rangePicker = (input, opts = {}) => {
    if (!window.flatpickr) return null;
    const booked = opts.booked || [];
    const isBooked = (date) => {
      const iso = toIso(date);
      return booked.some((b) => iso >= b.from && iso < b.to);
    };
    return window.flatpickr(input, {
      mode: "range",
      minDate: "today",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "M j",
      altInputClass: opts.inputClass || "input",
      showMonths: window.innerWidth > 760 ? 2 : 1,
      disableMobile: true,
      defaultDate: opts.defaultDate || null,
      locale: { rangeSeparator: " to ", firstDayOfWeek: 1 },
      disable: [isBooked],
      onDayCreate(selected, str, fp, dayElem) {
        if (isBooked(dayElem.dateObj)) {
          dayElem.classList.add("is-booked");
          dayElem.title = "Already booked";
        }
      },
      onReady(selected, str, fp) {
        if (booked.length) {
          const legend = document.createElement("div");
          legend.className = "range-legend";
          legend.innerHTML = `<span><i></i>Your dates</span><span><i class="booked"></i>Already booked</span>`;
          fp.calendarContainer.appendChild(legend);
        }
        if (fp.altInput) fp.altInput.setAttribute("placeholder", opts.placeholder || "Add dates");
      },
      onChange(selected) {
        if (opts.onChange) opts.onChange(selected.length === 2 ? [toIso(selected[0]), toIso(selected[1])] : null, selected);
      },
    });
  };

  /* ---------- Layout ---------- */
  const l = (href) => App.base + href;

  const brand = (href) => `
    <a class="brand" href="${href}" aria-label="${App.brand} home">
      <img class="brand-mark" src="${l("assets/img/logo-mark.svg")}" alt="" width="36" height="36">
      <span class="brand-word">${App.brand}</span>
    </a>`;

  function userMenu(user) {
    return `
      <div class="menu-anchor">
        <button class="user-btn" type="button" data-menu-toggle aria-haspopup="menu" aria-expanded="false">
          <span class="avatar">${App.fmt.initials(user.name)}</span>
          <span class="hide-sm">${App.esc(user.name.split(" ")[0])}</span>${App.icon("caret-down", "hide-sm")}
        </button>
        <div class="menu" role="menu" hidden>
          <div class="menu-head"><strong>${App.esc(user.name)}</strong><span>${App.esc(user.email || "")}</span></div>
          <a role="menuitem" href="${l("my-rentals.html")}">${App.icon("key")}My rentals</a>
          <a role="menuitem" href="${l("profile.html")}">${App.icon("user-circle")}Profile</a>
          <a role="menuitem" class="danger" href="${l("login.html")}">${App.icon("sign-out")}Log out</a>
        </div>
      </div>`;
  }

  // Customer pages always show the signed-in header. The server decides who that is.
  function siteHeader() {
    const page = document.body.dataset.page;
    const item = (href, label, key) => `<a href="${l(href)}"${page === key ? ' aria-current="page"' : ""}>${label}</a>`;
    const mItem = (href, label, icon) => `<a href="${l(href)}">${App.icon(icon)}${label}</a>`;
    return `
      <header class="site-header">
        <div class="container bar">
          ${brand(l("index.html"))}
          <nav class="nav" aria-label="Main">
            ${item("index.html", "Home", "home")}
            ${item("cars.html", "Cars", "cars")}
            ${item("my-rentals.html", "My rentals", "rentals")}
          </nav>
          <div class="header-actions">
            ${userMenu(window.DB.me)}
            <button class="menu-toggle icon-btn" type="button" aria-label="Open menu" aria-expanded="false" data-nav-toggle>${App.icon("list")}</button>
          </div>
        </div>
        <nav class="mobile-nav" aria-label="Mobile" id="mobile-nav">
          ${mItem("index.html", "Home", "house")}
          ${mItem("cars.html", "Cars", "car-profile")}
          ${mItem("my-rentals.html", "My rentals", "key")}
          ${mItem("profile.html", "Profile", "user-circle")}
          ${mItem("login.html", "Log out", "sign-out")}
        </nav>
      </header>`;
  }

  function siteFooter() {
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              ${brand(l("index.html"))}
              <p>Rent a car in a few clicks. Pick your dates, send a request and collect the keys at a branch near you.</p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><a href="${l("cars.html")}">All cars</a></li>
                <li><a href="${l("cars.html?category=SUV")}">SUVs</a></li>
                <li><a href="${l("cars.html?category=Luxury")}">Luxury</a></li>
                <li><a href="${l("cars.html?category=Electric")}">Electric</a></li>
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li><a href="${l("my-rentals.html")}">My rentals</a></li>
                <li><a href="${l("profile.html")}">Profile</a></li>
                <li><a href="${l("login.html")}">Log in</a></li>
                <li><a href="${l("admin/login.html")}">Staff login</a></li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:hello@wayfare.test">hello@wayfare.test</a></li>
                <li><a href="tel:+200000000000">+20 000 000 0000</a></li>
                <li>Daily, 8:00 to 22:00</li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>&copy; ${new Date().getFullYear()} ${App.brand}. College project prototype.</span>
            <span>Photos from Unsplash</span>
          </div>
        </div>
      </footer>`;
  }

  function adminSidebar() {
    const page = document.body.dataset.page;
    const pending = window.DB ? window.DB.rentals.filter((r) => r.status === "pending").length : 0;
    const link = (href, key, icon, label, badge) =>
      `<a class="side-link" href="${l(href)}"${page === key ? ' aria-current="page"' : ""}>${App.icon(icon)}${label}${badge ? `<span class="count-badge">${badge}</span>` : ""}</a>`;
    return `
      ${brand(l("admin/index.html"))}
      <div class="side-tag">Staff console</div>
      <nav class="side-nav" aria-label="Staff">
        <div class="side-label">Overview</div>
        ${link("admin/index.html", "dashboard", "squares-four", "Dashboard")}
        <div class="side-label">Fleet</div>
        ${link("admin/cars.html", "cars", "car-profile", "Cars")}
        <div class="side-label">Operations</div>
        ${link("admin/rentals.html", "rentals", "key", "Rentals", pending)}
        ${link("admin/payments.html", "payments", "receipt", "Payments")}
        <div class="side-label">People</div>
        ${link("admin/customers.html", "customers", "users-three", "Customers")}
      </nav>
      <div class="side-foot">
        <a class="side-link" href="${l("index.html")}">${App.icon("arrow-up-right")}View customer site</a>
        <a class="side-link" href="${l("admin/login.html")}">${App.icon("sign-out")}Log out</a>
      </div>`;
  }

  function adminTopbar() {
    const user = window.DB.staff;
    const title = document.body.dataset.title || "";
    return `
      <button class="menu-toggle icon-btn" type="button" aria-label="Open menu" data-side-toggle>${App.icon("list")}</button>
      <span class="crumb">${App.esc(title)}</span>
      <span class="spacer"></span>
      <div class="menu-anchor">
        <button class="user-btn" type="button" data-menu-toggle aria-haspopup="menu" aria-expanded="false">
          <span class="avatar tone-2">${App.fmt.initials(user.name)}</span>
          <span class="hide-sm">${App.esc(user.name)}</span>${App.icon("caret-down", "hide-sm")}
        </button>
        <div class="menu" role="menu" hidden>
          <div class="menu-head"><strong>${App.esc(user.name)}</strong><span>${App.esc(user.role)}</span></div>
          <a role="menuitem" href="${l("index.html")}">${App.icon("arrow-up-right")}View customer site</a>
          <a role="menuitem" class="danger" href="${l("admin/login.html")}">${App.icon("sign-out")}Log out</a>
        </div>
      </div>`;
  }

  function mountLayout() {
    const layout = document.body.dataset.layout;

    if (!$(".skip-link")) {
      const skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = "#main";
      skip.textContent = "Skip to content";
      document.body.prepend(skip);
    }

    if (layout === "site") {
      const h = $("#site-header");
      const f = $("#site-footer");
      if (h) h.outerHTML = siteHeader();
      if (f) f.outerHTML = siteFooter();
      const toggle = $("[data-nav-toggle]");
      if (toggle) {
        toggle.addEventListener("click", () => {
          const nav = $("#mobile-nav");
          const open = !nav.classList.contains("is-open");
          nav.classList.toggle("is-open", open);
          toggle.setAttribute("aria-expanded", String(open));
          toggle.innerHTML = App.icon(open ? "x" : "list");
        });
      }
    }

    if (layout === "admin") {
      const side = $("#admin-sidebar");
      const top = $("#admin-topbar");
      if (side) {
        side.className = "sidebar";
        side.innerHTML = adminSidebar();
      }
      if (top) {
        top.className = "topbar";
        top.innerHTML = adminTopbar();
      }
      const scrim = document.createElement("div");
      scrim.className = "scrim";
      document.body.appendChild(scrim);
      const setSide = (open) => {
        side.classList.toggle("is-open", open);
        scrim.classList.toggle("is-open", open);
      };
      document.addEventListener("click", (e) => {
        if (e.target.closest("[data-side-toggle]")) setSide(true);
        else if (e.target === scrim) setSide(false);
      });
    }
  }

  App.ready = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  };

  mountLayout();
})();