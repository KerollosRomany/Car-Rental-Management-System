/* Home: search form, type chips, popular cars. */
App.ready(async() => {
    const { $, icon, fmt } = App;
    const typeIcon = { Economy: "car-simple", SUV: "jeep", Luxury: "sparkle", Van: "van" };
    const categories = Object.keys(typeIcon);

    /* Search form options */
    const loc = $("#s-loc");
    const type = $("#s-type");
    const locations = await Api.getLocations();
    loc.innerHTML = locations.map((l) => `<option value="${App.esc(String(l.id))}">${App.esc(l.name)}</option>`).join("");
    type.innerHTML =
        `<option value="">Any type</option>` + categories.map((c) => `<option value="${App.esc(c)}">${App.esc(c)}</option>`).join("");

    /* Date range picker (stays empty until chosen) */
    let range = null;
    const picker = App.rangePicker($("#s-dates"), {
        inputClass: "plain-input",
        placeholder: "Add dates",
        onChange: (r) => (range = r),
    });

    $("#hero-search").addEventListener("submit", (e) => {
        e.preventDefault();
        const qs = new URLSearchParams();
        if (range) {
            qs.set("from", range[0]);
            qs.set("to", range[1]);
        }
        if (loc.value) qs.set("loc", loc.value);
        if (type.value) qs.set("category", type.value);
        location.href = `cars.html${qs.toString() ? "?" + qs.toString() : ""}`;
    });

    /* Quick type chips */
    const grid = $("#popular-cars");
    grid.innerHTML = App.carSkeletons(4);
    const cars = await Api.getCars();

    $("#quick-types").innerHTML =
        `<span class="quick-label">Browse by type</span>` +
        categories
        .map((c) => {
            const count = cars.filter((x) => String(x.category).toLowerCase() === c.toLowerCase()).length;
            return `<a class="chip" href="cars.html?category=${encodeURIComponent(c)}">${icon(typeIcon[c])}${c}<span class="muted num">${count}</span></a>`;
        })
        .join("");

    /* Popular cars */
    const picks = ["c11", "c05", "c09", "c01"]
        .map((id) => cars.find((c) => c.id === id))
        .filter((c) => c && c.availableForDates);
    grid.innerHTML = picks.map((c) => App.carCard(c)).join("");
});