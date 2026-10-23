/* Staff dashboard: key numbers, two charts, waiting requests, cars due back. */
App.ready(async () => {
  const { $, icon, fmt, esc } = App;

  const staff = DB.staff;
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  $("#greeting").textContent = `Good ${part}, ${staff.name.split(" ")[0]}`;
  $("#today-line").textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  Charts.viewToggle($("#chart-monthly").closest(".card"));
  Charts.viewToggle($("#chart-types").closest(".card"));

  /* Loading state for the tables while data arrives */
  $("#requests-table").innerHTML = `<div style="padding:24px" class="stack"><div class="skeleton" style="height:44px"></div><div class="skeleton" style="height:44px"></div></div>`;

  async function load() {
    const data = await Api.getDashboard();
    renderStats(data);
    renderCharts(data);
    renderRequests(data.pending);
    renderDue(data.active);
    AdminActions.refreshPendingBadge();
  }

  /* ---------- Stat tiles ---------- */
  function renderStats(d) {
    const oldest = d.pending.length ? d.pending.map((r) => r.createdAt).sort()[0] : null;
    const dueSoon = d.active.filter((r) => fmt.parse(r.returnDate) - fmt.parse(DB.today) <= 3 * 86400000).length;
    const tiles = [
      ["car-profile", "Cars in the fleet", d.cars.total, `${d.cars.available} available, ${d.cars.rented} rented, ${d.cars.maintenance} in maintenance`],
      ["hourglass", "Requests waiting", d.pending.length, oldest ? `Oldest was sent ${fmt.relative(oldest)}` : "All caught up"],
      ["key", "Active rentals", d.active.length, dueSoon ? `${dueSoon} due back in the next 3 days` : "None due back soon"],
      ["currency-dollar", "Revenue, last 30 days", fmt.money(d.revenue.amount), `From ${fmt.plural(d.revenue.count, "paid rental")}`],
    ];
    $("#stats").innerHTML = tiles
      .map(
        ([ic, label, value, sub]) => `
        <div class="card stat">
          <div class="stat-label">${icon(ic)}${esc(label)}</div>
          <div class="stat-value">${esc(value)}</div>
          <div class="stat-sub">${esc(sub)}</div>
        </div>`
      )
      .join("");
  }

  /* ---------- Charts and their table twins ---------- */
  function renderCharts(d) {
    Charts.columns($("#chart-monthly"), {
      labels: d.monthly.map((m) => m.label),
      values: d.monthly.map((m) => m.rentals),
      unit: "rentals",
      last: "so far",
    });
    Charts.table($("#table-monthly"), ["Month", "Rentals"], d.monthly.map((m) => [m.label, m.rentals]));

    const rows = d.byCategory.slice().sort((a, b) => b.count - a.count).map((c) => ({ label: c.name, value: c.count }));
    Charts.hbars($("#chart-types"), { rows, unit: "cars" });
    Charts.table($("#table-types"), ["Type", "Cars"], rows.map((r) => [r.label, r.value]));
  }

  /* ---------- Waiting requests ---------- */
  function renderRequests(list) {
    $("#requests-sub").textContent = list.length ? `${fmt.plural(list.length, "request")} to review.` : "Nothing to review right now.";
    const box = $("#requests-table");
    if (!list.length) {
      box.innerHTML = App.empty({ icon: "seal-check", title: "All caught up", text: "New rental requests from customers will appear here." });
      return;
    }
    box.innerHTML = `
      <table class="table" style="min-width:600px">
        <thead><tr><th>Customer</th><th>Car and dates</th><th></th></tr></thead>
        <tbody>
          ${list
            .map(
              (r) => `
            <tr data-id="${esc(r.id)}">
              <td><div class="cell-main">${App.avatar(r.customer.name)}<div><strong>${esc(r.customer.name)}</strong><small>Sent ${esc(fmt.relative(r.createdAt))}</small></div></div></td>
              <td data-span="full"><div class="cell-main"><img class="thumb-sm" src="${esc(App.img(r.car.images[0], 200))}" alt="" loading="lazy"><div><strong>${esc(r.car.brand)} ${esc(r.car.model)}</strong><small class="nowrap">${fmt.range(r.pickupDate, r.returnDate)}, ${fmt.plural(r.days, "day")}, ${fmt.money(r.total)}</small></div></div></td>
              <td class="col-actions">
                <button class="btn btn-dark btn-sm" type="button" data-act="approve">${icon("check")}Approve</button>
                <button class="btn btn-danger btn-sm" type="button" data-act="reject">Reject</button>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    box.onclick = async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const r = list.find((x) => x.id === btn.closest("tr").dataset.id);
      if (btn.dataset.act === "approve") {
        App.setLoading(btn, true);
        await AdminActions.approve(r);
        load();
      } else if (await AdminActions.reject(r)) {
        load();
      }
    };
  }

  /* ---------- Due back ---------- */
  function renderDue(list) {
    const box = $("#due-list");
    const sorted = list.slice().sort((a, b) => (a.returnDate < b.returnDate ? -1 : 1));
    if (!sorted.length) {
      box.innerHTML = App.empty({ icon: "car-profile", title: "No cars out", text: "Cars that customers have collected will be listed here." });
      return;
    }
    box.innerHTML = sorted
      .map((r) => {
        const late = r.returnDate < DB.today;
        const when = fmt.relative(r.returnDate);
        return `
        <div class="due-row" data-id="${esc(r.id)}">
          <img class="thumb-sm" src="${esc(App.img(r.car.images[0], 200))}" alt="" loading="lazy">
          <strong class="due-name">${esc(r.car.brand)} ${esc(r.car.model)}</strong>
          <span class="due-pill status ${late ? "status--danger" : when === "today" || when === "tomorrow" ? "status--warn" : ""}">${late ? "Overdue" : "Due " + esc(when)}</span>
          <small class="due-cust">${esc(r.customer.name)}</small>
          <button class="btn btn-secondary btn-sm due-btn" type="button" data-act="return">Return</button>
        </div>`;
      })
      .join("");
    box.onclick = async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const r = sorted.find((x) => x.id === btn.closest(".due-row").dataset.id);
      if (await AdminActions.returnCar(r)) load();
    };
  }

  await load();
});
