// Aion 2 Checklist, as an A2Tools plugin. Fully manual: you add your
// characters and tick things off yourself. It reads nothing from the game.
(() => {
  const { sections: SECS, tasks: TASKS, dailySections } = window.CHECKLIST;
  const DAILY = new Set(dailySections);
  const RESET_HOUR_UTC = 7, RESET_DAY_UTC = 3; // daily 07:00 UTC, weekly Wednesday 07:00 UTC
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let S = { chars: {}, order: [], sel: null, prog: {}, sub: false, collapse: {}, gcollapse: {}, lastCheck: Date.now() };
  let compact = false;
  let confirmRemove = false;
  let saveTimer = null;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => a2.storage.set("state", S).catch(() => {}), 300);
  };

  // ── resets ─────────────────────────────────────────────────────────────
  function lastDailyReset(now) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), RESET_HOUR_UTC));
    if (d > now) d.setUTCDate(d.getUTCDate() - 1);
    return d;
  }
  function lastWeeklyReset(now) {
    const d = lastDailyReset(now);
    while (d.getUTCDay() !== RESET_DAY_UTC) d.setUTCDate(d.getUTCDate() - 1);
    return d;
  }
  const nextDaily = (now) => { const d = lastDailyReset(now); d.setUTCDate(d.getUTCDate() + 1); return d; };
  const nextWeekly = (now) => { const d = lastWeeklyReset(now); d.setUTCDate(d.getUTCDate() + 7); return d; };
  function timeLeft(ms) {
    const m = Math.max(0, Math.round(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d ? `${d}d ${h}h` : h ? `${h}h ${mm}m` : `${mm}m`;
  }
  const isDailyTask = (t) => t.daily || DAILY.has(t.sec);
  function autoReset() {
    const now = new Date(), last = new Date(S.lastCheck || 0);
    const doDaily = lastDailyReset(now) > last, doWeekly = lastWeeklyReset(now) > last;
    if (doDaily || doWeekly) {
      for (const key in S.prog) for (const t of TASKS) {
        const daily = isDailyTask(t);
        if ((daily && doDaily) || (!daily && doWeekly)) delete S.prog[key][t.id];
      }
      S.collapse = {};
    }
    S.lastCheck = now.getTime();
    save();
  }

  // ── characters and progress ────────────────────────────────────────────
  function addChar(name, main) {
    const key = "c" + Date.now() + Math.floor(Math.random() * 1000);
    S.chars[key] = { name, main };
    S.order.push(key);
    return key;
  }
  function ensureChars() {
    S.order = S.order.filter((k) => S.chars[k]);
    if (!S.order.length) {
      addChar("Main", true);
      addChar("Alt 1", false);
    }
    if (!S.chars[S.sel]) S.sel = S.order[0];
  }
  const cur = () => S.chars[S.sel] || null;
  const cap = (t, ch) => (t.subOnly && !S.sub ? 0 : ch.main ? t.main : t.alt);
  const get = (key, t) => (S.prog[key] || {})[t.id] || 0;
  const secDone = (key, ch, secId) => TASKS.filter((t) => t.sec === secId && cap(t, ch) > 0).every((t) => get(key, t) >= cap(t, ch));
  function set(key, t, v) {
    const ch = S.chars[key];
    if (!ch) return;
    const was = secDone(key, ch, t.sec);
    (S.prog[key] ||= {})[t.id] = Math.max(0, Math.min(cap(t, ch), v));
    if (was !== secDone(key, ch, t.sec) && S.collapse[key]) delete S.collapse[key][t.sec];
    save();
    render();
  }

  // ── rendering ──────────────────────────────────────────────────────────
  function el(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === "on") for (const ev in attrs.on) e.addEventListener(ev, attrs.on[ev]);
      else e.setAttribute(k, attrs[k]);
    }
    for (const k of kids) if (k != null) e.append(k);
    return e;
  }

  function render() {
    ensureChars();
    const now = new Date();
    const key = S.sel, ch = cur();
    document.getElementById("resets").textContent =
      `Daily reset in ${timeLeft(nextDaily(now) - now)} · weekly in ${timeLeft(nextWeekly(now) - now)}`;
    document.getElementById("subToggle").checked = !!S.sub;
    document.getElementById("controls").hidden = compact;

    // character tabs
    const tabs = document.getElementById("tabs");
    tabs.textContent = "";
    tabs.hidden = compact;
    for (const k of S.order) {
      const c = S.chars[k];
      tabs.append(el("button", { class: "tab" + (k === key ? " on" : ""), type: "button",
        on: { click: () => { S.sel = k; confirmRemove = false; save(); render(); } } },
        el("img", { class: "emb", src: c.main ? "img/main.png" : "img/alt.png", alt: "" }), c.name));
    }
    tabs.append(el("button", { class: "tab add", type: "button", on: { click: () => {
      const n = S.order.filter((k) => !S.chars[k].main).length + 1;
      S.sel = addChar("Alt " + n, false); confirmRemove = false; save(); render();
    } } }, "+ Add alt"));

    // the selected character: name, main/alt, remove
    const bar = document.getElementById("charbar");
    bar.textContent = "";
    bar.hidden = compact;
    const input = el("input", { id: "charName", value: ch.name, "aria-label": "Character name", maxlength: "24" });
    input.addEventListener("change", (e) => { ch.name = e.target.value.trim() || ch.name; save(); render(); });
    bar.append(
      el("img", { class: "emb", src: ch.main ? "img/main.png" : "img/alt.png", alt: "" }),
      input,
      el("button", { class: "chip", type: "button", on: { click: () => {
        if (!ch.main) for (const k in S.chars) S.chars[k].main = false; // only one main
        ch.main = !ch.main; save(); render();
      } } }, ch.main ? "Main ✓" : "Make main"));
    if (S.order.length > 1) {
      if (!confirmRemove) {
        bar.append(el("button", { class: "linkish", type: "button", on: { click: () => { confirmRemove = true; render(); } } }, "Remove"));
      } else {
        bar.append(el("span", { class: "confirm" }, `Remove ${ch.name}? `,
          el("button", { class: "chip", type: "button", on: { click: () => {
            delete S.chars[key]; delete S.prog[key]; delete S.collapse[key]; delete S.gcollapse[key];
            S.order = S.order.filter((k) => k !== key); S.sel = S.order[0]; confirmRemove = false; save(); render();
          } } }, "Remove"),
          el("button", { class: "linkish", type: "button", on: { click: () => { confirmRemove = false; render(); } } }, "Cancel")));
      }
    }

    // the checklist
    const host = document.getElementById("sections");
    host.textContent = "";
    const color = ch.main ? "var(--main)" : "var(--alt)";
    let lastGroup = null, groupClosed = false, body = null;
    for (const s of SECS) {
      const ts = TASKS.filter((t) => t.sec === s.id && cap(t, ch) > 0);
      if (!ts.length) continue;
      if (s.group !== lastGroup) {
        lastGroup = s.group;
        const g = s.group, gc = !!(S.gcollapse[key] || {})[g];
        groupClosed = gc;
        const reset = g === "Daily" ? nextDaily(now) : nextWeekly(now);
        host.append(el("button", { class: "group-h", type: "button", "aria-expanded": String(!gc),
          on: { click: () => { (S.gcollapse[key] ||= {})[g] = !gc; save(); render(); } } },
          el("span", { class: "chev" + (gc ? "" : " open") }, "›"), el("span", { class: "gname" }, g),
          el("span", { class: "gmeta" }, "resets in " + timeLeft(reset - now))));
        body = el("div", { class: "group-body" });
        body.hidden = gc;
        host.append(body);
      }
      if (groupClosed) continue;
      let done = 0, total = 0;
      ts.forEach((t) => { done += get(key, t); total += cap(t, ch); });
      const complete = done >= total;
      const ov = (S.collapse[key] || {})[s.id];
      const closed = ov === undefined ? complete || !!s.startClosed : ov;
      const rows = el("div", { class: "rows" });
      rows.hidden = closed;
      const sec = el("section", { class: "sec" + (complete ? " done" : "") },
        el("button", { class: "sec-h", type: "button", "aria-expanded": String(!closed),
          on: { click: () => { (S.collapse[key] ||= {})[s.id] = !closed; save(); render(); } } },
          el("span", { class: "chev" + (closed ? "" : " open") }, "›"),
          el("img", { class: "icon", src: `img/${s.icon}.png`, alt: "" }),
          el("span", { class: "sname" }, s.name),
          el("span", { class: "smeta" }, complete ? "✓" : `${done}/${total}`)),
        el("div", { class: "bar" }, el("i", { style: `width:${(done / total) * 100}%` })),
        rows);
      for (const t of ts) {
        const m = cap(t, ch), v = get(key, t);
        const note = typeof t.note === "function" ? t.note(S) : t.note;
        const label = el("div", { class: "label" },
          el("div", { class: "tname" }, t.name, t.lvl ? el("span", { class: "lvl" }, "Lv " + t.lvl) : null),
          note ? el("div", { class: "note" }, note) : null);
        let ctl;
        if (m <= 5 && !t.stepper) {
          ctl = el("div", { class: "pips", style: `--c:${color}` });
          for (let i = 0; i < m; i++) {
            const text = m === 1 ? t.label || "Done" : "";
            ctl.append(el("button", { class: "pip" + (i < v ? " on" : "") + (m === 1 ? " wide" : ""), type: "button",
              "aria-label": `${t.name} ${i + 1} of ${m}`,
              on: { click: () => set(key, t, i < v && i === v - 1 ? i : i + 1) } }, text));
          }
        } else {
          ctl = el("div", { class: "step" },
            el("button", { type: "button", "aria-label": "One less " + t.name, on: { click: () => set(key, t, v - 1) } }, "−"),
            el("span", { class: "count", style: `color:${v >= m ? "var(--done)" : color}` }, String(v), el("small", {}, "/" + m)),
            el("button", { type: "button", "aria-label": "One more " + t.name, on: { click: () => set(key, t, v + 1) } }, "+"));
        }
        rows.append(el("div", { class: "row" + (v >= m ? " full" : "") }, label, ctl));
      }
      body.append(sec);
    }

    const foot = document.getElementById("foot");
    foot.textContent = "";
    foot.hidden = compact;
    foot.append(`Resets: daily 07:00 UTC, weekly Wednesday 07:00 UTC (${DAYS[nextWeekly(now).getDay()]} ${nextWeekly(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} your time).`);
  }

  // ── wiring ─────────────────────────────────────────────────────────────
  document.getElementById("subToggle").addEventListener("change", (e) => { S.sub = e.target.checked; save(); render(); });
  a2.on("compact", (on) => { compact = !!on; render(); });

  a2.storage.get("state").then((saved) => {
    if (saved && typeof saved === "object") {
      S = Object.assign(S, saved);
      delete S.counters; // left over from the automatic version
    }
  }).catch(() => {}).finally(() => {
    autoReset();
    render();
    a2.ready();
    setInterval(() => { autoReset(); render(); }, 60000);
  });
})();
