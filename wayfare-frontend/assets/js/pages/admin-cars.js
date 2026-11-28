/* Staff: manage cars. Search, filter, paginate, add, edit, delete, several photos per car. */
App.ready(async() => {
            const { $, $$, icon, fmt, esc } = App;
            const PAGE = 8;
            const state = { q: "", cat: "", status: "", page: 1 };
            let cars = [];

            $("#f-cat").innerHTML = `<option value="">All types</option>` + DB.categories.map((c) => `<option>${c}</option>`).join("");
            $("#c-category").innerHTML = DB.categories.map((c) => `<option>${c}</option>`).join("");
            $("#cars-table").innerHTML = `<div style="padding:24px" class="stack"><div class="skeleton" style="height:48px"></div><div class="skeleton" style="height:48px"></div><div class="skeleton" style="height:48px"></div></div>`;
            // Year: 2000 up to next year (same rule as the backend).
            $("#c-year").max = String(new Date().getFullYear() + 1);

            // Branches come from GET /api/branches. The backend needs a BranchId for every car.
            const branches = await Api.getLocations();
            $("#c-branch").innerHTML =
                `<option value="">Choose a branch</option>` +
                branches.map((b) => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join("");
            async function load() {
                cars = await Api.getFleet();
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
    const car = cars.find((c) => String(c.id) === btn.closest("tr").dataset.id);
    if (!car) return;
    if (btn.dataset.act === "edit") return openForm(car);
    if (car.status === "rented") {
      App.toast(`The ${car.brand} ${car.model} is rented right now. Record its return before deleting it.`, { error: true });
      return;
    }
    const ok = await App.confirm({
      title: `Delete ${car.brand} ${car.model}?`,
      body: "This cannot be undone. A car that was ever rented cannot be deleted: set it to Maintenance instead.",
      confirmLabel: "Delete car",
      danger: true,
    });

    if (!ok) return;

    try {
      await Api.deleteCar(car.id);
      App.toast(`${car.brand} ${car.model} deleted.`);
      await load();
    } catch (err) {
      App.toast(err.message || "Could not delete the car.", { error: true });
      if (err.status === 404) await load();
    }
  }); 

  /* ---------- Add / edit form ---------- */
  const dlg = $("#car-dialog");
  const form = $("#car-form");
  const MAX_PHOTOS = 8;
  let editing = null;
  // Each photo is either
  // { id, src }  an existing photo saved on the server
  // { file, src } a new photo selected by the user
  let photos = [];

  const isNew = (p) => Boolean(p.file);
  const hasExisting = () => photos.some((p) => !isNew(p));
  const photoError = (message) => {
    $("#photos-field").classList.toggle("has-error", Boolean(message));
    if (message) $("#photos-error").textContent = message;
  };
  
  function releasePreviews(list) {
    list.filter(isNew).forEach((p) => URL.revokeObjectURL(p.src));
  }
function renderPhotos() {
    $("#photo-grid").innerHTML =
      photos
        .map((p, i) => {
          const canBeMain = i > 0 && (!isNew(p) || !hasExisting());
          return `
        <div class="photo-tile${i === 0 ? " is-main" : ""}" data-i="${i}">
          <img src="${esc(App.img(p.src, 420))}" alt="Photo ${i + 1} of ${photos.length}">
          ${i === 0 ? `<span class="photo-badge">Main</span>` : isNew(p) && hasExisting() ? `<span class="photo-badge">New</span>` : ""}
          <div class="photo-actions">
            ${canBeMain ? `<button type="button" data-photo="main" aria-label="Make photo ${i + 1} the main photo" title="Make main">${icon("star")}</button>` : ""}
            <button type="button" data-photo="remove" aria-label="Remove photo ${i + 1}" title="Remove">${icon("trash")}</button>
          </div>
        </div>`;
        })
        .join("") +
      (photos.length < MAX_PHOTOS
        ? `<label class="photo-add" for="c-photos">${icon("plus")}<strong>${photos.length ? "Add more" : "Add photos"}</strong><span>${photos.length ? `${MAX_PHOTOS - photos.length} left` : "Drop or browse, several at once"}</span></label>`
        : "");
  }
  // A rented car must keep the status "rented".
  function setStatusOptions(car) {
    const select = $("#c-status");
    const rented = Boolean(car && car.status === "rented");

    $('option[value="rented"]', select).disabled = !rented;
    select.disabled = rented;
    $("#c-status-hint").hidden = !rented;
  }
  function openForm(car) {
    editing = car || null;
    form.reset();
    $$(".field", form).forEach((f) => f.classList.remove("has-error"));
    $("#car-dialog-title").textContent = car ? `Edit ${car.brand} ${car.model}` : "Add car";
    $("#car-save").textContent = car ? "Save changes" : "Add car";
    setStatusOptions(car);
    if (car) {
      Object.entries({
        brand: car.brand, model: car.model, year: car.year, category: car.category, transmission: car.transmission,
        fuel: car.fuel, seats: car.seats, bags: car.bags, dailyRate: car.dailyRate, plate: car.plate, color: car.color,
        status: car.status, branchId: car.branchId, description: car.description, features: (car.features || []).join(", "),
      }).forEach(([k, v]) => {
        if (form.elements[k]) form.elements[k].value = v == null ? "" : v;
      });
    }
    releasePreviews(photos);
    photos = car ? (car.imageList || []).map((img) => ({ id: img.id, src: img.url })) : [];
    photoError("");
    renderPhotos();
    App.openDialog(dlg);
  }

  $("#add-car").addEventListener("click", () => openForm());

function addPhotos(fileList) {
  let problem = "";

  for (const file of Array.from(fileList)) {
    if (photos.length >= MAX_PHOTOS) {
      problem = `A car can have up to ${MAX_PHOTOS} photos.`;
      break;
    }

    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      problem = "Choose JPG, PNG or WebP images.";
      continue;
    }

    if (file.size > 5 * 1024 * 1024) {
      problem = "Each photo must be under 5 MB.";
      continue;
    }

    photos.push({ file, src: URL.createObjectURL(file) });
  }

  photoError(problem);
  renderPhotos();
}


$("#c-photos").addEventListener("change", (e) => {
  addPhotos(e.target.files);
  e.target.value = "";
});

  const grid = $("#photo-grid");
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-photo]");
    if (!btn) return;
    const i = Number(btn.closest("[data-i]").dataset.i);
    if (btn.dataset.photo === "remove") releasePreviews(photos.splice(i, 1));
else photos.unshift(photos.splice(i, 1)[0]);
    photoError("");
    renderPhotos();
  });
  ["dragenter", "dragover"].forEach((ev) => grid.addEventListener(ev, (e) => (e.preventDefault(), grid.classList.add("is-over"))));
  ["dragleave", "drop"].forEach((ev) => grid.addEventListener(ev, (e) => (e.preventDefault(), grid.classList.remove("is-over"))));
  grid.addEventListener("drop", (e) => addPhotos(e.dataTransfer.files));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const valid = App.validate(form);
    if (!photos.length) photoError("Add at least one photo of the car.");
    if (!valid || !photos.length) return;
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
      branchId: Number(f.branchId.value),
      description: f.description.value.trim(),
      features: f.features.value.split(",").map((s) => s.trim()).filter(Boolean),
      keepImageIds: photos.filter((p) => !isNew(p)).map((p) => p.id),
      newFiles: photos.filter(isNew).map((p) => p.file),
    };
    if (editing) data.id = editing.id;
    const btn = $("#car-save");
    App.setLoading(btn, true);
    try {
      await Api.saveCar(data);
      releasePreviews(photos);
      photos = [];
      App.closeDialog(dlg);
      App.toast(editing ? `${data.brand} ${data.model} updated.` : `${data.brand} ${data.model} added to the fleet.`);
      await load();
    } 
    catch (err) {
      // 400: a field or photo was refused. 409: plate already used, or the car is out on rent.
      App.toast(err.message || "Could not save the car.", { error: true });
      if (err.status === 404) {
        App.closeDialog(dlg);
        await load();
      }
    }
    finally {
      App.setLoading(btn, false);
    }
  });

  await load();
});