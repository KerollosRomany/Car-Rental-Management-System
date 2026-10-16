/* Staff: payments. Read only: the server takes each payment and makes each refund. */
App.ready(async () => {
  const { $, icon, fmt, esc } = App;
  const state = { q: "", status: "" };
  let payments = [];

  $("#payments-table").innerHTML = `<div style="padding:24px" class="stack"><div class="skeleton" style="height:48px"></div><div class="skeleton" style="height:48px"></div></div>`;

  async function load() {
    payments = await Api.getPayments();
    renderStats();
    render();
  }

  function renderStats() {
    const since = DB.helpers.day(-30);
    const recent = payments.filter((p) => p.paidAt >= since);
    const refunds = recent.filter((p) => p.refunded > 0);
    const fees = payments.filter((p) => p.status === "partial");
    const sum = (list, key) => list.reduce((s, p) => s + p[key], 0);
    const tiles = [
      ["money", "Paid in, last 30 days", fmt.money(sum(recent, "paid")), fmt.plural(recent.length, "payment")],
      ["arrow-counter-clockwise", "Refunded, last 30 days", fmt.money(sum(refunds, "refunded")), refunds.length ? fmt.plural(refunds.length, "refund") : "No refunds"],
      ["receipt", "Cancellation fees", fmt.money(sum(fees, "kept")), "10% kept when a customer cancels after approval"],
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

  function filtered() {
    const q = state.q.toLowerCase();
    return payments.filter(
      (p) =>
        (!q || `${p.rentalId} ${p.customer.name} ${p.car.brand} ${p.car.model}`.toLowerCase().includes(q)) &&
        (!state.status || p.status === state.status)
    );
  }

  function render() {
    const list = filtered();
    $("#payments-count").textContent = fmt.plural(list.length, "payment");
    const box = $("#payments-table");
    if (!list.length) {
      box.innerHTML = App.empty({ icon: "receipt", title: "No payments found", text: "Try a different search or status." });
      return;
    }
    box.innerHTML = `
      <table class="table" style="min-width:900px">
        <thead><tr><th>Customer</th><th>Rental</th><th>Paid on</th><th style="text-align:right">Paid</th><th style="text-align:right">Refunded</th><th style="text-align:right">Kept</th><th>Status</th></tr></thead>
        <tbody>
          ${list
            .map(
              (p) => `
            <tr>
              <td data-span="full"><div class="cell-main">${App.avatar(p.customer.name)}<div><strong>${esc(p.customer.name)}</strong><small>${esc(p.customer.email)}</small></div></div></td>
              <td data-label="Rental"><span class="mono">${esc(p.rentalId)}</span><small class="muted" style="display:block">${esc(p.car.brand)} ${esc(p.car.model)}, ${esc(App.statusLabel("rental", p.rentalStatus))}</small></td>
              <td data-label="Paid on" class="muted nowrap">${fmt.date(p.paidAt)}</td>
              <td data-label="Paid" class="num" style="text-align:right;font-weight:600">${fmt.money2(p.paid)}</td>
              <td data-label="Refunded" class="num muted" style="text-align:right">${p.refunded ? fmt.money2(p.refunded) : "&mdash;"}</td>
              <td data-label="Kept" class="num" style="text-align:right">${fmt.money2(p.kept)}</td>
              <td data-label="Status">${App.status("payment", p.status)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }

  let timer;
  $("#q").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => ((state.q = e.target.value.trim()), render()), 150);
  });
  $("#f-status").addEventListener("change", (e) => ((state.status = e.target.value), render()));

  await load();
});
