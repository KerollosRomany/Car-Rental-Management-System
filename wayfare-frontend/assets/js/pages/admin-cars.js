/* Staff: manage cars. Search, filter, paginate, add, edit, delete. */
App.ready(async () => {
  const { $, $$, icon, fmt, esc } = App;
  const PAGE = 8;
  const state = { q: "", cat: "", status: "", page: 1 };
  let cars = [];

  $("#f-cat").innerHTML = `<option value="">All types</option>` + DB.categories.map((c) => `<option>${c}</option>`).join("");
  $("#c-category").innerHTML = DB.categories.map((c) => `<option>${c}</option>`).join("");
  $("#cars-table").innerHTML = `<div style="padding:24px" class="stack"><div class="skeleton" style="height:48px"></div><div class="skeleton" style="height:48px"></div><div class="skeleton" style="height:48px"></div></div>`;

  async function load() {
    cars = await Api.getCars({});
    render();
  }

  function filtered() {
    const q = state.q.toLowerCase();
    return cars.filter(
      (c) =>
        (!q || `${c.brand} ${c.model} ${c.plate}`.toLowerCase().includes(q)) &&
        (!state.cat || c.category === state.cat) &&
        (!state.status || c.status === state.status)
    );
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PAGE, state.page * PAGE);
    const free = cars.filter((c) => c.status === "available").length;
    $("#cars-sub").textContent = `${fmt.plural(cars.length, "car")} in the fleet, ${free} available now.`;

    if (!slice.length) {
      $("#cars-table").innerHTML = App.empty({
        icon: "car-profile",
        title: cars.length ? "No cars match your search" : "No cars in the fleet yet",
        text: cars.length ? "Try a different word or clear the filters." : "Add your first car so customers can request it.",
        action: cars.length ? null : { label: "Add car" },
      });
      const add = $("[data-empty-action]");
      if (add) add.addEventListener("click", () => openForm());
    } else {
      $("#cars-table").innerHTML = `
        <table class="table" style="min-width:860px">
          <thead><tr><th>Car</th><th>Plate</th><th>Type</th><th>Specs</th><th style="text-align:right">Daily rate</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${slice
              .map(
                (c) => `
              <tr data-id="${esc(c.id)}">
                <td><div class="cell-main"><img class="thumb-sm" src="${esc(App.img(c.images[0] || "", 200))}" alt="" loading="lazy"><div><strong>${esc(c.brand)} ${esc(c.model)}</strong><small>${esc(c.year)}${c.color ? ", " + esc(c.color) : ""}</small></div></div></td>
                <td data-label="Plate">${App.plate(c.plate)}</td>
                <td data-label="Type">${esc(c.category)}</td>
                <td data-label="Specs" data-span="full" class="muted" style="font-size:.875rem">${esc(c.transmission)}, ${esc(c.fuel)}, ${esc(c.seats)} seats</td>
                <td data-label="Daily rate" class="num" style="text-align:right;font-weight:600">${fmt.money(c.dailyRate)}</td>
                <td data-label="Status">${App.status("car", c.status)}</td>
                <td class="col-actions">
                  <button class="icon-btn" type="button" data-act="edit" aria-label="Edit ${esc(c.brand)} ${esc(c.model)}">${icon("pencil-simple")}</button>
                  <button class="icon-btn danger" type="button" data-act="delete" aria-label="Delete ${esc(c.brand)} ${esc(c.model)}">${icon("trash")}</button>
                </td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`;
    }

    const from = list.length ? (state.page - 1) * PAGE + 1 : 0;
    $("#cars-count").textContent = `Showing ${from} to ${Math.min(state.page * PAGE, list.length)} of ${list.length}`;
    const pager = $("#pager");
    pager.innerHTML =
      pages > 1
        ? `<button type="button" data-p="${state.page - 1}" ${state.page === 1 ? "disabled" : ""} aria-label="Previous page">${icon("caret-left")}</button>` +
          Array.from({ length: pages }, (_, i) => `<button type="button" data-p="${i + 1}" ${i + 1 === state.page ? 'aria-current="page"' : ""}>${i + 1}</button>`).join("") +
          `<button type="button" data-p="${state.page + 1}" ${state.page === pages ? "disabled" : ""} aria-label="Next page">${icon("caret-right")}</button>`
        : "";
  }

  /* ---------- Toolbar and table events ---------- */
  let timer;
  $("#q").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => ((state.q = e.target.value.trim()), (state.page = 1), render()), 150);
  });
  $("#f-cat").addEventListener("change", (e) => ((state.cat = e.target.value), (state.page = 1), render()));
  $("#f-status").addEventListener("change", (e) => ((state.status = e.target.value), (state.page = 1), render()));
  $("#pager").addEventListener("click", (e) => {
    const b = e.target.closest("[data-p]");
    if (b) {
      state.page = Number(b.dataset.p);
      render();
    }
  });

  $("#cars-table").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const car = cars.find((c) => c.id === btn.closest("tr").dataset.id);
    if (btn.dataset.act === "edit") return openForm(car);
    if (car.status === "rented") {
      App.toast(`The ${car.brand} ${car.model} is rented right now. Record its return before deleting it.`, { error: true });
      return;
    }
    const ok = await App.confirm({
      title: `Delete ${car.brand} ${car.model}?`,
      body: "It will disappear from the site. Past rentals keep their history.",
      confirmLabel: "Delete car",
      danger: true,
    });
    if (!ok) return;
    await Api.deleteCar(car.id);
    App.toast(`${car.brand} ${car.model} deleted.`);
    load();
  });

  /* ---------- Add / edit form ---------- */
  const dlg = $("#car-dialog");
  const form = $("#car-form");
  let editing = null;
  let photo = null; // data URL for a newly chosen photo

  const setPreview = (src) => {
    const box = $("#dz-preview");
    box.hidden = !src;
    $("#dz-empty").hidden = Boolean(src);
    box.style.backgroundImage = src ? `url("${src}")` : "";
  };

  function openForm(car) {
    editing = car || null;
    photo = null;
    form.reset();
    $$(".field", form).forEach((f) => f.classList.remove("has-error"));
    $("#car-dialog-title").textContent = car ? `Edit ${car.brand} ${car.model}` : "Add car";
    $("#car-save").textContent = car ? "Save changes" : "Add car";
    if (car) {
      Object.entries({
        brand: car.brand, model: car.model, year: car.year, category: car.category, transmission: car.transmission,
        fuel: car.fuel, seats: car.seats, bags: car.bags, dailyRate: car.dailyRate, plate: car.plate, color: car.color,
        status: car.status, description: car.description, features: (car.features || []).join(", "),
      }).forEach(([k, v]) => {
        if (form.elements[k]) form.elements[k].value = v == null ? "" : v;
      });
      setPreview(car.images[0] ? App.img(car.images[0], 800) : null);
    } else {
      setPreview(null);
    }
    App.openDialog(dlg);
  }

  $("#add-car").addEventListener("click", () => openForm());

  // Photo: read, shrink and keep as a data URL so it survives the demo reload.
  function readPhoto(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1200 / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        photo = canvas.toDataURL("image/jpeg", 0.82);
        setPreview(photo);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  $("#c-photo").addEventListener("change", (e) => readPhoto(e.target.files[0]));
  const dz = $("#dz");
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => (e.preventDefault(), dz.classList.add("is-over"))));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => (e.preventDefault(), dz.classList.remove("is-over"))));
  dz.addEventListener("drop", (e) => readPhoto(e.dataTransfer.files[0]));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!App.validate(form)) return;
    const f = form.elements;
    const data = {
      brand: f.brand.value.trim(),
      model: f.model.value.trim(),
      year: Number(f.year.value),
      category: f.category.value,
      transmission: f.transmission.value,
      fuel: f.fuel.value,
      seats: Number(f.seats.value),
      bags: Number(f.bags.value) || 0,
      dailyRate: Number(f.dailyRate.value),
      plate: f.plate.value.trim().toUpperCase(),
      color: f.color.value.trim(),
      status: f.status.value,
      description: f.description.value.trim(),
      features: f.features.value.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (editing) data.id = editing.id;
    if (photo) data.images = [photo];
    const btn = $("#car-save");
    App.setLoading(btn, true);
    try {
      await Api.saveCar(data);
      App.closeDialog(dlg);
      App.toast(editing ? `${data.brand} ${data.model} updated.` : `${data.brand} ${data.model} added to the fleet.`);
      await load();
    } finally {
      App.setLoading(btn, false);
    }
  });

  await load();
});
