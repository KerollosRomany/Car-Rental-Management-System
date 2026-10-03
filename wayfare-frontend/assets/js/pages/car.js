/* Car detail: gallery, specs, availability calendar, price, request flow. */
App.ready(async () => {
  const { $, $$, icon, fmt, esc } = App;
  const q = new URLSearchParams(location.search);
  const car = await Api.getCar(q.get("id"));
  const detail = $("#detail");

  if (!car) {
    detail.outerHTML = App.empty({
      icon: "car-profile",
      title: "We could not find that car",
      text: "It may have been removed from the fleet. Browse the cars that are available.",
      action: { label: "Browse cars", href: "cars.html" },
    });
    return;
  }

  document.title = `${car.brand} ${car.model} | Wayfare`;
  $("#crumbs").innerHTML = `
    <a href="cars.html">Cars</a>${icon("caret-right")}
    <a href="cars.html?category=${encodeURIComponent(car.category)}">${esc(car.category)}</a>${icon("caret-right")}
    <span aria-current="page">${esc(car.brand)} ${esc(car.model)}</span>`;

  /* ---------- Trip state ---------- */
  let from = q.get("from");
  let to = q.get("to");
  const loc = q.get("loc") || DB.locations[0].id;
  const clash = from && to && car.bookedRanges.some((b) => from < b.to && b.from < to);
  const maintenance = car.status === "maintenance";
  if (clash || maintenance) from = to = null;

  const statusPill =
    car.status === "maintenance"
      ? App.status("car", "maintenance")
      : car.status === "rented"
      ? `<span class="status status--info">Rented right now</span>`
      : App.status("car", "available");

  const specs = [
    ["gear-six", "Transmission", car.transmission],
    [App.fuelIcon(car.fuel), "Fuel", car.fuel],
    ["users", "Seats", `${car.seats} seats`],
    ["door", "Doors", `${car.doors} doors`],
    ["suitcase", "Luggage", `${car.bags} ${car.bags === 1 ? "bag" : "bags"}`],
    ["palette", "Colour", car.color],
  ];

  detail.innerHTML = `
    <div class="detail-main">
      <div class="gallery">
        <div class="gallery-main"><img id="g-main" src="${esc(App.img(car.images[0], 1400))}" alt="${esc(`${car.color} ${car.brand} ${car.model}`)}" width="1400" height="875"></div>
        ${
          car.images.length > 1
            ? `<div class="gallery-thumbs" role="list">${car.images
                .map(
                  (src, i) => `<button class="thumb" type="button" role="listitem" data-i="${i}" aria-label="Show photo ${i + 1}"${i === 0 ? ' aria-current="true"' : ""}><img src="${esc(App.img(src, 360))}" alt="" loading="lazy"></button>`
                )
                .join("")}</div>`
            : ""
        }
      </div>

      <div class="car-head">
        <div>
          <h1>${esc(car.brand)} ${esc(car.model)}</h1>
          <p class="car-sub">${esc(car.category)} &middot; ${esc(car.year)}</p>
        </div>
        ${statusPill}
      </div>

      <div class="spec-grid">
        ${specs.map(([ic, k, v]) => `<div class="spec-tile">${icon(ic)}<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div></div>`).join("")}
      </div>

      <div class="stack area-about" style="--stack-gap:10px">
        <h2 class="h-sm">About this car</h2>
        <p class="lede" style="max-width:68ch">${esc(car.description)}</p>
      </div>

      <div class="stack area-included" style="--stack-gap:16px">
        <h2 class="h-sm">What is included</h2>
        <ul class="feature-grid">
          ${car.features.map((f) => `<li>${icon(App.featureIcon(f))}${esc(f)}</li>`).join("")}
        </ul>
      </div>

      <div class="stack area-faq" style="--stack-gap:0">
        <h2 class="h-sm" style="margin-bottom:12px">Good to know</h2>
        <div class="faq">
          <details><summary>What do I need to bring?<i class="ph ph-caret-down" aria-hidden="true"></i></summary><p>A valid driving license and an ID. The license must be valid for the whole rental.</p></details>
          <details><summary>How does fuel work?<i class="ph ph-caret-down" aria-hidden="true"></i></summary><p>Return the car with the same fuel level you collected it with. Electric cars come with a full charge.</p></details>
          <details><summary>Can I cancel a request?<i class="ph ph-caret-down" aria-hidden="true"></i></summary><p>Yes, any time before our team confirms it. You can do it from My rentals.</p></details>
        </div>
      </div>
    </div>

    <aside class="booking card card-pad is-stitched" aria-label="Request this car">
      <div class="booking-top">
        <div class="price"><strong>${fmt.money(car.dailyRate)}</strong><span>per day</span></div>
      </div>

      ${
        maintenance
          ? `<div class="notice is-warn">${icon("wrench")}<div>This car is in maintenance and cannot be requested right now.</div></div>`
          : ""
      }
      ${
        clash
          ? `<div class="notice is-warn" id="clash">${icon("calendar-x")}<div>It is booked from ${fmt.range(q.get("from"), q.get("to"))}. Pick other dates below.</div></div>`
          : ""
      }

      <form id="booking-form" novalidate class="stack" style="--stack-gap:16px">
        <div class="field" id="date-field">
          <label class="label" for="b-dates">Pick-up and return</label>
          <div class="input-wrap">
            <i class="ph ph-calendar-blank" aria-hidden="true"></i>
            <input class="input" id="b-dates" type="text" readonly${maintenance ? " disabled" : ""}>
          </div>
          <p class="error-msg">Choose your pick-up and return dates.</p>
        </div>
        <div class="field">
          <label class="label" for="b-loc">Pick-up location</label>
          <div class="input-wrap">
            <i class="ph ph-map-pin" aria-hidden="true"></i>
            <select class="select" id="b-loc"${maintenance ? " disabled" : ""}>
              ${DB.locations.map((l) => `<option value="${l.id}"${l.id === loc ? " selected" : ""}>${esc(l.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <dl class="kv price-lines" id="price-lines"></dl>

        <button class="btn btn-primary btn-lg btn-block" type="submit"${maintenance ? " disabled" : ""}>Request rental</button>
        <p class="hint" style="text-align:center">No payment now. Our team confirms your request.</p>
      </form>
    </aside>`;

  /* ---------- Gallery ---------- */
  const main = $("#g-main");
  $$(".thumb").forEach((t) =>
    t.addEventListener("click", () => {
      main.src = App.img(car.images[Number(t.dataset.i)], 1400);
      $$(".thumb").forEach((x) => x.removeAttribute("aria-current"));
      t.setAttribute("aria-current", "true");
    })
  );

  /* ---------- Dates and price ---------- */
  const lines = $("#price-lines");
  const renderPrice = () => {
    if (!from) {
      lines.innerHTML = `<div><dt>Total</dt><dd class="muted" style="font-weight:500">Choose dates to see it</dd></div>`;
      return;
    }
    const days = Api.daysBetween(from, to);
    lines.innerHTML = `
      <div><dt>${fmt.money(car.dailyRate)} x ${fmt.plural(days, "day")}</dt><dd>${fmt.money(days * car.dailyRate)}</dd></div>
      <div class="total"><dt>Total</dt><dd>${fmt.money(days * car.dailyRate)}</dd></div>`;
  };

  const picker = App.rangePicker($("#b-dates"), {
    booked: car.bookedRanges,
    defaultDate: from && to ? [from, to] : null,
    onChange: (r) => {
      from = r ? r[0] : null;
      to = r ? r[1] : null;
      $("#date-field").classList.remove("has-error");
      const clashNote = $("#clash");
      if (clashNote && r) clashNote.remove();
      renderPrice();
    },
  });
  renderPrice();

  /* ---------- Request flow ---------- */
  const dlg = $("#confirm-booking");
  $("#booking-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!from) {
      $("#date-field").classList.add("has-error");
      picker && picker.open();
      return;
    }
    const days = Api.daysBetween(from, to);
    const locName = DB.locations.find((l) => l.id === $("#b-loc").value).name;
    $("#cb-car").innerHTML = `
      <img src="${esc(App.img(car.images[0], 360))}" alt="" width="120" height="84">
      <div><strong>${esc(car.brand)} ${esc(car.model)}</strong><div class="muted text-sm">${esc(car.category)}, ${esc(car.year)}, ${esc(car.transmission)}</div></div>`;
    $("#cb-lines").innerHTML = `
      <div><dt>Pick-up</dt><dd>${fmt.weekday(from)}, ${fmt.date(from)}</dd></div>
      <div><dt>Return</dt><dd>${fmt.weekday(to)}, ${fmt.date(to)}</dd></div>
      <div><dt>Duration</dt><dd>${fmt.plural(days, "day")}</dd></div>
      <div><dt>Pick-up location</dt><dd>${esc(locName)}</dd></div>
      <div><dt>Total</dt><dd style="font-size:1.125rem">${fmt.money(days * car.dailyRate)}</dd></div>`;
    $("#cb-review").hidden = false;
    $("#cb-done").hidden = true;
    App.openDialog(dlg);
  });

  $("#cb-send").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    App.setLoading(btn, true);
    try {
      const rental = await Api.createRental({
        carId: car.id,
        pickupDate: from,
        returnDate: to,
        pickupLocation: $("#b-loc").value,
      });
      $("#cb-ref").textContent = rental.id;
      $("#cb-review").hidden = true;
      $("#cb-done").hidden = false;
    } catch (err) {
      App.toast(err.message, { error: true });
      App.closeDialog(dlg);
    } finally {
      App.setLoading(btn, false);
    }
  });

  /* ---------- Similar cars ---------- */
  const all = await Api.getCars({ from, to });
  const similar = all
    .filter((c) => c.id !== car.id)
    .sort((a, b) => (a.category === car.category ? -1 : 0) - (b.category === car.category ? -1 : 0) || Math.abs(a.dailyRate - car.dailyRate) - Math.abs(b.dailyRate - car.dailyRate))
    .slice(0, 4);
  $("#similar-grid").innerHTML = similar.map((c) => App.carCard(c, { from, to, loc })).join("");
  $("#similar").hidden = false;
});
