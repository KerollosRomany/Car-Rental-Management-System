/* Staff: customers. Search, license checks, history, add and edit. */
App.ready(async () => {
  const { $, icon, fmt, esc } = App;
  const state = { q: "", license: "" };
  let customers = [];

  $("#customers-table").innerHTML = `<div style="padding:24px" class="stack"><div class="skeleton" style="height:48px"></div><div class="skeleton" style="height:48px"></div><div class="skeleton" style="height:48px"></div></div>`;

  const daysLeft = (c) => (c.licenseExpiry ? Math.round((fmt.parse(c.licenseExpiry) - fmt.parse(DB.today)) / 86400000) : null);

  // One badge per customer, worst news first.
  function licenseBadge(c) {
    const d = daysLeft(c);
    if (d !== null && d < 0) return `<span class="status status--danger">Expired</span>`;
    if (d !== null && d <= 90) return `<span class="status status--warn">Expires in ${d} days</span>`;
    if (!c.licenseVerified) return `<span class="status status--warn">Not checked</span>`;
    return `<span class="status status--ok">Verified</span>`;
  }

  async function load() {
    customers = await Api.getCustomers();
    render();
  }

  function filtered() {
    const q = state.q.toLowerCase();
    return customers.filter((c) => {
      const d = daysLeft(c);
      return (
        (!q || `${c.name} ${c.email} ${c.phone} ${c.licenseNumber}`.toLowerCase().includes(q)) &&
        (state.license !== "unchecked" || !c.licenseVerified) &&
        (state.license !== "expiring" || (d !== null && d <= 90))
      );
    });
  }

  function render() {
    const list = filtered();
    $("#customers-sub").textContent = `${fmt.plural(customers.length, "customer")}. ${customers.filter((c) => !c.licenseVerified).length} licenses still to check.`;
    $("#customers-count").textContent = `${fmt.plural(list.length, "customer")}`;
    const box = $("#customers-table");
    if (!list.length) {
      box.innerHTML = App.empty({ icon: "users-three", title: "No customers found", text: "Try a different search or clear the filter." });
      return;
    }
    box.innerHTML = `
      <table class="table" style="min-width:900px">
        <thead><tr><th>Customer</th><th>Phone</th><th>Driving license</th><th>Status</th><th style="text-align:right">Rentals</th><th>Joined</th><th></th></tr></thead>
        <tbody>
          ${list
            .map(
              (c) => `
            <tr data-id="${esc(c.id)}" class="is-clickable">
              <td><div class="cell-main">${App.avatar(c.name)}<div><strong>${esc(c.name)}</strong><small>${esc(c.email)}</small></div></div></td>
              <td data-label="Phone" class="num">${esc(c.phone)}</td>
              <td data-label="Driving license"><span class="mono">${esc(c.licenseNumber)}</span><small class="muted" style="display:block">${c.licenseExpiry ? "Valid until " + fmt.date(c.licenseExpiry) : "No expiry added"}</small></td>
              <td data-label="License status">${licenseBadge(c)}</td>
              <td data-label="Rentals" class="num" style="text-align:right;font-weight:600">${c.rentalCount}</td>
              <td data-label="Joined" class="muted">${fmt.date(c.joined)}</td>
              <td class="col-actions"><button class="btn btn-ghost btn-sm" type="button" data-act="view">View${icon("caret-right")}</button></td>
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
  $("#f-license").addEventListener("change", (e) => ((state.license = e.target.value), render()));
  $("#customers-table").addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-id]");
    if (row) openDrawer(customers.find((c) => c.id === row.dataset.id));
  });

  /* ---------- Detail drawer ---------- */
  async function openDrawer(c) {
    let dlg = $("#customer-drawer");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "customer-drawer";
      dlg.className = "drawer";
      dlg.setAttribute("aria-label", "Customer details");
      document.body.appendChild(dlg);
    }
    const history = await Api.getRentals({ customerId: c.id });
    history.sort((a, b) => (a.pickupDate < b.pickupDate ? 1 : -1));
    dlg.innerHTML = `
      <div class="dialog-head">
        <div class="rd-person">${App.avatar(c.name, 52)}<div><h3 style="font-size:1.375rem">${esc(c.name)}</h3><p>Customer since ${fmt.date(c.joined)}</p></div></div>
        <button class="icon-btn" type="button" data-close aria-label="Close">${icon("x")}</button>
      </div>
      <div class="dialog-body stack" style="--stack-gap:26px">
        <dl class="kv">
          <div><dt>Email</dt><dd>${esc(c.email)}</dd></div>
          <div><dt>Phone</dt><dd>${esc(c.phone)}</dd></div>
        </dl>

        <div>
          <h4 style="margin-bottom:12px">Driving license</h4>
          <dl class="kv">
            <div><dt>Number</dt><dd class="mono">${esc(c.licenseNumber)}</dd></div>
            <div><dt>Expiry</dt><dd>${c.licenseExpiry ? fmt.date(c.licenseExpiry) : "Not added"}</dd></div>
            <div><dt>Status</dt><dd>${licenseBadge(c)}</dd></div>
          </dl>
          <label class="check" style="margin-top:16px;align-items:center;gap:12px">
            <input class="switch" type="checkbox" id="d-verified" role="switch" ${c.licenseVerified ? "checked" : ""}>
            <span>I checked this license against the original</span>
          </label>
        </div>

        <div>
          <h4 style="margin-bottom:6px">Rental history</h4>
          ${
            history.length
              ? `<div class="mini-list">${history
                  .map(
                    (r) => `
              <div class="mini-row">
                <img class="thumb-sm" src="${esc(App.img(r.car.images[0], 200))}" alt="" loading="lazy">
                <div><strong>${esc(r.car.brand)} ${esc(r.car.model)}</strong><small>${fmt.range(r.pickupDate, r.returnDate)} &middot; ${fmt.money(r.total)}</small></div>
                ${App.status("rental", r.status)}
              </div>`
                  )
                  .join("")}</div>`
              : `<p class="muted" style="padding:12px 0">No rentals yet.</p>`
          }
        </div>
      </div>
      <div class="dialog-foot">
        <button class="btn btn-secondary" type="button" data-close>Close</button>
        <button class="btn btn-dark" type="button" id="d-edit">${icon("pencil-simple")}Edit details</button>
      </div>`;
    $("#d-verified", dlg).addEventListener("change", async (e) => {
      await Api.saveCustomer({ id: c.id, licenseVerified: e.target.checked });
      App.toast(e.target.checked ? `${c.name}'s license marked as checked.` : "License check removed.");
      await load();
      openDrawerRefresh(c.id);
    });
    $("#d-edit", dlg).addEventListener("click", () => {
      dlg.close();
      openForm(c);
    });
    App.openDialog(dlg);
  }

  // Reopen after a change so the status badge in the drawer stays current.
  function openDrawerRefresh(id) {
    const c = customers.find((x) => x.id === id);
    const dlg = $("#customer-drawer");
    if (c && dlg && dlg.open) openDrawer(c);
  }

  /* ---------- Add / edit ---------- */
  const dlg = $("#customer-dialog");
  const form = $("#customer-form");
  let editing = null;

  function openForm(c) {
    editing = c || null;
    form.reset();
    App.$$(".field", form).forEach((f) => f.classList.remove("has-error"));
    $("#customer-dialog-title").textContent = c ? "Edit customer" : "Add customer";
    if (c) {
      form.elements.name.value = c.name;
      form.elements.email.value = c.email;
      form.elements.phone.value = c.phone;
      form.elements.licenseNumber.value = c.licenseNumber;
      form.elements.licenseExpiry.value = c.licenseExpiry || "";
      form.elements.licenseVerified.checked = Boolean(c.licenseVerified);
    }
    App.openDialog(dlg);
  }
  $("#add-customer").addEventListener("click", () => openForm());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!App.validate(form)) return;
    const f = form.elements;
    const data = {
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      licenseNumber: f.licenseNumber.value.trim(),
      licenseExpiry: f.licenseExpiry.value,
      licenseVerified: f.licenseVerified.checked,
    };
    if (editing) data.id = editing.id;
    const btn = $("#customer-save");
    App.setLoading(btn, true);
    try {
      await Api.saveCustomer(data);
      App.closeDialog(dlg);
      App.toast(editing ? `${data.name} updated.` : `${data.name} added.`);
      await load();
    } finally {
      App.setLoading(btn, false);
    }
  });

  await load();
});
