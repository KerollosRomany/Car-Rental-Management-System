/* Staff: my profile. Personal details and password. */
App.ready(() => {
  const { $, esc } = App;
  const me = DB.staff;

  function renderCard() {
    $("#profile-card").innerHTML = `
      ${App.avatar(me.name, 84)}
      <h2>${esc(me.name)}</h2>
      <p class="muted">${esc(me.email)}</p>
      <div style="margin-top:10px"><span class="status status--info">${esc(me.role)}</span></div>
      <dl class="kv profile-facts">
        <div><dt>Phone</dt><dd>${esc(me.phone)}</dd></div>
        <div><dt>Access</dt><dd>Staff console</dd></div>
      </dl>`;
  }

  $("#a-name").value = me.name;
  $("#a-email").value = me.email;
  $("#a-phone").value = me.phone;
  renderCard();

  $("#form-personal").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!App.validate(form)) return;
    const btn = $("[type=submit]", form);
    App.setLoading(btn, true);
    try {
      Object.assign(me, await Api.updateStaffProfile({ name: $("#a-name").value.trim(), email: $("#a-email").value.trim(), phone: $("#a-phone").value.trim() }));
      renderCard();
      App.toast("Profile saved.");
    } finally {
      App.setLoading(btn, false);
    }
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
