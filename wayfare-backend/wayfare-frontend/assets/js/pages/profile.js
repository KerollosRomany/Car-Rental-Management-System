/* Profile: personal details, license photo and expiry, password. */
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
  $("#p-expiry").value = me.licenseExpiry || "";
  App.setUpload($("#form-license .upload"), me.licensePhoto, "Current license photo");
  renderCard();

  async function save(form, patch, message, call = Api.updateProfile) {
    if (!App.validate(form)) return;
    const btn = $("[type=submit]", form);
    App.setLoading(btn, true);
    try {
      const updated = await call(await patch());
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
    save(e.currentTarget, () => ({ name: $("#p-name").value.trim(), email: $("#p-email").value.trim(), phone: $("#p-phone").value.trim() }), "Personal details saved.");
  });

  $("#form-license").addEventListener("submit", (e) => {
    e.preventDefault();
    // Sent as multipart form data: the new photo (if one was chosen) and the expiry date.
    const file = $("#p-photo").files[0];
    save(
      e.currentTarget,
      async () => ({ licenseExpiry: $("#p-expiry").value, ...(file ? { licensePhoto: await App.readImage(file) } : {}) }),
      "License saved. Staff will check it again at pick-up.",
      Api.updateLicense
    );
  });

  $("#form-password").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!App.validate(form)) return;
    const btn = $("[type=submit]", form);
    App.setLoading(btn, true);
    await Api.changePassword({ currentPassword: $("#pw-current").value, newPassword: $("#pw-new").value });
    App.setLoading(btn, false);
    form.reset();
    App.toast("Password updated.");
  });
});
