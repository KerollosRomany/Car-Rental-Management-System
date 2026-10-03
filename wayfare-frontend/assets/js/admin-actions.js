/* ==========================================================================
   Staff actions on a rental: approve, reject, hand over keys, record return.
   Shared by the dashboard and the rentals page. Each action returns a Promise
   that resolves true when something changed, false when the staff member backed out.
   ========================================================================== */
(function () {
  "use strict";

  const { $, esc, fmt, icon } = App;

  function dialog(id, markup) {
    let d = document.getElementById(id);
    if (!d) {
      d = document.createElement("dialog");
      d.id = id;
      d.className = "modal";
      document.body.appendChild(d);
    }
    d.innerHTML = markup;
    return d;
  }

  const first = (r) => r.customer.name.split(" ")[0];
  const carName = (r) => `${r.car.brand} ${r.car.model}`;

  // Keep the sidebar count in step with the data.
  function refreshPendingBadge() {
    const n = DB.rentals.filter((r) => r.status === "pending").length;
    const badge = $('.side-link[href$="rentals.html"] .count-badge');
    if (badge) {
      badge.textContent = n;
      badge.hidden = n === 0;
    }
  }

  const AdminActions = {
    refreshPendingBadge,

    async approve(r) {
      await Api.setRentalStatus(r.id, "approved");
      refreshPendingBadge();
      App.toast(`Request ${r.id} approved. ${first(r)} can see it in their account.`);
      return true;
    },

    reject(r) {
      return new Promise((resolve) => {
        const d = dialog(
          "reject-dialog",
          `
          <div class="dialog-head">
            <div><h3>Reject request ${esc(r.id)}?</h3><p>${esc(r.customer.name)} asked for the ${esc(carName(r))} from ${fmt.range(r.pickupDate, r.returnDate)}. They will see your reason.</p></div>
            <button class="icon-btn" type="button" data-close aria-label="Close">${icon("x")}</button>
          </div>
          <div class="dialog-body stack" style="--stack-gap:16px">
            <div class="field">
              <label class="label" for="rj-reason">Reason</label>
              <select class="select" id="rj-reason">
                <option>The car is not available for those dates.</option>
                <option>The driving license could not be accepted.</option>
                <option>The details do not match our records.</option>
                <option>Other reason.</option>
              </select>
            </div>
            <div class="field">
              <label class="label" for="rj-note">Note to the customer <span class="muted">(optional)</span></label>
              <textarea class="textarea" id="rj-note" rows="3" placeholder="Add anything that will help them rebook."></textarea>
            </div>
          </div>
          <div class="dialog-foot">
            <button class="btn btn-secondary" type="button" data-close>Keep request</button>
            <button class="btn btn-danger-solid" type="button" id="rj-confirm">Reject request</button>
          </div>`
        );
        let changed = false;
        $("#rj-confirm", d).onclick = async (e) => {
          App.setLoading(e.currentTarget, true);
          const note = $("#rj-note", d).value.trim();
          const reason = $("#rj-reason", d).value + (note ? ` ${note}` : "");
          await Api.setRentalStatus(r.id, "rejected", { reason });
          changed = true;
          d.close();
          refreshPendingBadge();
          App.toast(`Request ${r.id} rejected.`);
        };
        d.onclose = () => resolve(changed);
        d.showModal();
      });
    },

    async pickup(r) {
      const ok = await App.confirm({
        title: "Hand over the keys?",
        body: `Check the driving license first: ${r.customer.licenseNumber}, valid until ${fmt.date(r.customer.licenseExpiry)}. The ${carName(r)} will be marked as rented.`,
        confirmLabel: "Hand over keys",
        cancelLabel: "Not yet",
      });
      if (!ok) return false;
      await Api.setRentalStatus(r.id, "active");
      App.toast(`${carName(r)} is now rented to ${first(r)}.`);
      return true;
    },

    returnCar(r) {
      return new Promise((resolve) => {
        const overdue = Math.round((fmt.parse(DB.today) - fmt.parse(r.returnDate)) / 86400000);
        const d = dialog(
          "return-dialog",
          `
          <div class="dialog-head">
            <div><h3>Record return</h3><p>${esc(carName(r))} from ${esc(r.customer.name)}. The car becomes available again.</p></div>
            <button class="icon-btn" type="button" data-close aria-label="Close">${icon("x")}</button>
          </div>
          <div class="dialog-body stack" style="--stack-gap:18px">
            ${overdue > 0 ? `<div class="notice is-warn">${icon("warning")}<div>This rental is ${fmt.plural(overdue, "day")} overdue. Add a late fee under extra charges if it applies.</div></div>` : ""}
            <div class="form-grid">
              <div class="field">
                <label class="label" for="rt-date">Returned on</label>
                <input class="input" id="rt-date" type="date" value="${DB.today}" max="${DB.today}">
              </div>
              <div class="field">
                <label class="label" for="rt-cond">Condition</label>
                <select class="select" id="rt-cond">
                  <option>Good</option><option>Needs cleaning</option><option>Minor scratch</option><option>Damage to report</option>
                </select>
              </div>
              <div class="field span-2">
                <label class="label" for="rt-extra">Extra charges (USD)</label>
                <input class="input" id="rt-extra" type="number" min="0" step="1" value="0" inputmode="numeric">
                <p class="hint">Late fees, cleaning or damage. Added to the rental total of ${fmt.money(r.total)}.</p>
              </div>
              <div class="field span-2">
                <label class="label" for="rt-notes">Notes <span class="muted">(optional)</span></label>
                <textarea class="textarea" id="rt-notes" rows="2"></textarea>
              </div>
            </div>
          </div>
          <div class="dialog-foot">
            <button class="btn btn-secondary" type="button" data-close>Cancel</button>
            <button class="btn btn-primary" type="button" id="rt-confirm">Confirm return</button>
          </div>`
        );
        let changed = false;
        $("#rt-confirm", d).onclick = async (e) => {
          const date = $("#rt-date", d).value || DB.today;
          App.setLoading(e.currentTarget, true);
          await Api.setRentalStatus(r.id, "completed", {
            returnedAt: date,
            condition: $("#rt-cond", d).value,
            extraCharge: Number($("#rt-extra", d).value) || 0,
            notes: $("#rt-notes", d).value.trim(),
          });
          changed = true;
          d.close();
          App.toast(`Return recorded. ${carName(r)} is available again.`);
        };
        d.onclose = () => resolve(changed);
        d.showModal();
      });
    },

    /* Buttons for a row or drawer, by status. */
    buttons(r) {
      switch (r.status) {
        case "pending":
          return [
            { key: "approve", label: "Approve", variant: "btn-dark", icon: "check" },
            { key: "reject", label: "Reject", variant: "btn-danger", icon: "x" },
          ];
        case "approved":
          return [{ key: "pickup", label: "Hand over keys", variant: "btn-dark", icon: "key" }];
        case "active":
          return [{ key: "returnCar", label: "Record return", variant: "btn-primary", icon: "flag-checkered" }];
        default:
          return [];
      }
    },
  };

  window.AdminActions = AdminActions;
})();
