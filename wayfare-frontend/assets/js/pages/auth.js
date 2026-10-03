/* Login, register and staff login (data-auth-form).
   This only checks the fields and shows the button state. The server does the
   real work: set the form's action and method="post" and remove the redirect
   at the bottom, and the browser will submit it for real. */
App.ready(() => {
  const form = App.$("[data-auth-form]");
  if (!form) return;
  const kind = form.dataset.authForm; // "login" | "register" | "staff"
  const submit = App.$("[type=submit]", form);

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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!App.validate(form)) return;
    App.setLoading(submit, true);
    // Placeholder for the server round trip: go to the page named in the form's action.
    setTimeout(() => (location.href = form.getAttribute("action") || "index.html"), 500);
  });
});
