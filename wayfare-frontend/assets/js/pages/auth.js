/* Login, register and staff login (data-auth-form).
   Checks the fields, then calls the backend through Api:
   - login     POST /api/Authentication/login
   - register  POST /api/Authentication/register (multipart, with the license photo), then logs in
   - staff     POST /api/Authentication/login, and the account must have the Admin role
   The JWT is stored by Api (localStorage "authToken"). */
App.ready(() => {
  const form = App.$("[data-auth-form]");
  if (!form) return;
  const kind = form.dataset.authForm; // "login" | "register" | "staff"
  const submitBtn = App.$("[type=submit]", form);

  // Password strength meter (register only)
  const pw = App.$("#password", form);
  const meter = App.$(".meter", form);
  if (kind === "register" && pw && meter) {
    pw.addEventListener("input", () => {
      const v = pw.value;
      let level = 0;
      if (v.length >= 8) level++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) level++;
      if (/\d/.test(v)) level++;
      if (/[^A-Za-z0-9]/.test(v) || v.length >= 14) level++;
      meter.dataset.level = v ? Math.max(1, level) : 0;
      const label = App.$("[data-meter-label]", form);
      if (label) label.textContent = v ? ["", "Weak", "Fair", "Good", "Strong"][Math.max(1, level)] : "Use 8 or more characters.";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!App.validate(form)) return;
    const email = App.$("#email", form).value.trim();
    const password = App.$("#password", form).value;
    App.setLoading(submitBtn, true);
    try {
      if (kind === "register") {
        const fd = new FormData();
        fd.append("Name", App.$("#name", form).value.trim());
        fd.append("Email", email);
        fd.append("Phone", App.$("#phone", form).value.trim());
        fd.append("Password", password);
        fd.append("LicenseExpiry", App.$("#licenseExpiry", form).value);
        const photo = App.$("#licensePhoto", form).files[0];
        if (photo) fd.append("LicensePhoto", photo, photo.name);
        await Api.register(fd);
        await Api.login({ email, password }); // register does not return a token
        App.toast("Account created. Welcome to Wayfare!");
      } else {
        const user = await Api.login({ email, password });
        if (kind === "staff" && user.role !== "Admin") {
          Api.logout();
          throw new Error("This account does not have staff access.");
        }
        if (kind === "login" && user.role === "Admin") {
          Api.logout();
          throw new Error("This is a staff account. Use the staff login.");
        }
        App.toast("Logged in. Redirecting...");
      }
      setTimeout(() => (location.href = "index.html"), 800);
    } catch (err) {
      App.toast(err.message || "Something went wrong. Try again.", { error: true });
      App.setLoading(submitBtn, false);
    }
  });
});
