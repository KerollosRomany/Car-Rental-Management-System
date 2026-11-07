/* ==========================================================================
   Tiny chart helpers (no library). Plain SVG and HTML.
   - columns(): vertical bars over time, one series, tooltip on hover and focus
   - hbars():   horizontal bars for categories, value at the tip
   - table():   the table twin every chart ships with
   Labels and values reach the DOM through textContent, never innerHTML.
   ========================================================================== */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, text) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (text != null) node.textContent = text;
    return node;
  };
  const html = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  function niceMax(max) {
    if (max <= 5) return 5;
    const step = max <= 20 ? 5 : max <= 50 ? 10 : max <= 200 ? 50 : 100;
    return Math.ceil(max / step) * step;
  }

  /* Tooltip shared by the charts. Values lead, labels follow. */
  let tip;
  function tooltip() {
    if (!tip) {
      tip = html("div", "chart-tip");
      tip.setAttribute("role", "status");
      tip.hidden = true;
      document.body.appendChild(tip);
    }
    return tip;
  }

  function showTip(anchorRect, title, rows) {
    const t = tooltip();
    t.textContent = "";
    t.appendChild(html("div", "chart-tip-title", title));
    rows.forEach(({ label, value }) => {
      const row = html("div", "chart-tip-row");
      row.appendChild(html("i", "chart-tip-key"));
      row.appendChild(html("strong", "", value));
      row.appendChild(html("span", "", label));
      t.appendChild(row);
    });
    t.hidden = false;
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    let left = anchorRect.left + anchorRect.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    let top = anchorRect.top - th - 10;
    if (top < 8) top = anchorRect.bottom + 10;
    t.style.left = `${left}px`;
    t.style.top = `${top}px`;
  }

  function hideTip() {
    if (tip) tip.hidden = true;
  }

  /* ---------- Columns ---------- */
  function columns(container, { labels, values, unit = "rentals", last = null }) {
    const draw = () => {
      const W = Math.max(280, container.clientWidth);
      const H = 264;
      const m = { top: 22, right: 8, bottom: 30, left: 34 };
      const pw = W - m.left - m.right;
      const ph = H - m.top - m.bottom;
      const max = niceMax(Math.max(...values));
      const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((max / 4) * i));
      const y = (v) => m.top + ph - (v / max) * ph;
      const band = pw / values.length;
      const bw = Math.min(24, band * 0.5);

      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img", "aria-label": `${unit} per month` });

      ticks.forEach((t) => {
        svg.appendChild(el("line", { x1: m.left, x2: W - m.right, y1: y(t), y2: y(t), class: "ch-grid" }));
        svg.appendChild(el("text", { x: m.left - 10, y: y(t) + 4, "text-anchor": "end", class: "ch-axis" }, String(t)));
      });

      values.forEach((v, i) => {
        const cx = m.left + band * i + band / 2;
        const x = cx - bw / 2;
        const top = y(v);
        const h = Math.max(0, m.top + ph - top);
        const r = Math.min(4, h);
        // 4px rounded data end, square at the baseline
        const d = `M${x},${m.top + ph} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${m.top + ph} Z`;
        const group = el("g", { class: "ch-col", tabindex: "0", role: "img", "aria-label": `${labels[i]}: ${v} ${unit}` });
        group.appendChild(el("path", { d, class: "ch-bar" }));
        group.appendChild(el("rect", { x: m.left + band * i, y: m.top, width: band, height: ph + m.bottom - 6, class: "ch-hit" }));
        if (i === values.length - 1) {
          group.appendChild(el("text", { x: cx, y: top - 8, "text-anchor": "middle", class: "ch-value" }, String(v)));
        }
        const show = () => {
          showTip(group.querySelector(".ch-bar").getBoundingClientRect(), labels[i] + (last && i === values.length - 1 ? ` (${last})` : ""), [{ label: unit, value: String(v) }]);
          group.classList.add("is-hover");
        };
        const hide = () => {
          hideTip();
          group.classList.remove("is-hover");
        };
        group.addEventListener("pointerenter", show);
        group.addEventListener("pointermove", show);
        group.addEventListener("pointerleave", hide);
        group.addEventListener("focus", show);
        group.addEventListener("blur", hide);
        svg.appendChild(group);
        svg.appendChild(el("text", { x: cx, y: H - 8, "text-anchor": "middle", class: "ch-axis" }, labels[i]));
      });

      container.textContent = "";
      container.appendChild(svg);
    };

    draw();
    let timer;
    new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(draw, 80);
    }).observe(container);
  }

  /* ---------- Horizontal bars ---------- */
  function hbars(container, { rows, unit = "cars" }) {
    const max = Math.max(...rows.map((r) => r.value), 1);
    container.textContent = "";
    rows.forEach((r) => {
      const row = html("div", "hbar");
      row.tabIndex = 0;
      row.setAttribute("aria-label", `${r.label}: ${r.value} ${unit}`);
      row.appendChild(html("span", "hbar-label", r.label));
      const track = html("span", "hbar-track");
      const bar = html("i", "hbar-fill");
      bar.style.setProperty("--p", String(r.value / max));
      track.appendChild(bar);
      track.appendChild(html("strong", "hbar-value", String(r.value)));
      row.appendChild(track);
      const show = () => showTip(bar.getBoundingClientRect(), r.label, [{ label: unit, value: String(r.value) }]);
      row.addEventListener("pointerenter", show);
      row.addEventListener("pointerleave", hideTip);
      row.addEventListener("focus", show);
      row.addEventListener("blur", hideTip);
      container.appendChild(row);
    });
  }

  /* ---------- Table twin ---------- */
  function table(container, headers, rows) {
    const t = html("table", "table table--plain");
    t.style.minWidth = "0";
    const thead = html("thead");
    const hr = html("tr");
    headers.forEach((h, i) => {
      const th = html("th", "", h);
      if (i > 0) th.style.textAlign = "right";
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    t.appendChild(thead);
    const tbody = html("tbody");
    rows.forEach((r) => {
      const tr = html("tr");
      r.forEach((c, i) => {
        const td = html("td", i > 0 ? "num" : "", String(c));
        if (i > 0) td.style.textAlign = "right";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    container.textContent = "";
    container.appendChild(t);
  }

  /* Chart | Table switch inside a card */
  function viewToggle(card) {
    const radios = card.querySelectorAll('input[name^="view-"]');
    const panels = { chart: card.querySelector("[data-panel=chart]"), table: card.querySelector("[data-panel=table]") };
    radios.forEach((r) =>
      r.addEventListener("change", () => {
        panels.chart.hidden = r.value !== "chart";
        panels.table.hidden = r.value !== "table";
        hideTip();
      })
    );
  }

  window.Charts = { columns, hbars, table, viewToggle };
})();
