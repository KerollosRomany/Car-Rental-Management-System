/* Staff: payments. Totals, filters, mark paid, refund, record a payment. */
App.ready(async () => {
  const { $, icon, fmt, esc } = App;
  const state = { q: "", status: "", method: "" };
  let payments = [];

  $("#payments-table").innerHTML = `<div style="padding:24px" class="stack"><div class="skeleton" style="height:48px"></div><div class="skeleton" style="height:48px"></div></div>`;

  async function load() {
    payments = await Api.getPayments();
    renderStats();
    render();
  }

  function renderStats() {
    const since = DB.helpers.day(-30);
    const sum = (list) => list.reduce((s, p) => s + p.amount, 0);
    const collected = payments.filter((p) => p.status === "paid" && p.date >= since);
    const waiting = payments.filter((p) => p.status === "pending");
    const refunded = payments.filter((p) => p.status === "refunded");
    const tiles = [
      ["money", "Collected, last 30 days", fmt.money(sum(collected)), `${fmt.plural(collected.length, "payment")}`],
      ["hourglass", "Waiting to be paid", fmt.money(sum(waiting)), waiting.length ? `${fmt.plural(waiting.length, "payment")} still open` : "Everything is settled"],
      ["arrow-counter-clockwise", "Refunded", fmt.money(sum(refunded)), `${fmt.plural(refunded.length, "refund")}`],
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
        (!q || `${p.id} ${p.rentalId} ${p.customer.name} ${p.car.brand} ${p.car.model}`.toLowerCase().includes(q)) &&
        (!state.status || p.status === state.status) &&
        (!state.method || p.method === state.method)
    );
  }

  function render() {
    const list = filtered();
    $("#payments-count").textContent = fmt.plural(list.length, "payment");
    const box = $("#payments-table");
    if (!list.length) {
      box.innerHTML = App.empty({ icon: "receipt", title: "No payments found", text: "Try a different search, or record a payment with the button above." });
      return;
    }
    box.innerHTML = `
      <table class="table" style="min-width:960px">
        <thead><tr><th>Payment</th><th>Customer</th><th>Rental</th><th>Method</th><th>Date</th><th style="text-align:right">Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${list
            .map(
              (p) => `
            <tr data-id="${esc(p.id)}">
              <td class="mono">${esc(p.id)}</td>
              <td data-span="full"><div class="cell-main">${App.avatar(p.customer.name)}<div><strong>${esc(p.customer.name)}</strong><small>${esc(p.customer.email)}</small></div></div></td>
              <td data-label="Rental"><span class="mono">${esc(p.rentalId)}</span><small class="muted" style="display:block">${esc(p.car.brand)} ${esc(p.car.model)}</small></td>
              <td data-label="Method" class="nowrap">${esc(p.method)}</td>
              <td data-label="Date" class="muted nowrap">${fmt.date(p.date)}</td>
              <td data-label="Amount" class="num" style="text-align:right;font-weight:600">${fmt.money(p.amount)}</td>
              <td data-label="Status">${App.status("payment", p.status)}</td>
              <td class="col-actions">
                ${p.status === "pending" ? `<button class="btn btn-dark btn-sm" type="button" data-act="paid">${icon("check")}Mark as paid</button>` : ""}
                ${p.status === "paid" ? `<button class="btn btn-ghost btn-sm" type="button" data-act="refund">Refund</button>` : ""}
              </td>
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
  $("#f-method").addEventListener("change", (e) => ((state.method = e.target.value), render()));

  $("#payments-table").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const p = payments.find((x) => x.id === btn.closest("tr").dataset.id);
    if (btn.dataset.act === "paid") {
      App.setLoading(btn, true);
      await Api.setPaymentStatus(p.id, "paid");
      App.toast(`${p.id} marked as paid.`);
    } else {
      const ok = await App.confirm({
        title: `Refund ${fmt.money(p.amount)}?`,
        body: `This marks ${p.id} from ${p.customer.name} as refunded. Return the money through the original payment method.`,
        confirmLabel: "Mark as refunded",
        danger: true,
      });
      if (!ok) return;
      await Api.setPaymentStatus(p.id, "refunded");
      App.toast(`${p.id} marked as refunded.`);
    }
    load();
  });

  /* ---------- Record payment ---------- */
  const dlg = $("#payment-dialog");
  const form = $("#payment-form");

  async function openForm() {
    form.reset();
    App.$$(".field", form).forEach((f) => f.classList.remove("has-error"));
    const rentals = await Api.getRentals({});
    // Rentals that exist and have no paid payment yet
    const open = rentals.filter((r) => ["approved", "active", "completed"].includes(r.status) && !(r.payment && r.payment.status === "paid"));
    const select = $("#p-rental");
    select.innerHTML =
      `<option value="">Choose a rental</option>` +
      open.map((r) => `<option value="${esc(r.id)}" data-total="${r.total}">${esc(r.id)}, ${esc(r.customer.name)}, ${esc(r.car.brand)} ${esc(r.car.model)}, ${fmt.money(r.total)}</option>`).join("");
    $("#p-date").value = DB.today;
    $("#p-date").max = DB.today;
    App.openDialog(dlg);
  }

  $("#p-rental").addEventListener("change", (e) => {
    const opt = e.target.selectedOptions[0];
    if (opt && opt.dataset.total) $("#p-amount").value = opt.dataset.total;
  });
  $("#add-payment").addEventListener("click", openForm);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!App.validate(form)) return;
    const f = form.elements;
    const btn = $("#payment-save");
    App.setLoading(btn, true);
    try {
      const rentalId = f.rentalId.value;
      const existing = payments.find((p) => p.rentalId === rentalId && p.status !== "paid" && p.status !== "refunded");
      await Api.savePayment({
        ...(existing ? { id: existing.id } : {}),
        rentalId,
        amount: Number(f.amount.value),
        method: f.method.value,
        status: f.status.value,
        date: f.date.value,
      });
      App.closeDialog(dlg);
      App.toast(`Payment of ${fmt.money(Number(f.amount.value))} recorded.`);
      await load();
    } finally {
      App.setLoading(btn, false);
    }
  });

  await load();
});
