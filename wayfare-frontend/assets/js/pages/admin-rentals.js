/* Staff: rentals by stage. Requests, approved, active, history. */
App.ready(async () => {
  const { $, icon, fmt, esc } = App;

  const TABS = [
    { key: "requests", label: "Requests", match: (r) => r.status === "pending" },
    { key: "approved", label: "Approved", match: (r) => r.status === "approved" },
    { key: "active", label: "Active", match: (r) => r.status === "active" },
    { key: "history", label: "History", match: (r) => ["completed", "rejected", "cancelled"].includes(r.status) },
  ];
  const EMPTY = {
    requests: ["No requests waiting", "New requests from customers appear here for you to approve or reject."],
    approved: ["Nothing waiting for pick-up", "Approved rentals show here until the customer collects the keys."],
    active: ["No cars out on rent", "Rentals appear here once you hand over the keys."],
    history: ["No history yet", "Completed, rejected and cancelled rentals are kept here."],
  };

  let rentals = [];
  let tab = new URLSearchParams(location.search).get("tab") || "";
  let q = "";

  $("#rentals-table").innerHTML = `<div style="padding:24px" class="stack"><div class="skeleton" style="height:48px"></div><div class="skeleton" style="height:48px"></div></div>`;

  async function load() {
    rentals = await Api.getRentals({});
    if (!TABS.some((t) => t.key === tab)) tab = rentals.some(TABS[0].match) ? "requests" : "active";
    renderTabs();
    renderTable();
    AdminActions.refreshPendingBadge();
  }

  const search = (r) => {
    if (!q) return true;
    return `${r.id} ${r.customer.name} ${r.car.brand} ${r.car.model} ${r.car.plate}`.toLowerCase().includes(q);
  };

  function renderTabs() {
    $("#tabs").innerHTML = TABS.map((t) => {
      const n = rentals.filter(t.match).length;
      return `<button class="tab" role="tab" type="button" data-tab="${t.key}" aria-selected="${t.key === tab}">${t.label}<span class="count">${n}</span></button>`;
    }).join("");
  }

  function renderTable() {
    const t = TABS.find((x) => x.key === tab);
    const list = rentals
      .filter(t.match)
      .filter(search)
      .sort((a, b) => (t.key === "history" ? (a.pickupDate < b.pickupDate ? 1 : -1) : a.pickupDate < b.pickupDate ? -1 : 1));
    $("#result-count").textContent = fmt.plural(list.length, "rental");

    const box = $("#rentals-table");
    if (!list.length) {
      const [title, text] = q ? ["No rentals match your search", "Try a different name, car or reference."] : EMPTY[tab];
      box.innerHTML = App.empty({ icon: "key", title, text });
      return;
    }
    // Inside the first three tabs every row has the same status, so only History shows the column.
    const showStatus = tab === "history";
    box.innerHTML = `
      <table class="table" style="min-width:${showStatus ? 900 : 780}px">
        <thead><tr><th>Customer</th><th>Car</th><th>Dates</th><th style="text-align:right">Total</th>${showStatus ? "<th>Status</th>" : ""}<th></th></tr></thead>
        <tbody>
          ${list
            .map((r) => {
              const buttons = AdminActions.buttons(r)
                .map((b) => `<button class="btn ${b.variant} btn-sm" type="button" data-act="${b.key}">${icon(b.icon)}${esc(b.label)}</button>`)
                .join("");
              const overdue = r.status === "active" && r.returnDate < DB.today;
              return `
              <tr data-id="${esc(r.id)}" class="is-clickable">
                <td><div class="cell-main">${App.avatar(r.customer.name)}<div><strong class="nowrap">${esc(r.customer.name)}</strong><small class="mono">${esc(r.id)}</small></div></div></td>
                <td data-label="Car" data-span="full"><div class="cell-main"><img class="thumb-sm" src="${esc(App.img(r.car.images[0], 200))}" alt="" loading="lazy"><div><strong class="nowrap">${esc(r.car.brand)} ${esc(r.car.model)}</strong><small>${App.plate(r.car.plate)}</small></div></div></td>
                <td data-label="Dates"><strong class="nowrap" style="font-weight:600">${fmt.range(r.pickupDate, r.returnDate)}</strong><small class="muted" style="display:block">${overdue ? `<span class="status status--danger">Overdue</span>` : fmt.plural(r.days, "day")}</small></td>
                <td data-label="Total" class="num" style="text-align:right;font-weight:600">${fmt.money(r.total)}</td>
                ${showStatus ? `<td data-label="Status">${App.status("rental", r.status)}</td>` : ""}
                <td class="col-actions">${buttons || `<button class="btn btn-ghost btn-sm" type="button" data-act="view">View</button>`}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
  }

  /* ---------- Run an action, then refresh ---------- */
  async function run(key, r, btn) {
    if (key === "view") return openDrawer(r);
    if (btn && key === "approve") App.setLoading(btn, true);
    const changed = await AdminActions[key](r);
    if (changed) {
      // Follow the rental to its next stage so the row does not just vanish.
      const next = { approve: "approved", reject: "history", pickup: "active", returnCar: "history" }[key];
      if (next) tab = next;
      await load();
    } else if (btn) {
      App.setLoading(btn, false);
    }
  }

  $("#tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab;
    renderTabs();
    renderTable();
  });

  let timer;
  $("#q").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => ((q = e.target.value.trim().toLowerCase()), renderTable()), 150);
  });

  $("#rentals-table").addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-id]");
    if (!row) return;
    const r = rentals.find((x) => x.id === row.dataset.id);
    const btn = e.target.closest("[data-act]");
    if (btn) return run(btn.dataset.act, r, btn);
    openDrawer(r);
  });

  function openDrawer(r) {
    const actions = AdminActions.buttons(r).map((b) => ({
      label: b.label,
      variant: b.variant,
      icon: b.icon,
      onClick: async (close) => {
        close();
        await run(b.key, r);
      },
    }));
    App.rentalDrawer.open(r, { audience: "staff", actions });
  }

  await load();
});
