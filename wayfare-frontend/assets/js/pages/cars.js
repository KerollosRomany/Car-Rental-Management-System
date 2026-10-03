/* Cars listing: filters, sorting, availability for chosen dates. State lives in the URL. */
App.ready(() => {
  const { $, $$, icon, fmt, esc } = App;
  const MAX_PRICE = 200;

  /* ---------- State (read from the URL so links are shareable) ---------- */
  const q = new URLSearchParams(location.search);
  const state = {
    category: (q.get("category") || "").split(",").filter(Boolean),
    maxPrice: Number(q.get("max")) || MAX_PRICE,
    transmission: q.get("trans") || "Any",
    seats: q.get("seats") || "Any",
    fuel: (q.get("fuel") || "").split(",").filter(Boolean),
    availableOnly: q.get("avail") === "1",
    sort: q.get("sort") || "recommended",
    from: q.get("from"),
    to: q.get("to"),
    loc: q.get("loc") || DB.locations[0].id,
  };

  const grid = $("#car-grid");
  const empty = $("#empty");
  let token = 0;

  /* ---------- Build the filter controls ---------- */
  const typeIcon = { Economy: "car-simple", SUV: "jeep", Luxury: "sparkle", Electric: "lightning", Van: "van" };
  $("#f-types").innerHTML = DB.categories
    .map((c) => `<button class="chip" type="button" data-type="${c}" aria-pressed="false">${icon(typeIcon[c])}${c}</button>`)
    .join("");

  const fuels = ["Petrol", "Diesel", "Hybrid", "Electric"];
  $("#f-fuel").innerHTML = fuels
    .map((f) => `<label class="check"><input type="checkbox" value="${f}" name="fuel">${f}</label>`)
    .join("");

  $("#f-loc").innerHTML = DB.locations.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join("");

  /* ---------- Reflect state in the controls ---------- */
  const syncControls = () => {
    $$("[data-type]").forEach((b) => b.setAttribute("aria-pressed", String(state.category.includes(b.dataset.type))));
    const price = $("#f-price");
    price.value = state.maxPrice;
    price.style.setProperty("--pct", `${((state.maxPrice - price.min) / (price.max - price.min)) * 100}%`);
    $("#price-out").textContent = state.maxPrice >= MAX_PRICE ? "Any price" : fmt.money(state.maxPrice);
    $$('input[name="trans"]').forEach((r) => (r.checked = r.value === state.transmission));
    $$('input[name="seats"]').forEach((r) => (r.checked = r.value === state.seats));
    $$('input[name="fuel"]').forEach((c) => (c.checked = state.fuel.includes(c.value)));
    $("#f-available").checked = state.availableOnly;
    $("#f-sort").value = state.sort;
    $("#f-loc").value = state.loc;
    $("#clear-dates").hidden = !(state.from && state.to);
  };

  /* ---------- Date picker ---------- */
  const picker = App.rangePicker($("#f-dates"), {
    defaultDate: state.from && state.to ? [state.from, state.to] : null,
    placeholder: "Add dates",
    onChange: (r) => {
      state.from = r ? r[0] : null;
      state.to = r ? r[1] : null;
      update();
    },
  });

  $("#clear-dates").addEventListener("click", () => {
    picker.clear();
    state.from = state.to = null;
    update();
  });

  /* ---------- Events ---------- */
  $("#f-types").addEventListener("click", (e) => {
    const b = e.target.closest("[data-type]");
    if (!b) return;
    const t = b.dataset.type;
    state.category = state.category.includes(t) ? state.category.filter((x) => x !== t) : [...state.category, t];
    update();
  });
  $("#f-price").addEventListener("input", (e) => {
    state.maxPrice = Number(e.target.value);
    update();
  });
  $$('input[name="trans"]').forEach((r) => r.addEventListener("change", () => ((state.transmission = r.value), update())));
  $$('input[name="seats"]').forEach((r) => r.addEventListener("change", () => ((state.seats = r.value), update())));
  $("#f-fuel").addEventListener("change", () => {
    state.fuel = $$('input[name="fuel"]:checked').map((c) => c.value);
    update();
  });
  $("#f-available").addEventListener("change", (e) => ((state.availableOnly = e.target.checked), update()));
  $("#f-sort").addEventListener("change", (e) => ((state.sort = e.target.value), update()));
  $("#f-loc").addEventListener("change", (e) => ((state.loc = e.target.value), syncUrl()));

  const reset = () => {
    Object.assign(state, { category: [], maxPrice: MAX_PRICE, transmission: "Any", seats: "Any", fuel: [], availableOnly: false });
    update();
  };
  $("#reset-filters").addEventListener("click", reset);

  // Mobile filter drawer
  const filters = $("#filters");
  const scrim = $(".filters-scrim");
  const setDrawer = (open) => {
    filters.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
  };
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-filters-open]")) setDrawer(true);
    else if (e.target.closest("[data-filters-close]")) setDrawer(false);
  });

  /* ---------- URL sync ---------- */
  function syncUrl() {
    const p = new URLSearchParams();
    if (state.category.length) p.set("category", state.category.join(","));
    if (state.maxPrice < MAX_PRICE) p.set("max", state.maxPrice);
    if (state.transmission !== "Any") p.set("trans", state.transmission);
    if (state.seats !== "Any") p.set("seats", state.seats);
    if (state.fuel.length) p.set("fuel", state.fuel.join(","));
    if (state.availableOnly) p.set("avail", "1");
    if (state.sort !== "recommended") p.set("sort", state.sort);
    if (state.from && state.to) {
      p.set("from", state.from);
      p.set("to", state.to);
    }
    p.set("loc", state.loc);
    history.replaceState(null, "", `${location.pathname}?${p.toString()}`);
  }

  /* ---------- Active filter chips ---------- */
  function renderActive() {
    const items = [];
    state.category.forEach((c) => items.push({ label: c, remove: () => (state.category = state.category.filter((x) => x !== c)) }));
    if (state.maxPrice < MAX_PRICE) items.push({ label: `Up to ${fmt.money(state.maxPrice)}`, remove: () => (state.maxPrice = MAX_PRICE) });
    if (state.transmission !== "Any") items.push({ label: state.transmission, remove: () => (state.transmission = "Any") });
    if (state.seats !== "Any") items.push({ label: `${state.seats} seats`, remove: () => (state.seats = "Any") });
    state.fuel.forEach((f) => items.push({ label: f, remove: () => (state.fuel = state.fuel.filter((x) => x !== f)) }));
    const box = $("#active-filters");
    box.innerHTML = items
      .map((it, i) => `<span class="chip chip-x">${esc(it.label)}<button type="button" data-remove="${i}" aria-label="Remove ${esc(it.label)}">${icon("x")}</button></span>`)
      .join("");
    box.hidden = !items.length;
    box.onclick = (e) => {
      const b = e.target.closest("[data-remove]");
      if (!b) return;
      items[Number(b.dataset.remove)].remove();
      update();
    };
  }

  /* ---------- Render ---------- */
  async function render() {
    const my = ++token;
    empty.innerHTML = "";
    grid.hidden = false;
    grid.innerHTML = App.carSkeletons(6);
    const cars = await Api.getCars({
      category: state.category,
      maxPrice: state.maxPrice < MAX_PRICE ? state.maxPrice : 0,
      transmission: state.transmission,
      seats: state.seats,
      fuel: state.fuel,
      availableOnly: state.availableOnly,
      sort: state.sort,
      from: state.from,
      to: state.to,
    });
    if (my !== token) return; // a newer render is in flight

    const free = cars.filter((c) => c.availableForDates).length;
    const filtering = state.category.length || state.maxPrice < MAX_PRICE || state.transmission !== "Any" || state.seats !== "Any" || state.fuel.length;
    $("#result-summary").textContent = state.from
      ? `${fmt.plural(free, "car")} free from ${fmt.range(state.from, state.to)}${cars.length !== free ? `, ${cars.length} in total` : ""}`
      : `${fmt.plural(cars.length, "car")} ${filtering ? "match your filters" : "in the fleet"}. Pick your dates to check availability.`;

    if (!cars.length) {
      grid.hidden = true;
      empty.innerHTML = App.empty({
        icon: "car-profile",
        title: "No cars match these filters",
        text: "Try a higher price, another car type, or remove a filter.",
        action: { label: "Clear all filters" },
      });
      $("[data-empty-action]", empty).addEventListener("click", reset);
      return;
    }
    grid.innerHTML = cars.map((c) => App.carCard(c, { from: state.from, to: state.to, loc: state.loc })).join("");
  }

  function update() {
    syncControls();
    renderActive();
    syncUrl();
    render();
  }

  update();
});
