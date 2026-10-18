
/* Login, register and staff login (data-auth-form).
   This only checks the fields and shows the button state. The server does the
   real work: set the form's action and method="post" and remove the redirect
   at the bottom, and the browser will submit it for real. */
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
    if(kind === "staff") {
      const payload = {
        email:App.$("#email",form).value.trim() ?? "",
        password:App.$("#password",form).value ?? ""
      }
      App.setLoading(submitBtn, true);
      const API_BASE = "http://localhost:5290"
      try {
        const response = await fetch(`${API_BASE}/api/auth/admin`, {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "Accept":"application/json"
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if(!response.ok){
          let errorMsg = data.message;
          if(data.errors && Array.isArray(data.errors)) {
            errorMsg = data.errors.join("\n");
          }else if(data.errors && typeof data.errors === "object") {
            errorMsg = Object.values(data.errors).flat().join("\n");
          }
          throw new Error(errorMsg || "Login Failed!");
        }
        if(data.token){
          localStorage.setItem("authToken",data.token);
          localStorage.setItem("currentUser",JSON.stringify({
            userId: data.id,
            email: data.email,
            name: data.name,
            role: data.role
          }));
        }
          App.toast("Login Successeful! Redirecting to home page ...");
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1200);
      } catch(err) {
        App.toast(err.message , { error : true});
      } finally{
        App.setLoading(submitBtn , false);
      }
    }
  });
});
