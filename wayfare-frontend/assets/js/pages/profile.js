/* Profile: three small forms that save through Api.updateProfile. */
App.ready(() => {
  const { $, icon, fmt, esc } = App;
  const me = DB.me;

  function renderCard() {
    const count = DB.rentals.filter((r) => r.customerId === me.id && ["completed", "active"].includes(r.status)).length;
    const soon = me.licenseExpiry && fmt.parse(me.licenseExpiry) - fmt.parse(DB.today) < 90 * 86400000;
    $("#profile-card").innerHTML = `
      ${App.avatar(me.name, 84)}
      <h2>${esc(me.name)}</h2>
      <p class="muted">${esc(me.email)}</p>
      <div style="margin-top:10px">
        ${me.licenseVerified ? `<span class="status status--ok">License verified</span>` : `<span class="status status--warn">License not checked yet</span>`}
      </div>
      <dl class="kv profile-facts">
        <div><dt>Member since</dt><dd>${fmt.date(me.joined)}</dd></div>
        <div><dt>Rentals taken</dt><dd>${count}</dd></div>
        <div><dt>License expires</dt><dd>${me.licenseExpiry ? fmt.date(me.licenseExpiry) : "Not added"}</dd></div>
      </dl>
      ${soon ? `<div class="notice is-warn" style="margin-top:16px;text-align:left">${icon("warning")}<div>Your license expires soon. Update it before you book.</div></div>` : ""}`;
  }

  // Fill the forms
  $("#p-name").value = me.name;
  $("#p-email").value = me.email;
  $("#p-phone").value = me.phone;
  $("#p-license").value = me.licenseNumber;
  $("#p-expiry").value = me.licenseExpiry || "";
  renderCard();

  async function save(form, patch, message) {
    if (!App.validate(form)) return;
    const btn = $("[type=submit]", form);
    App.setLoading(btn, true);
    try {
      const updated = await Api.updateProfile(patch);
      Object.assign(me, updated);
      renderCard();
      App.toast(message);
    } catch (err) {
      App.toast(err.message || "Could not save. Try again.", { error: true });
    } finally {
      App.setLoading(btn, false);
    }
  }

  $("#form-personal").addEventListener("submit", (e) => {
    e.preventDefault();
    save(e.currentTarget, { name: $("#p-name").value.trim(), email: $("#p-email").value.trim(), phone: $("#p-phone").value.trim() }, "Personal details saved.");
  });

  $("#form-license").addEventListener("submit", (e) => {
    e.preventDefault();
    save(e.currentTarget, { licenseNumber: $("#p-license").value.trim(), licenseExpiry: $("#p-expiry").value, licenseVerified: false }, "License saved. Staff will check it at pick-up.");
  });

  $("#form-password").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!App.validate(form)) return;
    const btn = $("[type=submit]", form);
    App.setLoading(btn, true);
    await new Promise((r) => setTimeout(r, 500)); // stand-in for POST /api/me/password
    App.setLoading(btn, false);
    form.reset();
    App.toast("Password updated.");
  });
});
