/* ==========================================================================
   Shared renderers: car card, status pills, avatars, rental drawer.
   Every dynamic value goes through App.esc() before it reaches innerHTML.
   Keep doing that when real data replaces the mock data.
   ========================================================================== */
(function () {
  "use strict";

  const App = window.App;
  const { esc, fmt, icon } = App;

  /* ---------- Small pieces ---------- */
  const STATUS = {
    rental: {
      pending: ["Pending", "warn"],
      approved: ["Approved", "info"],
      active: ["Active", "live"],
      completed: ["Completed", "neutral"],
      rejected: ["Rejected", "danger"],
      cancelled: ["Cancelled", "neutral"],
    },
    car: {
      available: ["Available", "ok"],
      rented: ["Rented", "info"],
      maintenance: ["Maintenance", "warn"],
    },
    payment: {
      paid: ["Paid", "ok"],
      pending: ["Pending", "warn"],
      refunded: ["Refunded", "neutral"],
    },
  };

  App.status = (kind, value) => {
    const [label, tone] = (STATUS[kind] && STATUS[kind][value]) || [value, "neutral"];
    return `<span class="status${tone === "neutral" ? "" : " status--" + tone}">${esc(label)}</span>`;
  };

  App.statusLabel = (kind, value) => ((STATUS[kind] && STATUS[kind][value]) || [value])[0];

  App.avatar = (name, size) => {
    const sum = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
    const tone = ["", "tone-2", "tone-3", "tone-4"][sum % 4];
    const style = size ? ` style="--av:${size}px"` : "";
    return `<span class="avatar ${tone}"${style}>${esc(fmt.initials(name))}</span>`;
  };

  App.plate = (text) => `<span class="plate"><span>${esc(text)}</span></span>`;

  App.fuelIcon = (fuel) => (fuel === "Electric" ? "lightning" : fuel === "Hybrid" ? "leaf" : "gas-pump");

  App.featureIcon = (name) => {
    const n = name.toLowerCase();
    const map = [
      ["air conditioning", "snowflake"], ["climate", "snowflake"], ["bluetooth", "bluetooth"], ["gps", "navigation-arrow"],
      ["camera", "camera"], ["leather", "armchair"], ["heated", "thermometer"], ["keyless", "key"], ["cruise", "gauge"],
      ["usb", "plugs-connected"], ["charging", "lightning"], ["panoramic", "sun"], ["roof", "sun"], ["carplay", "device-mobile"],
      ["lane", "path"], ["sensor", "wifi-high"], ["child", "users"], ["sliding", "door"], ["4x4", "mountains"],
      ["suspension", "wind"], ["sport", "speedometer"], ["screen", "devices"], ["reclining", "armchair"],
    ];
    const hit = map.find(([k]) => n.includes(k));
    return hit ? hit[1] : "check-circle";
  };

  App.empty = ({ icon: ic = "magnifying-glass", title, text, action }) => `
    <div class="empty">
      <div class="empty-icon">${icon(ic)}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
      ${action ? (action.href ? `<a class="btn btn-dark" href="${esc(action.href)}">${esc(action.label)}</a>` : `<button class="btn btn-dark" type="button" data-empty-action>${esc(action.label)}</button>`) : ""}
    </div>`;

  /* ---------- Car card ---------- */
  App.carUrl = (car, ctx = {}) => {
    const qs = new URLSearchParams({ id: car.id });
    if (ctx.from && ctx.to) {
      qs.set("from", ctx.from);
      qs.set("to", ctx.to);
    }
    if (ctx.loc) qs.set("loc", ctx.loc);
    return `${App.base}car.html?${qs.toString()}`;
  };

  App.carCard = (car, ctx = {}) => {
    const href = App.carUrl(car, ctx);
    const ok = car.availableForDates !== false;
    const flag = ok
      ? ""
      : `<span class="car-flag">${ctx.from ? "Booked for your dates" : car.status === "maintenance" ? "In maintenance" : "Rented right now"}</span>`;
    return `
      <article class="car-card${ok ? "" : " is-unavailable"}">
        <div class="car-media">
          <img src="${esc(App.img(car.images[0], 720))}" alt="${esc(`${car.color} ${car.brand} ${car.model}`)}" loading="lazy" width="720" height="540">
          ${flag}
        </div>
        <div class="car-body">
          <div>
            <h3 class="car-title"><a href="${href}">${esc(car.brand)} ${esc(car.model)}</a></h3>
            <p class="car-meta">${esc(car.category)} &middot; ${esc(car.year)}</p>
          </div>
          <ul class="car-specs">
            <li>${icon("users")}${esc(car.seats)} seats</li>
            <li>${icon("gear-six")}${esc(car.transmission === "Automatic" ? "Auto" : car.transmission)}</li>
            <li>${icon(App.fuelIcon(car.fuel))}${esc(car.fuel)}</li>
          </ul>
          <div class="car-foot">
            <div class="price"><strong>${fmt.money(car.dailyRate)}</strong><span>per day</span></div>
            <span class="btn btn-secondary btn-sm" aria-hidden="true">${ok ? "View and rent" : "See other dates"}</span>
          </div>
        </div>
      </article>`;
  };

  App.carSkeletons = (n = 6) =>
    Array.from({ length: n })
      .map(
        () => `
      <div class="car-card" aria-hidden="true">
        <div class="car-media skeleton" style="border-radius:0"></div>
        <div class="car-body">
          <div class="skeleton" style="height:22px;width:62%"></div>
          <div class="skeleton" style="height:16px;width:88%"></div>
          <div class="skeleton" style="height:38px;margin-top:10px"></div>
        </div>
      </div>`
      )
      .join("");

  /* ---------- Rental drawer (customers and staff) ---------- */
  const STEPS = [
    { label: "Requested", icon: "file-text" },
    { label: "Approved", icon: "seal-check" },
    { label: "Picked up", icon: "key" },
    { label: "Returned", icon: "flag-checkered" },
  ];

  function roadHTML(r) {
    if (r.status === "rejected" || r.status === "cancelled") {
      const label = r.status === "rejected" ? "Rejected" : "Cancelled";
      return `
        <ol class="road" aria-label="Rental progress">
          <li class="is-done"><span class="dot">${icon("file-text")}</span>Requested<small>${fmt.short(r.createdAt)}</small></li>
          <li class="is-stopped"><span class="dot">${icon("x")}</span>${label}</li>
        </ol>`;
    }
    const index = { pending: 0, approved: 1, active: 2, completed: 3 }[r.status];
    const dates = { 0: r.createdAt, 2: r.pickedUpAt, 3: r.returnedAt };
    return `
      <ol class="road" aria-label="Rental progress">
        ${STEPS.map((s, i) => {
          const state = r.status === "completed" || i < index ? "is-done" : i === index ? "is-current" : "";
          const done = state === "is-done";
          return `<li class="${state}"><span class="dot">${icon(done ? "check" : s.icon)}</span>${s.label}${dates[i] && (done || i === index) ? `<small>${fmt.short(dates[i])}</small>` : ""}</li>`;
        }).join("")}
      </ol>`;
  }

  function drawerHTML(r, opts) {
    const staff = opts.audience === "staff";
    const car = r.car;
    const loc = (window.DB.locations.find((l) => l.id === r.pickupLocation) || {}).name || r.pickupLocation;
    const pay = r.payment;
    return `
      <div class="dialog-head">
        <div>
          <h3>Rental ${esc(r.id)}</h3>
          <p>Requested ${fmt.date(r.createdAt)}</p>
        </div>
        <div class="row">${App.status("rental", r.status)}<button class="icon-btn" type="button" data-close aria-label="Close">${icon("x")}</button></div>
      </div>
      <div class="dialog-body stack" style="--stack-gap:26px">
        <div class="rd-car">
          <img src="${esc(App.img(car.images[0], 360))}" alt="" width="120" height="84">
          <div>
            <strong>${esc(car.brand)} ${esc(car.model)}</strong>
            <div class="muted text-sm">${esc(car.category)}, ${esc(car.year)}, ${esc(car.transmission)}</div>
            ${staff ? `<div style="margin-top:8px">${App.plate(car.plate)}</div>` : ""}
          </div>
        </div>

        ${roadHTML(r)}

        ${
          r.status === "rejected" && r.reason
            ? `<div class="notice is-warn">${icon("info")}<div><strong>Why it was rejected.</strong> ${esc(r.reason)}</div></div>`
            : ""
        }

        <dl class="kv">
          <div><dt>Pick-up</dt><dd>${fmt.weekday(r.pickupDate)}, ${fmt.date(r.pickupDate)}</dd></div>
          <div><dt>Return</dt><dd>${fmt.weekday(r.returnDate)}, ${fmt.date(r.returnDate)}</dd></div>
          <div><dt>Duration</dt><dd>${fmt.plural(r.days, "day")}</dd></div>
          <div><dt>Pick-up location</dt><dd>${esc(loc)}</dd></div>
          <div><dt>Daily rate</dt><dd>${fmt.money(car.dailyRate)}</dd></div>
          ${r.extraCharge ? `<div><dt>Extra charges</dt><dd>${fmt.money(r.extraCharge)}</dd></div>` : ""}
          <div><dt>Total</dt><dd style="font-size:1.125rem">${fmt.money(r.total)}</dd></div>
        </dl>

        ${
          staff
            ? `<div>
                <h4 style="margin-bottom:12px">Customer</h4>
                <div class="rd-person">
                  ${App.avatar(r.customer.name, 44)}
                  <div>
                    <strong>${esc(r.customer.name)}</strong>
                    <div class="muted text-sm">${esc(r.customer.email)}</div>
                    <div class="muted text-sm">${esc(r.customer.phone)}</div>
                  </div>
                </div>
                <dl class="kv" style="margin-top:14px">
                  <div><dt>Driving license</dt><dd class="mono">${esc(r.customer.licenseNumber)}</dd></div>
                  <div><dt>License expires</dt><dd>${fmt.date(r.customer.licenseExpiry)}</dd></div>
                </dl>
              </div>`
            : ""
        }

        ${
          pay
            ? `<div>
                <h4 style="margin-bottom:12px">Payment</h4>
                <dl class="kv">
                  <div><dt>Status</dt><dd>${App.status("payment", pay.status)}</dd></div>
                  <div><dt>Method</dt><dd>${esc(pay.method)}</dd></div>
                  <div><dt>Amount</dt><dd>${fmt.money(pay.amount)}</dd></div>
                </dl>
              </div>`
            : ""
        }

        ${r.condition ? `<div class="kv"><div><span class="k">Condition at return</span><span class="v">${esc(r.condition)}</span></div></div>` : ""}
        ${r.notes ? `<div class="notice">${icon("note-pencil")}<div>${esc(r.notes)}</div></div>` : ""}
      </div>
      ${
        opts.actions && opts.actions.length
          ? `<div class="dialog-foot">${opts.actions
              .map((a, i) => `<button class="btn ${a.variant || "btn-secondary"}" type="button" data-rd-action="${i}">${a.icon ? icon(a.icon) : ""}${esc(a.label)}</button>`)
              .join("")}</div>`
          : ""
      }`;
  }

  App.rentalDrawer = {
    open(rental, opts = {}) {
      let dlg = App.$("#rental-drawer");
      if (!dlg) {
        dlg = document.createElement("dialog");
        dlg.id = "rental-drawer";
        dlg.className = "drawer";
        dlg.setAttribute("aria-label", "Rental details");
        document.body.appendChild(dlg);
      }
      dlg.innerHTML = drawerHTML(rental, opts);
      dlg.onclick = (e) => {
        const b = e.target.closest("[data-rd-action]");
        if (!b) return;
        const action = opts.actions[Number(b.dataset.rdAction)];
        if (action && action.onClick) action.onClick(() => dlg.close());
      };
      App.openDialog(dlg);
      return dlg;
    },
    close() {
      App.closeDialog("#rental-drawer");
    },
  };
})();
