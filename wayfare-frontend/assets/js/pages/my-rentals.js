/* My rentals: summary, current rental, tabbed history, details drawer. */
App.ready(async () => {
  const { $, icon, fmt, esc } = App;
  const me = DB.me;

  $("#greeting").textContent = `Hi, ${me.name.split(" ")[0]}`;

  const TABS = [
    { key: "all", label: "All", match: () => true },
    { key: "pending", label: "Pending", match: (r) => r.status === "pending" },
    { key: "upcoming", label: "Upcoming", match: (r) => r.status === "approved" },
    { key: "active", label: "Active", match: (r) => r.status === "active" },
    { key: "past", label: "Past", match: (r) => r.status === "completed" },
    { key: "closed", label: "Closed", match: (r) => r.status === "rejected" || r.status === "cancelled" },
  ];
  const EMPTY = {
    all: ["You have no rentals yet", "Pick a car and your dates to send your first request.", { label: "Browse cars", href: "cars.html" }],
    pending: ["No requests waiting", "Requests you send show up here until our team confirms them."],
    upcoming: ["No upcoming trips", "Confirmed rentals that have not started yet appear here."],
    active: ["No car with you right now", "Your current rental will be listed here once you collect the keys."],
    past: ["No past rentals", "Finished rentals are kept here so you can rent the same car again."],
    closed: ["Nothing here", "Rejected and cancelled requests are listed here."],
  };

  const order = { active: 0, pending: 1, approved: 2, completed: 3, rejected: 4, cancelled: 5 };
  let rentals = [];
  let tab = "all";

  async function load() {
    rentals = await Api.getRentals({ customerId: me.id });
    rentals.sort((a, b) => order[a.status] - order[b.status] || (a.status === "completed" ? (a.pickupDate < b.pickupDate ? 1 : -1) : a.pickupDate < b.pickupDate ? -1 : 1));
    renderAll();
  }

  /* ---------- Summary ---------- */
  function renderStats() {
    const by = (s) => rentals.filter((r) => r.status === s);
    const active = by("active");
    const upcoming = by("approved").sort((a, b) => (a.pickupDate < b.pickupDate ? -1 : 1));
    const done = by("completed");
    const spent = done.reduce((sum, r) => sum + r.total, 0);
    const items = [
      ["key", "Active now", active.length, active.length ? `Return ${fmt.relative(active[0].returnDate)}` : "No car out right now"],
      ["hourglass", "Awaiting approval", by("pending").length, by("pending").length ? "Waiting for our team" : "Nothing pending"],
      ["calendar-check", "Upcoming trips", upcoming.length, upcoming.length ? `Next pick-up ${fmt.short(upcoming[0].pickupDate)}` : "No trips booked"],
      ["flag-checkered", "Completed", done.length, done.length ? `${fmt.money(spent)} spent in total` : "Your history starts here"],
    ];
    $("#stats").innerHTML = items
      .map(
        ([ic, label, value, sub]) => `
        <div class="card stat">
          <div class="stat-label">${icon(ic)}${label}</div>
          <div class="stat-value num">${value}</div>
          <div class="stat-sub">${esc(sub)}</div>
        </div>`
      )
      .join("");
  }

  /* ---------- Current rental ---------- */
  function renderCurrent() {
    const box = $("#current");
    const r = rentals.find((x) => x.status === "active");
    if (!r) {
      box.hidden = true;
      return;
    }
    const total = Math.max(1, r.days);
    const used = Math.min(total, Math.max(0, Math.round((fmt.parse(DB.today) - fmt.parse(r.pickedUpAt || r.pickupDate)) / 86400000)));
    const left = Math.round((fmt.parse(r.returnDate) - fmt.parse(DB.today)) / 86400000);
    const loc = (DB.locations.find((l) => l.id === r.pickupLocation) || {}).name || "";
    box.hidden = false;
    box.innerHTML = `
      <article class="current-rental">
        <div class="cr-info">
          <span class="status status--live" style="justify-self:start">With you now</span>
          <h2>${esc(r.car.brand)} ${esc(r.car.model)}</h2>
          <p>Return by <strong>${fmt.weekday(r.returnDate)}, ${fmt.date(r.returnDate)}</strong>. Pick-up was at ${esc(loc)}.</p>
          <div>
            <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${used}" aria-label="Rental progress"><i style="--w:${(used / total) * 100}%"></i></div>
            <div class="cr-meta"><span>Picked up ${fmt.short(r.pickedUpAt || r.pickupDate)}</span><strong>${left <= 0 ? "Due today" : fmt.plural(left, "day") + " left"}</strong></div>
          </div>
          <div><button class="btn btn-primary" type="button" data-open="${esc(r.id)}">View details</button></div>
        </div>
        <div class="cr-media"><img src="${esc(App.img(r.car.images[0], 900))}" alt="${esc(`${r.car.brand} ${r.car.model}`)}"></div>
      </article>`;
  }

  /* ---------- Tabs and list ---------- */
  function renderTabs() {
    $("#tabs").innerHTML = TABS.map((t) => {
      const n = rentals.filter(t.match).length;
      return `<button class="tab" role="tab" type="button" data-tab="${t.key}" aria-selected="${t.key === tab}">${t.label}<span class="count">${n}</span></button>`;
    }).join("");
  }

  function renderList() {
    const t = TABS.find((x) => x.key === tab);
    const list = rentals.filter(t.match);
    const box = $("#rental-list");
    if (!list.length) {
      const [title, text, action] = EMPTY[tab];
      box.innerHTML = App.empty({ icon: "key", title, text, action });
      return;
    }
    box.innerHTML = list
      .map((r) => {
        const loc = (DB.locations.find((l) => l.id === r.pickupLocation) || {}).name || "";
        return `
        <button class="rental-row" type="button" data-open="${esc(r.id)}" aria-label="Open rental ${esc(r.id)}, ${esc(r.car.brand)} ${esc(r.car.model)}">
          <img class="rr-img" src="${esc(App.img(r.car.images[0], 300))}" alt="" loading="lazy" width="96" height="68">
          <div class="rr-main"><strong>${esc(r.car.brand)} ${esc(r.car.model)}</strong><span class="muted">${esc(r.id)} &middot; ${esc(loc)}</span></div>
          <div class="rr-dates"><strong>${fmt.range(r.pickupDate, r.returnDate)}</strong><span class="muted">${fmt.plural(r.days, "day")}</span></div>
          <div class="rr-total num"><strong>${fmt.money(r.total)}</strong></div>
          <div class="rr-status">${App.status("rental", r.status)}</div>
          <i class="ph ph-caret-right rr-go" aria-hidden="true"></i>
        </button>`;
      })
      .join("");
  }

  function renderAll() {
    renderStats();
    renderCurrent();
    renderTabs();
    renderList();
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]");
    if (t) {
      tab = t.dataset.tab;
      renderTabs();
      renderList();
      return;
    }
    const open = e.target.closest("[data-open]");
    if (open) openRental(open.dataset.open);
  });

  /* ---------- Drawer ---------- */
  function openRental(id) {
    const r = rentals.find((x) => x.id === id);
    if (!r) return;
    const actions = [];
    if (r.status === "pending" || r.status === "approved") {
      actions.push({
        label: r.status === "pending" ? "Cancel request" : "Cancel booking",
        variant: "btn-danger",
        icon: "x-circle",
        onClick: async (close) => {
          const ok = await App.confirm({
            title: r.status === "pending" ? "Cancel this request?" : "Cancel this booking?",
            body: `${r.car.brand} ${r.car.model}, ${fmt.range(r.pickupDate, r.returnDate)}. The car will be free for other customers.`,
            confirmLabel: "Cancel rental",
            cancelLabel: "Keep it",
            danger: true,
          });
          if (!ok) return;
          await Api.setRentalStatus(r.id, "cancelled");
          close();
          App.toast("Rental cancelled.");
          load();
        },
      });
    }
    if (r.status === "completed" || r.status === "rejected" || r.status === "cancelled") {
      actions.push({
        label: "Rent this car again",
        variant: "btn-dark",
        icon: "arrow-clockwise",
        onClick: () => (location.href = App.carUrl(r.car)),
      });
    }
    App.rentalDrawer.open(r, { audience: "customer", actions });
  }

  await load();
});
