<<<<<<< HEAD
=======

>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
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
<<<<<<< HEAD
    
    const API_BASE = "http://localhost:5290";
    App.setLoading(submitBtn, true);

    try {
      if(kind === "staff") {
        const payload = {
          email: App.$("#email",form).value.trim() ?? "",
          password: App.$("#password",form).value ?? ""
        };
        const response = await fetch(`${API_BASE}/api/auth/admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
=======
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
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
<<<<<<< HEAD
        
=======
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
        if(!response.ok){
          let errorMsg = data.message;
          if(data.errors && Array.isArray(data.errors)) {
            errorMsg = data.errors.join("\n");
<<<<<<< HEAD
          } else if(data.errors && typeof data.errors === "object") {
=======
          }else if(data.errors && typeof data.errors === "object") {
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
            errorMsg = Object.values(data.errors).flat().join("\n");
          }
          throw new Error(errorMsg || "Login Failed!");
        }
<<<<<<< HEAD
        
        if(data.token){
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("currentUser", JSON.stringify({
=======
        if(data.token){
          localStorage.setItem("authToken",data.token);
          localStorage.setItem("currentUser",JSON.stringify({
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
            userId: data.id,
            email: data.email,
            name: data.name,
            role: data.role
          }));
        }
<<<<<<< HEAD
        App.toast("Login Successful! Redirecting to home page ...");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1200);

      } else if (kind === "register") {
        const formData = new FormData(form);
        
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          body: formData
        });
        
        const text = await response.text();
        let data = {};
        if (text) {
          try { data = JSON.parse(text); } catch(e) {}
        }
        
        if(!response.ok) {
          let errorMsg = data.message || `Registration Failed! Server returned status: ${response.status}`;
          if (data.errors && typeof data.errors === "object") {
            errorMsg = Object.values(data.errors).flat().join("\n");
          }
          throw new Error(errorMsg);
        }

        App.toast("Account created successfully! Redirecting to login...");
        setTimeout(() => window.location.href = "login.html", 1200);

      } else if (kind === "login") {
        const payload = {
          email: App.$("#email",form).value.trim() ?? "",
          password: App.$("#password",form).value ?? ""
        };
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });
        
        const text = await response.text();
        let data = {};
        if (text) {
          try { data = JSON.parse(text); } catch(e) {}
        }
        
        if(!response.ok){
          let errorMsg = data.message || `Login Failed! Server returned status: ${response.status}`;
          if(data.errors && typeof data.errors === "object") {
            errorMsg = Object.values(data.errors).flat().join("\n");
          }
          throw new Error(errorMsg);
        }
        
        if(data.token){
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("currentUser", JSON.stringify({
            userId: data.id,
            email: data.email,
            name: data.name,
            role: data.role
          }));
        }
        App.toast("Login Successful! Redirecting to home page ...");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1200);
      }
    } catch(err) {
      App.toast(err.message, { error: true });
    } finally {
      App.setLoading(submitBtn, false);
    }
  });
});
=======
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
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
